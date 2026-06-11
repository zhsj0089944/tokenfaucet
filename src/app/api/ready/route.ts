import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Readiness check endpoint for k8s/orchestrator
 * Checks database connectivity
 */
export async function GET() {
	try {
		const dbHealthy = await checkDatabaseHealth();

		if (!dbHealthy) {
			return NextResponse.json(
				{
					status: "not ready",
					timestamp: new Date().toISOString(),
					checks: {
						database: "unhealthy",
					},
				},
				{ status: 503 },
			);
		}

		return NextResponse.json(
			{
				status: "ready",
				timestamp: new Date().toISOString(),
				checks: {
					database: "healthy",
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 503 },
		);
	}
}
