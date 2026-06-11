"use client";

import { useAuth } from "@/hooks/auth";
import { trpc } from "@/server/client";

export function usePointsBalance() {
	const { user, isAuthenticated } = useAuth();

	const { data, isLoading, error, refetch } = trpc.tts.getPointsBalance.useQuery(undefined, {
		enabled: isAuthenticated && !!user,
		staleTime: 10 * 1000,
		gcTime: 2 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnMount: "always",
		retry: (failureCount, err) => {
			if (err?.data?.code === "UNAUTHORIZED") return false;
			return failureCount < 2;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	return {
		points: data
			? {
					dailyBalance: data.dailyBalance,
					monthlyBalance: data.monthlyBalance,
					totalBalance: data.totalBalance,
					dailyPoints: data.dailyPoints,
					monthlyPoints: data.monthlyPoints,
					isSubscribed: data.isSubscribed,
					planName: data.planName,
				}
			: null,
		isLoading,
		error,
		refetch,
	};
}
