'use client';

import { useState, Suspense } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Check, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const MainContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  font-family: inherit;
  overflow: hidden;
  position: relative;
`;

const LeftSide = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #0CCF0E;
  overflow: hidden;
  
  @media (max-width: 1020px) {
    display: none;
  }
`;

const GlobeContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightSide = styled.div`
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  height: 100%;
  padding: 0px 8rem;
  position: relative;
  z-index: 10;

  @media (max-width: 1020px) {
    width: 100%;
    padding: 2rem;
  }
`;

const AuthCard = styled.div`
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1D1D1F;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #86868B;
    font-size: 1rem;
  }
`;

const AuthButton = styled.button`
  width: 100%;
  height: 3.5rem;
  background-color: #0CCF0E;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    background-color: #0bb80d;
    box-shadow: 0 10px 30px -10px rgba(12, 207, 14, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const LabelInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #171717;
  line-height: normal;
`;

const Input = styled.input`
  display: flex;
  height: 2.5rem;
  width: 100%;
  border-radius: 0.375rem;
  border: none;
  background-color: #F9FAFB;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #000000;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #e5e5e5;
  }

  &::placeholder {
    color: #a3a3a3;
  }
`;

const SuccessCard = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

function ForgotPasswordContent() {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081';
			const response = await fetch(`${authApiUrl}/api/auth/password/reset`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to send reset email');
			}

			setIsSuccess(true);
		} catch (err) {
			// Don't show error for security - always show success
			setIsSuccess(true);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<MainContainer>
			<LeftSide>
				<GlobeContainer
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1 }}
				>
					<div className="w-full h-full relative flex items-center justify-center">
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
							className="flex flex-col items-center gap-6"
						>
							<div className="relative w-48 h-48">
								<Image
									src="/logo1.png"
									alt="Volteryde Logo"
									fill
									className="object-contain"
								/>
							</div>
							<div className="text-center">
								<h2 className="text-white text-3xl font-bold tracking-tight mb-2">Password Recovery</h2>
								<p className="text-white/60 text-sm font-medium tracking-widest uppercase">Secure Reset Process</p>
							</div>
						</motion.div>
					</div>
				</GlobeContainer>
			</LeftSide>

			<RightSide>
				<AuthCard>
					{!isSuccess ? (
						<>
							<Header>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
								>
									<h1>Reset Password</h1>
									<p>Enter your email and we&apos;ll send you a reset link.</p>
								</motion.div>
							</Header>

							<form onSubmit={handleSubmit}>
								<LabelInputContainer>
									<Label>Email Address</Label>
									<Input
										type="email"
										placeholder="you@volteryde.org"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</LabelInputContainer>

								<AuthButton type="submit" disabled={isLoading}>
									{isLoading ? (
										<Loader2 className="animate-spin" size={20} />
									) : (
										<>
											Send Reset Link <Mail size={20} />
										</>
									)}
								</AuthButton>
							</form>

							<Link
								href="/login"
								className="flex items-center justify-center gap-2 mt-8 text-neutral-600 hover:text-neutral-800 transition-colors"
							>
								<ArrowLeft size={16} />
								Back to Sign In
							</Link>
						</>
					) : (
						<SuccessCard>
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5 }}
							>
								<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
									<Check className="w-8 h-8 text-[#0CCF0E]" />
								</div>
								<h2 className="text-2xl font-bold text-neutral-800 mb-3">Check Your Email</h2>
								<p className="text-neutral-600 mb-6">
									If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
								</p>
								<p className="text-sm text-neutral-400 mb-8">
									Didn&apos;t receive it? Check your spam folder or{' '}
									<button
										onClick={() => setIsSuccess(false)}
										className="text-[#0CCF0E] hover:underline"
									>
										try again
									</button>
								</p>
								<Link href="/login">
									<AuthButton as="div">
										Back to Sign In
									</AuthButton>
								</Link>
							</motion.div>
						</SuccessCard>
					)}
				</AuthCard>
			</RightSide>
		</MainContainer>
	);
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={
			<div className="w-full h-screen flex items-center justify-center bg-white">
				<Loader2 className="w-8 h-8 animate-spin text-[#0CCF0E]" />
			</div>
		}>
			<ForgotPasswordContent />
		</Suspense>
	);
}
