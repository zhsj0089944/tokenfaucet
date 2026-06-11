import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/drizzle/schemas/users";
import { db } from "@/lib/db";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const username = searchParams.get("username")?.trim();

	if (!username || username.length < 3 || username.length > 20) {
		return NextResponse.json({ available: false });
	}

	const existing = await db.query.users.findFirst({
		where: eq(users.fullName, username),
	});

	return NextResponse.json({ available: !existing });
}
