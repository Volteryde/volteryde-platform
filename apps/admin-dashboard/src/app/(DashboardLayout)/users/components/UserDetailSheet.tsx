'use client';

import { Copy, Check, Mail, Phone, Car, MapPin, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetTitle,
} from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
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
			setCopiedField(label);
			setTimeout(() => setCopiedField(null), 2000);
			toast({ description: `${label} copied`, duration: 2000 });
		} catch {
			// ignore
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric',
		});
	};

	const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
				<VisuallyHidden.Root>
					<SheetTitle>{user.firstName} {user.lastName} — User Details</SheetTitle>
				</VisuallyHidden.Root>

				{/* ── Avatar + name ── */}
				<div className="p-6 flex items-center gap-4 border-b">
					<div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
						{user.profilePictureUrl ? (
							<img
								src={user.profilePictureUrl}
								alt={`${user.firstName} ${user.lastName}`}
								className="h-full w-full object-cover"
							/>
						) : (
							<span className="text-lg font-semibold text-muted-foreground">{initials}</span>
						)}
					</div>
					<div className="min-w-0">
						<p className="text-base font-semibold truncate">
							{user.firstName} {user.lastName}
						</p>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="outline" className="text-xs font-normal">
								{user.role.replace(/_/g, ' ')}
							</Badge>
							<span className={`h-2 w-2 rounded-full shrink-0 ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
							<span className="text-xs text-muted-foreground">{user.status}</span>
						</div>
					</div>
				</div>

				{/* ── Access ID ── */}
				<div className="px-6 py-4 border-b">
					<p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Access ID</p>
					<div className="flex items-center justify-between border rounded-sm px-4 py-3">
						<span className="font-mono text-lg font-semibold tracking-wider">
							{user.userId || '—'}
						</span>
						{user.userId && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 shrink-0"
								onClick={() => copyToClipboard(user.userId!, 'Access ID')}
							>
								{copiedField === 'Access ID'
									? <Check className="h-4 w-4" />
									: <Copy className="h-4 w-4 text-muted-foreground" />}
							</Button>
						)}
					</div>
				</div>

				<div className="p-6 flex flex-col gap-6">

					{/* ── Contact ── */}
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Contact</p>

						<div className="flex items-center justify-between py-2">
							<div className="flex items-center gap-3 min-w-0">
								<Mail className="h-4 w-4 text-muted-foreground shrink-0" />
								<span className="text-sm truncate">{user.email}</span>
							</div>
							<Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
								onClick={() => copyToClipboard(user.email, 'Email')}>
								{copiedField === 'Email' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
							</Button>
						</div>

						<div className="flex items-center justify-between py-2">
							<div className="flex items-center gap-3 min-w-0">
								<Phone className="h-4 w-4 text-muted-foreground shrink-0" />
								<span className="text-sm truncate">{user.phoneNumber || 'No phone'}</span>
							</div>
							{user.phoneNumber && (
								<Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
									onClick={() => copyToClipboard(user.phoneNumber!, 'Phone')}>
									{copiedField === 'Phone' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
								</Button>
							)}
						</div>
					</div>

					{/* ── Driver info ── */}
					{user.role === 'DRIVER' && user.driverProfile && (
						<>
							<Separator />
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-2">
									<Car className="h-3.5 w-3.5" /> Driver Details
								</p>
								{[
									['License', user.driverProfile.licenseNumber],
									['Experience', `${user.driverProfile.yearsOfExperience} yrs`],
									['Vehicle', user.driverProfile.vehicleAssignedId || 'Unassigned'],
									['Status', user.driverProfile.status],
								].map(([label, value]) => (
									<div key={label} className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">{label}</span>
										<span className="font-medium font-mono">{value}</span>
									</div>
								))}
							</div>
						</>
					)}

					{/* ── Fleet manager info ── */}
					{user.role === 'FLEET_MANAGER' && user.fleetManagerProfile && (
						<>
							<Separator />
							<div className="space-y-3">
								<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-2">
									<MapPin className="h-3.5 w-3.5" /> Fleet Details
								</p>
								{[
									['Region', user.fleetManagerProfile.assignedRegion],
									['Hub', user.fleetManagerProfile.hubId || 'N/A'],
								].map(([label, value]) => (
									<div key={label} className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">{label}</span>
										<span className="font-medium">{value}</span>
									</div>
								))}
							</div>
						</>
					)}

					<Separator />

					{/* ── Documents ── */}
					<div className="space-y-3">
						<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-2">
							<FileText className="h-3.5 w-3.5" /> Documents
						</p>
						<p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-sm">
							No documents available
						</p>
					</div>

					<Separator />

					{/* ── Metadata ── */}
					<div className="space-y-3">
						<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">System Info</p>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-xs text-muted-foreground mb-1">Created</p>
								<p className="font-mono text-xs">{formatDate(user.createdAt)}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1">Updated</p>
								<p className="font-mono text-xs">{formatDate(user.updatedAt)}</p>
							</div>
							{user.createdBy && (
								<div className="col-span-2">
									<p className="text-xs text-muted-foreground mb-1">Created By</p>
									<p className="font-mono text-xs">{user.createdBy}</p>
								</div>
							)}
						</div>
					</div>

				</div>
			</SheetContent>
		</Sheet>
	);
}
