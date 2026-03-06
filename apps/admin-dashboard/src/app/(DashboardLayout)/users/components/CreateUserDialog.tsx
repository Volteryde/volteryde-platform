'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// Austin — Valid roles matching svc_auth.roles and svc_users.users role constraints
const VALID_ROLES = [
	'SUPER_ADMIN',
	'ADMIN',
	'DISPATCHER',
	'CUSTOMER_SUPPORT',
	'SYSTEM_SUPPORT',
	'PARTNER',
	'DRIVER',
	'FLEET_MANAGER',
] as const;

const formSchema = z.object({
	firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
	lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
	email: z.string().email({ message: 'Invalid email address.' }),
	phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 characters.' }),
	password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
	role: z.enum(VALID_ROLES),
});

interface CreateUserDialogProps {
	onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	// Austin — Password visibility toggle to prevent blind typing errors
	const [showPassword, setShowPassword] = useState(false);
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			phoneNumber: '',
			password: '',
			role: 'DISPATCHER',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		try {
			// Austin — Call the single provision endpoint that writes to all DBs atomically
			const res = await fetch('/api/users/provision', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify(values),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to create user');
			}

			toast({
				title: 'User created successfully',
				description: (
					<div className="flex flex-col gap-2">
						<p>{values.firstName} {values.lastName} has been added as {values.role}.</p>
						<p className="font-medium">Access ID: <span className="font-mono bg-slate-100 px-1 rounded">{data.user.accessId}</span></p>
						<p className="text-xs text-muted-foreground">Please copy this ID for the user.</p>
					</div>
				),
				duration: 10000,
			});

			setOpen(false);
			form.reset();
			if (onUserCreated) {
				onUserCreated();
			}
		} catch (error) {
			console.error('Failed to create user:', error);
			toast({
				variant: 'destructive',
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to create user. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" /> Add User
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create New User</DialogTitle>
					<DialogDescription>
						Add a new user to the platform. They will receive an email with login instructions.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input placeholder="John" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input placeholder="Doe" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="john.doe@volteryde.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<Input placeholder="+233..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										{/* Austin — Show/hide toggle to prevent blind typing errors
										    with complex passwords like V0lt3ryd3@P4rtner!2026 */}
										<div className="relative">
											<Input
												type={showPassword ? 'text' : 'password'}
												placeholder="••••••••"
												{...field}
											/>
											<button
												type="button"
												className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
											>
												{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="ADMIN">Admin</SelectItem>
											<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
											<SelectItem value="PARTNER">BI Partner</SelectItem>
											<SelectItem value="DISPATCHER">Dispatcher</SelectItem>
											<SelectItem value="CUSTOMER_SUPPORT">Customer Care</SelectItem>
											<SelectItem value="SYSTEM_SUPPORT">System Support</SelectItem>
											<SelectItem value="DRIVER">Driver</SelectItem>
											<SelectItem value="FLEET_MANAGER">Fleet Manager</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Create User
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
