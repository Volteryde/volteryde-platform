'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
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
}

export const MetricCard = ({ title, amount, description, tooltipText, color = "text-primary" }: MetricCardProps) => {
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
				<div className={`text-2xl font-bold ${color}`}>{amount}</div>
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
			</CardContent>
		</Card>
	);
};
