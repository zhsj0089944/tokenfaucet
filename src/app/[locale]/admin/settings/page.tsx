"use client";

import {
	CreditCard,
	Globe,
	Hash,
	Key,
	Loader2,
	Plus,
	Save,
	Search,
	Settings,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ElementType } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/server/client";

const categoryIcons: Record<string, ElementType> = {
	general: Globe,
	payment: CreditCard,
	tts: Zap,
	points: Hash,
	invitation: Hash,
};

export default function AdminSettingsPage() {
	const t = useTranslations("admin.settings");
	const editableId = useId();
	const secretId = useId();
	const [search, setSearch] = useState("");
	const [editingValues, setEditingValues] = useState<Record<string, string>>({});
	const [activeCategory, setActiveCategory] = useState("all");
	const [createOpen, setCreateOpen] = useState(false);
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const [newCategory, setNewCategory] = useState("tts");
	const [newDataType, setNewDataType] = useState("string");
	const [newIsEditable, setNewIsEditable] = useState(true);
	const [newIsSecret, setNewIsSecret] = useState(false);

	const utils = trpc.useUtils();

	const { data: configs, isLoading } = trpc.system.getConfigs.useQuery({ includeSecret: false });
	const { data: categories } = trpc.system.getConfigCategories.useQuery();

	const updateConfig = trpc.system.updateConfig.useMutation({
		onSuccess: () => {
			toast.success(t("saved"));
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const createConfig = trpc.system.createConfig.useMutation({
		onSuccess: () => {
			toast.success(t("created"));
			utils.system.getConfigs.invalidate();
			setCreateOpen(false);
			setNewKey("");
			setNewValue("");
			setNewDesc("");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleValueChange = (key: string, value: string) => {
		setEditingValues((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async (key: string) => {
		const value = editingValues[key];
		if (value === undefined) return;
		await updateConfig.mutateAsync({ key, value });
	};

	const formatConfigValue = (value: unknown): string => {
		if (value === null || value === undefined) return "";
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	};

	if (isLoading) {
		return <SettingsSkeleton />;
	}

	const allConfigs = configs || [];

	const filteredConfigs = allConfigs.filter((config) => {
		const matchesSearch =
			!search ||
			config.key.toLowerCase().includes(search.toLowerCase()) ||
			config.description?.toLowerCase().includes(search.toLowerCase());
		const matchesCategory = activeCategory === "all" || config.category === activeCategory;
		return matchesSearch && matchesCategory;
	});

	const groupedConfigs = filteredConfigs.reduce(
		(acc, config) => {
			const cat = config.category || "general";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(config);
			return acc;
		},
		{} as Record<string, typeof allConfigs>,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("subtitle")}</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5" />
								{t("configItems")}
							</CardTitle>
							<CardDescription>{t("configCount", { count: allConfigs.length })}</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Dialog open={createOpen} onOpenChange={setCreateOpen}>
								<DialogTrigger asChild>
									<Button size="sm" variant="outline">
										<Plus className="h-4 w-4 mr-1" />
										{t("newConfig")}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>{t("newConfig")}</DialogTitle>
										<DialogDescription>{t("newConfigDesc")}</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-2">
										<div className="space-y-1">
											<Label>{t("key")}</Label>
											<Input
												value={newKey}
												onChange={(e) => setNewKey(e.target.value)}
												placeholder="tts.apiKey"
											/>
										</div>
										<div className="space-y-1">
											<Label>{t("value")}</Label>
											<Input
												value={newValue}
												onChange={(e) => setNewValue(e.target.value)}
												placeholder='""'
											/>
										</div>
										<div className="space-y-1">
											<Label>{t("description")}</Label>
											<Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<Label>{t("category")}</Label>
												<Select value={newCategory} onValueChange={setNewCategory}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{["general", "payment", "tts", "points", "invitation"].map((cat) => (
															<SelectItem key={cat} value={cat}>
																{t(`categories.${cat}`, { defaultValue: cat })}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1">
												<Label>{t("dataType")}</Label>
												<Select value={newDataType} onValueChange={setNewDataType}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{["string", "number", "boolean", "json"].map((dt) => (
															<SelectItem key={dt} value={dt}>
																{dt}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="flex items-center gap-6">
											<div className="flex items-center gap-2">
												<Switch
													id={editableId}
													checked={newIsEditable}
													onCheckedChange={setNewIsEditable}
												/>
												<Label htmlFor={editableId}>{t("editable")}</Label>
											</div>
											<div className="flex items-center gap-2">
												<Switch
													id={secretId}
													checked={newIsSecret}
													onCheckedChange={setNewIsSecret}
												/>
												<Label htmlFor={secretId}>{t("sensitive")}</Label>
											</div>
										</div>
									</div>
									<DialogFooter>
										<Button variant="outline" onClick={() => setCreateOpen(false)}>
											{t("cancel")}
										</Button>
										<Button
											onClick={() =>
												createConfig.mutate({
													key: newKey,
													value:
														newDataType === "number"
															? Number(newValue)
															: newDataType === "boolean"
																? newValue === "true"
																: newValue,
													description: newDesc || undefined,
													category: newCategory as
														| "general"
														| "payment"
														| "tts"
														| "points"
														| "invitation",
													dataType: newDataType as "string" | "number" | "boolean" | "json",
													isEditable: newIsEditable,
													isSecret: newIsSecret,
												})
											}
											disabled={!newKey || createConfig.isPending}
										>
											{createConfig.isPending ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												t("create")
											)}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder={t("searchPlaceholder")}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 w-64"
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs value={activeCategory} onValueChange={setActiveCategory}>
						<TabsList className="mb-4 flex flex-wrap h-auto">
							<TabsTrigger value="all">{t("all")}</TabsTrigger>
							{categories?.map((cat) => (
								<TabsTrigger key={cat} value={cat}>
									{categoryLabels[cat] ? t(`categories.${cat}`) : cat}
								</TabsTrigger>
							))}
						</TabsList>

						<TabsContent value={activeCategory} className="mt-0">
							<div className="space-y-6">
								{Object.entries(groupedConfigs).map(([category, items]) => {
									const Icon = categoryIcons[category] || Settings;
									return (
										<div key={category}>
											<div className="flex items-center gap-2 mb-3">
												<Icon className="h-4 w-4 text-muted-foreground" />
												<h3 className="font-semibold text-sm">
													{t(`categories.${category}`, { defaultValue: category })}
												</h3>
												<Badge variant="secondary" className="text-xs">
													{items.length}
												</Badge>
											</div>
											<div className="rounded-lg border divide-y">
												{items.map((config) => (
													<div
														key={config.key}
														className="p-4 flex flex-col sm:flex-row sm:items-center gap-4"
													>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
																	{config.key}
																</code>
																{config.isSecret && (
																	<Badge variant="destructive" className="text-xs">
																		<Key className="h-3 w-3 mr-1" />
																		{t("sensitive")}
																	</Badge>
																)}
																{!config.isEditable && (
																	<Badge variant="secondary" className="text-xs">
																		{t("readOnly")}
																	</Badge>
																)}
															</div>
															{config.description && (
																<p className="text-sm text-muted-foreground mt-1">
																	{config.description}
																</p>
															)}
														</div>
														<div className="flex items-center gap-2 sm:w-80">
															<Input
																value={editingValues[config.key] ?? formatConfigValue(config.value)}
																onChange={(e) => handleValueChange(config.key, e.target.value)}
																disabled={!config.isEditable || updateConfig.isPending}
																className="flex-1"
															/>
															{config.isEditable && (
																<Button
																	size="sm"
																	onClick={() => handleSave(config.key)}
																	disabled={
																		updateConfig.isPending ||
																		editingValues[config.key] === undefined ||
																		editingValues[config.key] === formatConfigValue(config.value)
																	}
																>
																	{updateConfig.isPending ? (
																		<Loader2 className="h-4 w-4 animate-spin" />
																	) : (
																		<Save className="h-4 w-4" />
																	)}
																</Button>
															)}
														</div>
													</div>
												))}
											</div>
										</div>
									);
								})}
								{filteredConfigs.length === 0 && (
									<div className="text-center py-12 text-muted-foreground">{t("noResults")}</div>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

const categoryLabels: Record<string, string> = {
	general: "general",
	payment: "payment",
	tts: "tts",
	points: "points",
	invitation: "invitation",
};

function SettingsSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48 mb-2" />
			<Skeleton className="h-5 w-64 mb-6" />
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-10 w-full mb-4" />
					<div className="space-y-3">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
