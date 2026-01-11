'use client';

import { Copy, Check, User as UserIcon, Mail, Phone, Shield, Calendar, Key, Activity, Car, MapPin, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import type { User } from '@volteryde/api-client';

interface UserDetailSheetProps {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
	const { toast } = useToast();

	const [copiedField, setCopiedField] = useState<string | null>(null);

	if (!user) return null;

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);

			// Visual feedback
			setCopiedField(label);
			setTimeout(() => setCopiedField(null), 2000);

			// Haptic feedback
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}

			toast({
				description: `${label} copied to clipboard`,
				duration: 2000,
			});
		} catch (err) {
			console.error('Failed to copy', err);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString();
	};

	const roleColors: Record<string, string> = {
		ADMIN: 'bg-red-100 text-red-800 border-red-200',
		DRIVER: 'bg-blue-100 text-blue-800 border-blue-200',
		SUPPORT: 'bg-purple-100 text-purple-800 border-purple-200',
		SYSTEM_SUPPORT: 'bg-purple-100 text-purple-800 border-purple-200',
		FLEET_MANAGER: 'bg-orange-100 text-orange-800 border-orange-200',
		DISPATCHER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[480px] sm:w-[600px] overflow-y-auto p-0">
				{/* Header Section */}
				<div className="bg-primary/5 p-6 border-b">
					<SheetHeader className="mb-6">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden border-2 border-background shadow-sm">
									{user.profilePictureUrl ? (
										<img src={user.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
									) : (
										<UserIcon className="h-8 w-8" />
									)}
								</div>
								<div>
									<SheetTitle className="text-2xl font-bold tracking-tight">
										{user.firstName} {user.lastName}
									</SheetTitle>
									<SheetDescription asChild className="text-base text-muted-foreground flex items-center gap-2">
										<div className="text-base text-muted-foreground flex items-center gap-2">
											<Badge variant="outline" className="font-mono bg-background text-foreground/80">
												{user.role.replace('_', ' ')}
											</Badge>
											•
											<span className="flex items-center gap-1">
												<span className={`h-2 w-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
												{user.status}
											</span>
										</div>
									</SheetDescription>
								</div>
							</div>
						</div>
					</SheetHeader>

					{/* Access ID Card */}
					<div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm flex items-center justify-between">
						<div>
							<div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1 uppercase tracking-wide">
								<Key className="h-3 w-3" /> Access ID
							</div>
							<span className="text-2xl font-bold font-mono text-primary tracking-tight">
								{user.userId || 'N/A'}
							</span>
						</div>
						{user.userId && (
							<Button
								variant="ghost"
								size="icon"
								className={`h-9 w-9 transition-all ${copiedField === 'Access ID'
									? "text-green-600 bg-green-50 dark:bg-green-900/20"
									: "hover:bg-muted"
									}`}
								onClick={() => copyToClipboard(user.userId!, 'Access ID')}
							>
								{copiedField === 'Access ID' ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
							</Button>
						)}
					</div>
				</div>

				<div className="p-6 space-y-8">
					{/* Personal Information */}
					<div className="space-y-4">
						<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<UserIcon className="h-4 w-4" /> Personal Details
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div className="bg-muted/30 p-3 rounded-lg border border-border/50">
								<span className="text-xs text-muted-foreground block mb-1">Full Name</span>
								<span className="font-medium">{user.firstName} {user.lastName}</span>
							</div>
							<div className="bg-muted/30 p-3 rounded-lg border border-border/50">
								<span className="text-xs text-muted-foreground block mb-1">Role</span>
								<span className="font-medium">{user.role}</span>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
								<div className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium text-sm">{user.email}</span>
								</div>
								<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(user.email, 'Email')}>
									{copiedField === 'Email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
								</Button>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
								<div className="flex items-center gap-3">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium text-sm">{user.phoneNumber || 'N/A'}</span>
								</div>
								{user.phoneNumber && (
									<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(user.phoneNumber!, 'Phone Number')}>
										{copiedField === 'Phone Number' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
									</Button>
								)}
							</div>
						</div>
					</div>

					<Separator className="bg-border/60" />

					{/* Role Specific Details - Driver */}
					{user.role === 'DRIVER' && user.driverProfile && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<Car className="h-4 w-4" /> Driver Information
							</h3>

							<div className="grid grid-cols-1 gap-3">
								<div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
									<div className="flex justify-between items-center mb-2">
										<span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">License Information</span>
										<Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200">Verified</Badge>
									</div>
									<div className="flex justify-between items-baseline">
										<span className="text-sm text-muted-foreground">License Number</span>
										<span className="font-mono font-medium text-lg">{user.driverProfile.licenseNumber}</span>
									</div>
									<div className="flex justify-between items-baseline mt-2 pt-2 border-t border-blue-200/50">
										<span className="text-sm text-muted-foreground">Experience</span>
										<span className="font-medium">{user.driverProfile.yearsOfExperience} Years</span>
									</div>
									<div className="flex justify-between items-baseline mt-2 pt-2 border-t border-blue-200/50">
										<span className="text-sm text-muted-foreground">Vehicle Assigned</span>
										<span className="font-medium">{user.driverProfile.vehicleAssignedId || 'N/A'}</span>
									</div>
									<div className="flex justify-between items-baseline mt-2 pt-2 border-t border-blue-200/50">
										<span className="text-sm text-muted-foreground">Status</span>
										<Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200">{user.driverProfile.status}</Badge>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Role Specific Details - Fleet Manager */}
					{user.role === 'FLEET_MANAGER' && user.fleetManagerProfile && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<MapPin className="h-4 w-4" /> Fleet Management
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<div className="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
									<span className="text-xs text-orange-700 dark:text-orange-400 font-semibold block mb-1">Region</span>
									<span className="font-medium text-sm">{user.fleetManagerProfile.assignedRegion}</span>
								</div>
								<div className="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
									<span className="text-xs text-orange-700 dark:text-orange-400 font-semibold block mb-1">Hub ID</span>
									<span className="font-medium text-sm">{user.fleetManagerProfile.hubId || 'N/A'}</span>
								</div>
							</div>
						</div>
					)}

					<Separator className="bg-border/60" />

					{/* Contracts & Documents (Placeholder) */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<FileText className="h-4 w-4" /> Contracts & Documents
							</h3>
							<Badge variant="secondary" className="text-[10px] h-5">0 Files</Badge>
						</div>

						<div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
							No documents or contracts available for this user.
						</div>
					</div>

					<Separator className="bg-border/60" />

					{/* Metadata */}
					<div className="space-y-3 pt-2">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
							System Metadata
						</h3>
						<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
							<div>
								<span className="block mb-1">Created At</span>
								<span className="font-mono text-foreground">{formatDate(user.createdAt)}</span>
							</div>
							<div>
								<span className="block mb-1">Updated At</span>
								<span className="font-mono text-foreground">{user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</span>
							</div>
							{user.createdBy && (
								<div className="col-span-2">
									<span className="block mb-1">Created By</span>
									<span className="font-mono text-foreground">{user.createdBy}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet >
	);
}
