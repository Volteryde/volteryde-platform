'use client';
import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserTable } from './components/UserTable';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UsersPage() {
	const [currentRole, setCurrentRole] = useState('ALL');

	const roles = [
		{ label: 'All', value: 'ALL', color: 'data-[state=active]:bg-gray-600' },
		{ label: 'Admins', value: 'ADMIN', color: 'data-[state=active]:bg-red-600' },
		{ label: 'Drivers', value: 'DRIVER', color: 'data-[state=active]:bg-blue-600' },
		{ label: 'Support', value: 'SUPPORT', color: 'data-[state=active]:bg-purple-600' },
		{ label: 'Fleet Ops', value: 'FLEET_MANAGER', color: 'data-[state=active]:bg-orange-600' },
		{ label: 'Dispatch', value: 'DISPATCHER', color: 'data-[state=active]:bg-cyan-600' },
		{ label: 'BI Partners', value: 'BI_PARTNER', color: 'data-[state=active]:bg-indigo-600' },
		{ label: 'Users', value: 'USER', color: 'data-[state=active]:bg-slate-600' },
	];

	return (
		<PageContainer scrollable={true}>
			<div className="flex flex-1 flex-col space-y-4">
				<div className="flex items-center justify-between">
					<Heading
						title={`User Management`}
						description="Manage users, roles, and permissions."
					/>
					<Button>
						<Plus className="mr-2 h-4 w-4" /> Add Bi-Partner
					</Button>
				</div>
				<Separator />

				<Tabs defaultValue="ALL" className="w-full" onValueChange={setCurrentRole}>
					<TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
						{roles.map((role) => (
							<TabsTrigger
								key={role.value}
								value={role.value}
								className={`data-[state=active]:text-white px-4 py-2 rounded-full border border-muted ${role.color}`}
							>
								{role.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<UserTable roleFilter={currentRole} />
			</div>
		</PageContainer>
	);
}
