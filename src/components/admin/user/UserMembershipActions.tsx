"use client";

import { Calendar, Gift, XCircle } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/server/client";

interface MembershipInfo {
	id: string;
	planId: string;
	planName: string;
	status: string;
	startDate: Date;
	endDate: Date;
	durationType: string;
	autoRenew: boolean | null;
}

interface UserMembershipActionsProps {
	userId: string;
	membership: MembershipInfo | null;
}

export function UserMembershipActions({ userId, membership }: UserMembershipActionsProps) {
	const formId = useId();
	const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
	const [extendDays, setExtendDays] = useState(30);
	const [activateDays, setActivateDays] = useState(30);
	const [selectedPlanId, setSelectedPlanId] = useState("");
	const [reason, setReason] = useState("");

	const utils = trpc.useUtils();

	// 获取会员计划列表
	const { data: plans } = trpc.payments.getMembershipPlans.useQuery();

	const extendMutation = trpc.adminUsers.adminExtendMembership.useMutation({
		onSuccess: () => {
			toast.success("会员延期成功");
			setIsExtendDialogOpen(false);
			setExtendDays(30);
			setReason("");
			// 刷新用户列表和管理员用户会员详情缓存
			utils.adminUsers.getUsers.invalidate();
			utils.adminUsers.getUserMembershipDetail.invalidate({ userId });
		},
		onError: (error) => {
			toast.error(error.message || "延期失败");
		},
	});

	const cancelMutation = trpc.adminUsers.adminCancelMembership.useMutation({
		onSuccess: () => {
			toast.success("会员已取消");
			setIsCancelDialogOpen(false);
			setReason("");
			// 刷新用户列表和管理员用户会员详情缓存
			utils.adminUsers.getUsers.invalidate();
			utils.adminUsers.getUserMembershipDetail.invalidate({ userId });
		},
		onError: (error) => {
			toast.error(error.message || "取消失败");
		},
	});

	const activateMutation = trpc.adminUsers.adminActivateMembership.useMutation({
		onSuccess: () => {
			toast.success("会员激活成功");
			setIsActivateDialogOpen(false);
			setActivateDays(30);
			setSelectedPlanId("");
			setReason("");
			// 刷新用户列表和管理员用户会员详情缓存
			utils.adminUsers.getUsers.invalidate();
			utils.adminUsers.getUserMembershipDetail.invalidate({ userId });
		},
		onError: (error) => {
			toast.error(error.message || "激活失败");
		},
	});

	const handleExtend = () => {
		extendMutation.mutate({
			userId,
			days: extendDays,
		});
	};

	const handleCancel = () => {
		cancelMutation.mutate({
			userId,
			reason: reason || undefined,
		});
	};

	const handleActivate = () => {
		if (!selectedPlanId) {
			toast.error("请选择会员计划");
			return;
		}
		activateMutation.mutate({
			userId,
			planId: selectedPlanId,
			durationDays: activateDays,
			reason: reason || undefined,
		});
	};

	const endDate = membership?.endDate ? new Date(membership.endDate) : null;
	const isExpired = endDate ? endDate < new Date() : true;
	const daysRemaining = endDate
		? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
		: 0;

	return (
		<div className="flex items-center space-x-1">
			{/* 激活/赠送会员按钮 */}
			<Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" size="sm" title="激活/赠送会员">
						<Gift className="h-4 w-4 text-green-500" />
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>激活/赠送会员</DialogTitle>
						<DialogDescription>
							为用户手动激活或赠送会员
							{membership && (
								<span className="block mt-1 text-sm">
									当前计划: {membership.planName} | 状态: {membership.status}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor={`${formId}-planId`}>会员计划</Label>
							<select
								id={`${formId}-planId`}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={selectedPlanId}
								onChange={(e) => setSelectedPlanId(e.target.value)}
							>
								<option value="">请选择计划</option>
								{plans?.map((plan) => (
									<option key={plan.id as string} value={plan.id as string}>
										{(plan.nameZh as string | null) || (plan.name as string)}
									</option>
								))}
							</select>
						</div>
						<div>
							<Label htmlFor={`${formId}-activateDays`}>激活天数</Label>
							<Input
								id={`${formId}-activateDays`}
								type="number"
								min={1}
								max={3650}
								value={activateDays}
								onChange={(e) => setActivateDays(Number.parseInt(e.target.value, 10) || 30)}
							/>
						</div>
						<div>
							<Label htmlFor={`${formId}-activateReason`}>备注（可选）</Label>
							<Textarea
								id={`${formId}-activateReason`}
								placeholder="激活原因..."
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsActivateDialogOpen(false)}>
							取消
						</Button>
						<Button onClick={handleActivate} disabled={activateMutation.isPending}>
							{activateMutation.isPending ? "处理中..." : "确认激活"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 延期按钮 */}
			<Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" size="sm" title="延期会员">
						<Calendar className="h-4 w-4 text-blue-500" />
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>延期会员</DialogTitle>
						<DialogDescription>
							为用户延长会员有效期
							{membership && (
								<span className="block mt-1 text-sm">
									当前计划: {membership.planName} | 到期: {endDate?.toLocaleDateString()}
									{!isExpired && ` (剩余 ${daysRemaining} 天)`}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor={`${formId}-extendDays`}>延期天数</Label>
							<Input
								id={`${formId}-extendDays`}
								type="number"
								min={1}
								max={3650}
								value={extendDays}
								onChange={(e) => setExtendDays(Number.parseInt(e.target.value, 10) || 30)}
							/>
						</div>
						<div>
							<Label htmlFor={`${formId}-reason`}>备注（可选）</Label>
							<Textarea
								id={`${formId}-reason`}
								placeholder="延期原因..."
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
							取消
						</Button>
						<Button onClick={handleExtend} disabled={extendMutation.isPending}>
							{extendMutation.isPending ? "处理中..." : "确认延期"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 取消按钮 */}
			{membership && membership.status === "active" && (
				<Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm" title="取消会员">
							<XCircle className="h-4 w-4 text-red-500" />
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>取消会员</DialogTitle>
							<DialogDescription>
								确定要取消该用户的会员吗？取消后用户将失去会员权益。
								<span className="block mt-2 text-sm">当前计划: {membership.planName}</span>
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor={`${formId}-cancelReason`}>取消原因（可选）</Label>
								<Textarea
									id={`${formId}-cancelReason`}
									placeholder="取消原因..."
									value={reason}
									onChange={(e) => setReason(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
								取消
							</Button>
							<Button
								variant="destructive"
								onClick={handleCancel}
								disabled={cancelMutation.isPending}
							>
								{cancelMutation.isPending ? "处理中..." : "确认取消"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
