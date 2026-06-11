import { trpc } from "@/server/client";

/**
 * 认证相关hooks
 */
export function useAuth() {
	const utils = trpc.useUtils();
	const { data: user, isLoading } = trpc.auth.getCurrentUser.useQuery();
	const { data: authStatus } = trpc.auth.checkAuthStatus.useQuery();

	const updateProfile = trpc.auth.updateProfile.useMutation({
		onSuccess: () => {
			// 更新成功后刷新用户数据
			utils.auth.getCurrentUser.invalidate();
		},
	});

	return {
		user,
		isLoading,
		isAuthenticated: Boolean(authStatus?.isAuthenticated),
		isAdmin: Boolean(authStatus?.isAdmin),
		updateProfile,
	};
}

/**
 * 用户管理hooks（管理员）
 */
export function useUsers(params?: Parameters<typeof trpc.adminUsers.getUsers.useQuery>[0]) {
	const utils = trpc.useUtils();
	const usersQuery = trpc.adminUsers.getUsers.useQuery(params ?? {});
	const userStatsQuery = trpc.adminUsers.getUserStats.useQuery();

	const updateUser = trpc.adminUsers.updateUser.useMutation({
		onSuccess: () => {
			// 更新成功后刷新用户列表
			utils.adminUsers.getUsers.invalidate();
			utils.adminUsers.getUserStats.invalidate();
		},
	});

	const toggleUserStatus = trpc.adminUsers.toggleUserStatus.useMutation({
		onSuccess: () => {
			utils.adminUsers.getUsers.invalidate();
			utils.adminUsers.getUserStats.invalidate();
		},
	});

	return {
		usersQuery,
		userStatsQuery,
		updateUser,
		toggleUserStatus,
	};
}

/**
 * 支付和会员相关hooks
 */
export function usePayments() {
	const utils = trpc.useUtils();

	const { data: membershipPlans, isLoading: plansLoading } =
		trpc.payments.getMembershipPlans.useQuery();

	const { data: membershipStatus, isLoading: statusLoading } =
		trpc.payments.getUserMembershipStatus.useQuery();

	const activateMembership = trpc.payments.activateMembership.useMutation({
		onSuccess: () => {
			// 激活成功后刷新会员状态
			utils.payments.getUserMembershipStatus.invalidate();
		},
	});

	return {
		membershipPlans,
		plansLoading,
		membershipStatus,
		statusLoading,
		activateMembership,
		// 便捷访问器
		hasActiveMembership: Boolean(membershipStatus?.hasActiveMembership),
		currentPlan: membershipStatus?.currentPlan,
		remainingDays: membershipStatus?.remainingDays || 0,
	};
}
