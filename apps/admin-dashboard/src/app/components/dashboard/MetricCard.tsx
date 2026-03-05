'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, AlertCircle } from 'lucide-react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricCardProps {
	title: string;
	amount: string;
	description?: string;
	tooltipText?: string;
	icon?: React.ReactNode;
	color?: string;
	/** Austin — optional loading/error states for live data */
	isLoading?: boolean;
	error?: string | null;
	/** Secondary detail line (e.g. "12 wallets") */
	detail?: string;
}

export const MetricCard = ({
	title,
	amount,
	description,
	tooltipText,
	color = "text-primary",
	isLoading = false,
	error = null,
	detail,
}: MetricCardProps) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">
					{title}
					{tooltipText && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="h-4 w-4 ml-2 inline-block text-muted-foreground cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">{tooltipText}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Austin — Render loading spinner, error, or amount */}
				{isLoading ? (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin" />
						<span className="text-sm">Loading…</span>
					</div>
				) : error ? (
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<span className="text-sm">{error}</span>
					</div>
				) : (
					<div className={`text-2xl font-bold ${color}`}>{amount}</div>
				)}
				{detail && !isLoading && !error && (
					<p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
				)}
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
			</CardContent>
		</Card>
	);
};
