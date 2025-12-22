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

const users = [
	{ id: 'u1', name: 'Alice Johnson', email: 'alice@admin.com', role: 'ADMIN', status: 'ACTIVE' },
	{ id: 'u2', name: 'Bob Smith', email: 'bob@driver.com', role: 'DRIVER', status: 'ACTIVE' },
	{ id: 'u3', name: 'Charlie Brown', email: 'charlie@user.com', role: 'USER', status: 'ACTIVE' },
	{ id: 'u4', name: 'David Lee', email: 'david@support.com', role: 'SUPPORT', status: 'ACTIVE' },
	{ id: 'u5', name: 'Eve Wilson', email: 'eve@fleet.com', role: 'FLEET_MANAGER', status: 'ACTIVE' },
	{ id: 'u6', name: 'Frank Miller', email: 'frank@dispatch.com', role: 'DISPATCHER', status: 'ACTIVE' },
	{ id: 'u7', name: 'Grace Taylor', email: 'grace@bipartner.com', role: 'BI_PARTNER', status: 'PENDING' },
	{ id: 'u8', name: 'Harry Potter', email: 'harry@user.com', role: 'USER', status: 'INACTIVE' },
	{ id: 'u9', name: 'Ian Wright', email: 'ian@driver.com', role: 'DRIVER', status: 'SUSPENDED' },
	{ id: 'u10', name: 'Jane Doe', email: 'jane@admin.com', role: 'ADMIN', status: 'ACTIVE' },
];

interface UserTableProps {
	roleFilter?: string;
}

const roleColors: Record<string, string> = {
	ADMIN: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
	DRIVER: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
	SUPPORT: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
	FLEET_MANAGER: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
	DISPATCHER: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200',
	BI_PARTNER: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200',
	USER: 'bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200',
};

export function UserTable({ roleFilter }: UserTableProps) {
	const filteredUsers = roleFilter && roleFilter !== 'ALL'
		? users.filter(user => user.role === roleFilter)
		: users;

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredUsers.length > 0 ? (
						filteredUsers.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Badge variant="outline" className={`${roleColors[user.role] || 'bg-gray-100 text-gray-800'} border`}>
										{user.role.replace('_', ' ')}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
									>
										{user.status}
									</Badge>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								No users found.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
