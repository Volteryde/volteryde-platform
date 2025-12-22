import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
	title?: string;
	subtitle?: string;
	action?: React.ReactNode;
	footer?: React.ReactNode;
	children: React.ReactNode;
};

const DashboardCard = ({ title, subtitle, children, action, footer }: Props) => {
	return (
		<Card className="w-full h-full shadow-none border-none">
			<CardHeader className="p-0 mb-6">
				<div className="flex justify-between items-center">
					<div>
						{title ? <CardTitle className="text-xl font-bold">{title}</CardTitle> : ''}
						{subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : ''}
					</div>
					{action ? action : ''}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{children}
			</CardContent>
			{footer ? footer : ''}
		</Card>
	);
};

export default DashboardCard;
