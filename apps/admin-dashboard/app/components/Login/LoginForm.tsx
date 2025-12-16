"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export default function LoginForm() {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log("Form submitted");
		navigate("/dashboard");
	};

	const handleSupportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitted(true);
		// Simulate API call
		setTimeout(() => {
		}, 2000);
	};

	return (
		<div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8">
			<h2 className="text-xl font-bold text-neutral-800">
				Admin Login
			</h2>
			<p className="mt-2 max-w-sm text-sm text-neutral-600">
				Enter your credentials to access the admin dashboard.
			</p>

			<form className="my-8" onSubmit={handleSubmit}>
				<LabelInputContainer className="mb-4">
					<Label htmlFor="email" className="text-neutral-800 dark:text-neutral-800">Email Address</Label>
					<Input
						id="email"
						placeholder="admin@volteryde.com"
						type="email"
						className="bg-gray-50 dark:bg-gray-50 text-black dark:text-black dark:placeholder-text-neutral-400"
					/>
				</LabelInputContainer>
				<LabelInputContainer className="mb-4">
					<Label htmlFor="password" className="text-neutral-800 dark:text-neutral-800">Password</Label>
					<Input
						id="password"
						placeholder="••••••••"
						type="password"
						className="bg-gray-50 dark:bg-gray-50 text-black dark:text-black dark:placeholder-text-neutral-400"
					/>
				</LabelInputContainer>

				<div className="flex justify-end mb-8">
					<Dialog>
						<DialogTrigger asChild>
							<button type="button" className="text-sm font-medium text-neutral-600 hover:text-neutral-800 underline decoration-neutral-400 underline-offset-4 transition-colors">
								Forgot Password?
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md bg-white dark:bg-white text-black">
							{!isSubmitted ? (
								<>
									<DialogHeader>
										<DialogTitle className="text-neutral-800">Contact Support</DialogTitle>
										<DialogDescription className="text-neutral-600">
											Please enter your email and a message. Our support team will help you reset your credentials.
										</DialogDescription>
									</DialogHeader>
									<form onSubmit={handleSupportSubmit} className="space-y-4 mt-4">
										<LabelInputContainer>
											<Label htmlFor="support-email" className="text-neutral-800 dark:text-neutral-800">Email</Label>
											<Input
												id="support-email"
												type="email"
												placeholder="admin@volteryde.com"
												required
												className="bg-gray-50 dark:bg-gray-50 text-black dark:text-black dark:placeholder-text-neutral-400"
											/>
										</LabelInputContainer>
										<LabelInputContainer>
											<Label htmlFor="message" className="text-neutral-800 dark:text-neutral-800">Message</Label>
											<textarea
												id="message"
												className="flex min-h-[80px] w-full rounded-md border-none bg-gray-50 dark:bg-gray-50 text-black dark:text-black px-3 py-2 text-sm shadow-input placeholder:text-neutral-400 dark:placeholder-text-neutral-400 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
												placeholder="I forgot my password..."
												required
											/>
										</LabelInputContainer>
										<button type="submit" className="w-full rounded-md bg-[#0CCF0E] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0bb00d]">
											Send Message
										</button>
									</form>
								</>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
									<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
										<svg className="w-6 h-6 text-[#0CCF0E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<DialogTitle className="text-neutral-800">Message Sent</DialogTitle>
									<p className="text-neutral-600">Thanks for reaching out! Our support team will be in touch shortly.</p>
								</div>
							)}
						</DialogContent>
					</Dialog>
				</div>

				<button
					className="group/btn relative block h-10 w-full rounded-md bg-[#0CCF0E] font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:bg-[#0bb00d] transition-colors"
					type="submit"
				>
					Sign in &rarr;
					<BottomGradient />
				</button>

				<div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
			</form>
		</div>
	);
}

const BottomGradient = () => {
	return (
		<>
			<span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
			<span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
		</>
	);
};

const LabelInputContainer = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<div className={cn("flex w-full flex-col space-y-2", className)}>
			{children}
		</div>
	);
};
