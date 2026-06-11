import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function toError(e: unknown): Error {
	return e instanceof Error ? e : new Error(String(e));
}

export async function POST(req: NextRequest) {
	try {
		if (!resend) {
			return NextResponse.json({ error: "Resend not configured" }, { status: 500 });
		}

		const forwardTo = env.SUPPORT_FORWARD_EMAIL;
		if (!forwardTo) {
			return NextResponse.json({ error: "SUPPORT_FORWARD_EMAIL not configured" }, { status: 500 });
		}

		const rawBody = await req.text();

		if (env.RESEND_WEBHOOK_SECRET) {
			try {
				resend.webhooks.verify({
					payload: rawBody,
					headers: {
						id: req.headers.get("svix-id") || "",
						timestamp: req.headers.get("svix-timestamp") || "",
						signature: req.headers.get("svix-signature") || "",
					} satisfies { id: string; timestamp: string; signature: string },
					webhookSecret: env.RESEND_WEBHOOK_SECRET,
				});
			} catch {
				logger.warn("[Email Inbound] Invalid webhook signature");
				return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
			}
		}

		const body = JSON.parse(rawBody);

		if (body.type !== "email.received") {
			return NextResponse.json({ ok: true });
		}

		const emailId = body.data?.email_id;
		if (!emailId) {
			return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
		}

		const { data: email, error: emailError } = await resend.emails.receiving.get(emailId);
		if (emailError || !email) {
			logger.error("[Email Inbound] Failed to fetch email", toError(emailError));
			return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
		}

		const { data: attachmentsData, error: attachmentsError } =
			await resend.emails.receiving.attachments.list({ emailId });
		if (attachmentsError) {
			logger.warn("[Email Inbound] Failed to fetch attachments", {
				error: String(attachmentsError),
			});
		}

		const attachments: { filename: string; content: string; content_type?: string }[] = [];
		if (attachmentsData?.data) {
			for (const attachment of attachmentsData.data) {
				try {
					const resp = await fetch(attachment.download_url);
					const buffer = Buffer.from(await resp.arrayBuffer());
					attachments.push({
						filename: attachment.filename || "attachment",
						content: buffer.toString("base64"),
						content_type: attachment.content_type,
					});
				} catch (err) {
					logger.warn("[Email Inbound] Failed to download attachment", { error: String(err) });
				}
			}
		}

		const { error: sendError } = await resend.emails.send({
			from: "TokenFaucet Support <support@tokenfaucet.fun>",
			to: forwardTo,
			subject: `[Support] ${email.subject || "(no subject)"}`,
			html: email.html || email.text || "",
			text: email.text || "",
			attachments: attachments.length > 0 ? attachments : undefined,
			headers: {
				"In-Reply-To": email.headers?.["message-id"] || "",
				References: email.headers?.["message-id"] || "",
			},
		});

		if (sendError) {
			logger.error("[Email Inbound] Failed to forward email", toError(sendError));
			return NextResponse.json({ error: "Failed to forward" }, { status: 500 });
		}

		logger.info("[Email Inbound] Forwarded successfully", { emailId, subject: email.subject });
		return NextResponse.json({ ok: true });
	} catch (err) {
		logger.error("[Email Inbound] Error processing webhook", toError(err));
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
