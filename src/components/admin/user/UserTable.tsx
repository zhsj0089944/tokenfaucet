"use client";

import { Crown, Edit, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ADMIN_LEVEL_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/constants/user";
import type { User } from "@/drizzle/schemas";
import { BulkActions } from "./BulkActions";
import { UserMembershipActions } from "./UserMembershipActions";
import { UserTablePagination } from "./UserTablePagination";

interface UserWithMembership extends User {
	membership?: {
		id: string;
		planId: string;
		planName: string;
		status: string;
		startDate: Date;
		endDate: Date;
		durationType: string;
		autoRenew: boolean | null;
	} | null;
}

interface UserTableProps {
	users: UserWithMembership[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export function UserTable({ users, total, page, limit, totalPages }: UserTableProps) {
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedUsers(users.map((user) => user.id));
		} else {
			setSelectedUsers([]);
		}
	};

	const handleSelectUser = (userId: string, checked: boolean) => {
		if (checked) {
			setSelectedUsers((prev) => [...prev, userId]);
		} else {
			setSelectedUsers((prev) => prev.filter((id) => id !== userId));
		}
	};

	const isAllSelected = selectedUsers.length === users.length && users.length > 0;
	const isPartiallySelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

	return (
		<div className="space-y-4">
			{selectedUsers.length > 0 && (
				<BulkActions selectedUserIds={selectedUsers} onSuccess={() => setSelectedUsers([])} />
			)}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-12">
							<Checkbox
								checked={isAllSelected || isPartiallySelected}
								onCheckedChange={handleSelectAll}
							/>
						</TableHead>
						<TableHead>用户</TableHead>
						<TableHead>邮箱</TableHead>
						<TableHead>角色</TableHead>
						<TableHead>会员状态</TableHead>
						<TableHead>账户状态</TableHead>
						<TableHead>注册时间</TableHead>
						<TableHead className="text-right">操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => {
						const initials =
							user.fullName
								?.split(" ")
								.map((n: string) => n[0])
								.join("")
								.toUpperCase() || user.email?.[0]?.toUpperCase();

						return (
							<TableRow key={user.id}>
								<TableCell>
									<Checkbox
										checked={selectedUsers.includes(user.id)}
										onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
									/>
								</TableCell>

								<TableCell>
									<div className="flex items-center space-x-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={user.image || undefined} />
											<AvatarFallback className="text-xs">{initials}</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">{user.fullName || "未设置"}</p>
											<p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
										</div>
									</div>
								</TableCell>

								<TableCell>{user.email}</TableCell>

								<TableCell>
									{user.isAdmin ? (
										<Badge variant="secondary">
											{ADMIN_LEVEL_LABELS[user.adminLevel as keyof typeof ADMIN_LEVEL_LABELS] ||
												ADMIN_LEVEL_LABELS[0]}
										</Badge>
									) : (
										<span className="text-sm text-muted-foreground">普通用户</span>
									)}
								</TableCell>

								<TableCell>
									{user.membership ? (
										<div className="space-y-1">
											<div className="flex items-center gap-1">
												<Crown className="h-3 w-3 text-primary" />
												<span className="text-sm font-medium">{user.membership.planName}</span>
											</div>
											<div className="text-xs text-muted-foreground">
												{user.membership.durationType === "yearly" ? "年付" : "月付"}
												{" · "}
												{user.membership.autoRenew ? "自动续费" : "不续费"}
											</div>
											<div className="text-xs text-muted-foreground">
												到期: {new Date(user.membership.endDate).toLocaleDateString()}
											</div>
										</div>
									) : (
										<span className="text-sm text-muted-foreground">免费用户</span>
									)}
								</TableCell>

								<TableCell>
									<Badge className={user.isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive}>
										{STATUS_LABELS[user.isActive ? "active" : "inactive"]}
									</Badge>
								</TableCell>

								<TableCell className="text-sm text-muted-foreground">
									{user.createdAt?.toLocaleDateString()}
								</TableCell>

								<TableCell className="text-right">
									<div className="flex items-center justify-end space-x-2">
										<UserMembershipActions userId={user.id} membership={user.membership ?? null} />

										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${user.id}`}>
												<Eye className="h-4 w-4" />
											</Link>
										</Button>

										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${user.id}/edit`}>
												<Edit className="h-4 w-4" />
											</Link>
										</Button>

										<Button variant="ghost" size="sm">
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<UserTablePagination page={page} limit={limit} total={total} totalPages={totalPages} />
		</div>
	);
}
