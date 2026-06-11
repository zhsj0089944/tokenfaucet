"use client";

import { Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/client";

export default function TtsVoicesPage() {
	const t = useTranslations("admin.ttsVoices");
	const { data: voiceStats } = trpc.adminTts.getVoiceStats.useQuery();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Tabs defaultValue="preset">
				<TabsList>
					<TabsTrigger value="preset">预置音色</TabsTrigger>
					<TabsTrigger value="custom">用户自定义</TabsTrigger>
				</TabsList>

				<TabsContent value="preset" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>预置音色使用排行</CardTitle>
							<CardDescription>按使用次数排序</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>音色 ID</TableHead>
										<TableHead>使用次数</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{voiceStats?.presetVoices.map((voice) => (
										<TableRow key={voice.voiceId}>
											<TableCell>
												<div className="flex items-center gap-2">
													<Mic className="h-4 w-4 text-muted-foreground" />
													{voice.voiceId}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{voice.count} 次</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="custom" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>用户自定义音色</CardTitle>
							<CardDescription>用户创建的音色</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>名称</TableHead>
										<TableHead>类型</TableHead>
										<TableHead>提供商</TableHead>
										<TableHead>使用次数</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>创建时间</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{voiceStats?.customVoices.map((voice) => (
										<TableRow key={voice.id}>
											<TableCell>{voice.name}</TableCell>
											<TableCell>
												<Badge variant="outline">{voice.voiceType}</Badge>
											</TableCell>
											<TableCell>{voice.provider}</TableCell>
											<TableCell>{voice.usageCount || 0}</TableCell>
											<TableCell>
												<Badge variant={voice.isActive ? "default" : "secondary"}>
													{voice.isActive ? "活跃" : "停用"}
												</Badge>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{voice.createdAt
													? new Date(voice.createdAt).toLocaleDateString("zh-CN")
													: "—"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
