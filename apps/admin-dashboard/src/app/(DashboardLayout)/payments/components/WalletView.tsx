'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function WalletView() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Balance</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">GH₵ 45,231.89</div>
					<p className="text-xs text-muted-foreground">
						+20.1% from last month
					</p>
				</CardContent>
			</Card>
			{/* Search Wallet */}
			<Card className="col-span-2">
				<CardHeader>
					<CardTitle>Lookup Wallet</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex w-full max-w-sm items-center space-x-2">
						<Input type="text" placeholder="User ID or Email" />
						<Button type="submit">
							<Search className="mr-2 h-4 w-4" /> Lookup
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
