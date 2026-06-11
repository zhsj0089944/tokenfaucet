import { Checkout } from "@creem_io/nextjs";

const apiKey = process.env.CREEM_API_KEY;
if (!apiKey) {
	throw new Error("CREEM_API_KEY environment variable is required");
}

export const GET = Checkout({
	apiKey,
	testMode: false,
	defaultSuccessUrl: "/payment/success",
});
