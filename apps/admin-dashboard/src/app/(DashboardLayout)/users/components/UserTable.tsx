'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usersApi, type User, type UserRole, configureApiClient } from '@volteryde/api-client';
import { API_CONFIG } from '@/config/api';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserDetailSheet } from './UserDetailSheet';
import { useAuth } from '@/providers/AuthProvider';

interface UserTableProps {
	roleFilter?: string;
}

const roleColors: Record<string, string> = {
	SUPER_ADMIN: 'bg-red-200 text-red-900 hover:bg-red-200 border-red-300',
	ADMIN: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
	DRIVER: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
	SYSTEM_SUPPORT: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
	CUSTOMER_SUPPORT: 'bg-violet-100 text-violet-800 hover:bg-violet-100 border-violet-200',
	FLEET_MANAGER: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
	DISPATCHER: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200',
	PARTNER: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200',
};

const statusColors: Record<string, string> = {
	ACTIVE: 'default',
	INACTIVE: 'secondary',
	PENDING: 'outline',
	SUSPENDED: 'destructive',
};

// Austin - Display-friendly role names (CUSTOMER_SUPPORT → Customer Care rename)
const roleDisplayNames: Record<string, string> = {
	SUPER_ADMIN: 'SUPER ADMIN',
	ADMIN: 'ADMIN',
	DRIVER: 'DRIVER',
	SYSTEM_SUPPORT: 'SYSTEM SUPPORT',
	CUSTOMER_SUPPORT: 'CUSTOMER CARE',
	FLEET_MANAGER: 'FLEET MANAGER',
	DISPATCHER: 'DISPATCHER',
	PARTNER: 'PARTNER',
};

export function UserTable({ roleFilter }: UserTableProps) {
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { accessToken } = useAuth();

	// User Sheet State by keeping selected User
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleRowClick = (user: User) => {
		setSelectedUser(user);
		setSheetOpen(true);
	};

	const handleCopyId = async (e: MouseEvent, id: string) => {
		e.stopPropagation(); // Prevent row click

		try {
			await navigator.clipboard.writeText(id);

			// Visual feedback
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);

			// Haptic feedback (if supported)
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}

			// Toast feedback
			toast({
				description: "Access ID copied to clipboard",
				duration: 2000,
			});
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	useEffect(() => {
		configureApiClient({
			baseUrl: API_CONFIG.userService.baseUrl,
			getAccessToken: async () => accessToken,
		});
	}, [accessToken]);

	useEffect(() => {
		if (!accessToken) return;

		async function fetchUsers() {
			setIsLoading(true);
			setError(null);
			try {
				const roleParam = roleFilter && roleFilter !== 'ALL'
					? roleFilter as UserRole
					: undefined;
				const data = await usersApi.getUsers({ role: roleParam });
				// Exclude CLIENT role — this page is for internal staff only
				setUsers(data.filter(u => u.role !== 'CLIENT'));
			} catch (err) {
				console.error('Failed to fetch users:', err);
				setError('Failed to load users. Please try again later.');
				setUsers([]);
			} finally {
				setIsLoading(false);
			}
		}
		fetchUsers();
	}, [roleFilter, accessToken]);

	// Loading state
	if (isLoading) {
		return (
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Access ID</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{[1, 2, 3, 4, 5].map((i) => (
							<TableRow key={i}>
								<TableCell><Skeleton className="h-4 w-24" /></TableCell>
								<TableCell><Skeleton className="h-4 w-32" /></TableCell>
								<TableCell><Skeleton className="h-4 w-40" /></TableCell>
								<TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
								<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="rounded-md border p-8 text-center">
				<p className="text-destructive mb-2">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="text-primary hover:underline"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Access ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.length > 0 ? (
						users.map((user) => (
							<TableRow
								key={user.id}
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => handleRowClick(user)}
							>
								<TableCell className="font-mono text-sm relative group">
									<div className="flex items-center gap-2">
										{user.userId || '-'}
										{user.userId && (
											<Button
												variant="ghost"
												size="icon"
												className={`h-6 w-6 transition-all ${copiedId === user.userId
														? "opacity-100 text-green-600 bg-green-50"
														: "opacity-0 group-hover:opacity-100"
													}`}
												onClick={(e) => handleCopyId(e, user.userId!)}
												title="Copy Access ID"
											>
												{copiedId === user.userId ? (
													<Check className="h-3 w-3" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</Button>
										)}
									</div>
								</TableCell>
								<TableCell className="font-medium">
									{user.firstName} {user.lastName}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Badge
										variant="outline"
										className={`${roleColors[user.role] || 'bg-gray-100 text-gray-800'} border`}
									>
										{roleDisplayNames[user.role] || user.role.replace('_', ' ')}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={statusColors[user.status] as "default" | "secondary" | "outline" | "destructive" || 'default'}>
										{user.status}
									</Badge>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={5} className="h-24 text-center">
								No users found.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<UserDetailSheet
				user={selectedUser}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
