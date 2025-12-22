import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionList } from './components/TransactionList';
import { WalletView } from './components/WalletView';

export default function PaymentsPage() {
	return (
		<PageContainer scrollable={true}>
			<div className="flex flex-1 flex-col space-y-4">
				<Heading
					title="Payments & Wallets"
					description="Monitor platform transactions and user wallets."
				/>
				<Separator />

				<Tabs defaultValue="transactions" className="space-y-4">
					<TabsList>
						<TabsTrigger value="transactions">Transactions</TabsTrigger>
						<TabsTrigger value="wallets">Wallets</TabsTrigger>
					</TabsList>
					<TabsContent value="transactions" className="space-y-4">
						<TransactionList />
					</TabsContent>
					<TabsContent value="wallets" className="space-y-4">
						<WalletView />
					</TabsContent>
				</Tabs>
			</div>
		</PageContainer>
	);
}
