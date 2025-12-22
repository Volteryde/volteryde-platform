'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const transactions = [
	{
		id: 'tx_1',
		user: 'Alice Johnson',
		amount: 'GH₵ 50.00',
		type: 'CREDIT',
		status: 'SUCCESS',
		date: '2025-11-20',
	},
	{
		id: 'tx_2',
		user: 'Bob Smith',
		amount: 'GH₵ 25.00',
		type: 'DEBIT',
		status: 'PENDING',
		date: '2025-11-21',
	},
];

export function TransactionList() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Transactions</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{transactions.map((tx) => (
							<TableRow key={tx.id}>
								<TableCell className="font-medium">{tx.user}</TableCell>
								<TableCell>{tx.type}</TableCell>
								<TableCell>{tx.amount}</TableCell>
								<TableCell>
									<Badge
										variant={tx.status === 'SUCCESS' ? 'default' : 'secondary'}
									>
										{tx.status}
									</Badge>
								</TableCell>
								<TableCell>{tx.date}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
