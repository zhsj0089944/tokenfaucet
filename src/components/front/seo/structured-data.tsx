interface ServerStructuredDataProps {
	data: Record<string, unknown>;
	id: string;
}

export function ServerStructuredData({ data, id }: ServerStructuredDataProps) {
	return (
		<script id={id} type="application/ld+json">
			{JSON.stringify(data)}
		</script>
	);
}
