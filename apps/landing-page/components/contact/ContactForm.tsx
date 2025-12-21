'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
	name: z.string().min(2, "Name required."),
	email: z.string().email("Invalid email."),
	message: z.string().min(10, "Message required."),
});

export function ContactForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsSubmitting(true);
		await new Promise(resolve => setTimeout(resolve, 2000));
		setIsSubmitting(false);
		setIsSuccess(true);
	};

	return (
		<div className="w-full">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

				<div className="relative">
					<label className="block text-xs font-semibold uppercase tracking-wider text-[#86868B] mb-2">Name</label>
					<div className="relative">
						<input
							{...register("name")}
							onFocus={() => setFocusedField('name')}
							onBlur={() => setFocusedField(null)}
							className="w-full bg-[#F5F5F7] rounded-[16px] py-4 px-6 text-[#1D1D1F] outline-none transition-all duration-300 focus:bg-white"
							placeholder="Jane Doe"
						/>
						{/* Green Beam Shadow on focus */}
						<div className={cn(
							"absolute inset-0 rounded-[16px] pointer-events-none transition-all duration-500 opacity-0",
							focusedField === 'name' ? "opacity-100 shadow-[0_10px_30px_-5px_#39FF1440]" : ""
						)} />
					</div>
					{errors.name && <p className="text-red-500 text-xs mt-2">{errors.name.message}</p>}
				</div>

				<div className="relative">
					<label className="block text-xs font-semibold uppercase tracking-wider text-[#86868B] mb-2">Email</label>
					<div className="relative">
						<input
							{...register("email")}
							onFocus={() => setFocusedField('email')}
							onBlur={() => setFocusedField(null)}
							className="w-full bg-[#F5F5F7] rounded-[16px] py-4 px-6 text-[#1D1D1F] outline-none transition-all duration-300 focus:bg-white"
							placeholder="jane@example.com"
						/>
						<div className={cn(
							"absolute inset-0 rounded-[16px] pointer-events-none transition-all duration-500 opacity-0",
							focusedField === 'email' ? "opacity-100 shadow-[0_10px_30px_-5px_#39FF1440]" : ""
						)} />
					</div>
					{errors.email && <p className="text-red-500 text-xs mt-2">{errors.email.message}</p>}
				</div>

				<div className="relative">
					<label className="block text-xs font-semibold uppercase tracking-wider text-[#86868B] mb-2">Message</label>
					<div className="relative">
						<textarea
							{...register("message")}
							rows={6}
							onFocus={() => setFocusedField('message')}
							onBlur={() => setFocusedField(null)}
							className="w-full bg-[#F5F5F7] rounded-[16px] py-4 px-6 text-[#1D1D1F] outline-none transition-all duration-300 focus:bg-white resize-none"
							placeholder="Tell us about your fleet."
						/>
						<div className={cn(
							"absolute inset-0 rounded-[16px] pointer-events-none transition-all duration-500 opacity-0",
							focusedField === 'message' ? "opacity-100 shadow-[0_10px_30px_-5px_#39FF1440]" : ""
						)} />
					</div>
					{errors.message && <p className="text-red-500 text-xs mt-2">{errors.message.message}</p>}
				</div>

				<motion.button
					type="submit"
					disabled={isSubmitting || isSuccess}
					className={cn(
						"w-full h-14 rounded-full bg-[#1D1D1F] text-white font-semibold flex items-center justify-center transition-colors duration-300",
						isSuccess ? "bg-[#39FF14] text-black" : "hover:bg-[#39FF14] hover:text-black"
					)}
					whileTap={{ scale: 0.98 }}
				>
					{isSubmitting ? <Loader2 className="animate-spin" /> : isSuccess ? "Sent" : "Submit"}
				</motion.button>

			</form>
		</div>
	);
}
