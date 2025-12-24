'use client';

import { useState, useEffect, Suspense } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, X, Check, User, Mail, Phone, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const MainContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  font-family: inherit;
  overflow: hidden;
  position: relative;
`;

const LeftSide = styled.div`
  width: 50%;
  min-height: 100vh;
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
  min-height: 100vh;
  padding: 3rem 6rem;
  position: relative;
  z-index: 10;
  overflow-y: auto;

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
  margin-top: 1.5rem;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    background-color: #0bb80d;
    box-shadow: 0 10px 30px -10px rgba(12, 207, 14, 0.4);
  }
  
  &:active {
    transform: scale(0.98);
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
  margin-bottom: 1rem;
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

const ErrorMessage = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

function RegisterContent() {
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/';
	const appId = searchParams.get('app') || 'admin';

	const [isLoading, setIsLoading] = useState(false);
	const [showLogo, setShowLogo] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		password: '',
		confirmPassword: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setIsLoading(false);
			return;
		}

		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters');
			setIsLoading(false);
			return;
		}

		try {
			const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081';
			const response = await fetch(`${authApiUrl}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					firstName: formData.firstName,
					lastName: formData.lastName,
					phoneNumber: formData.phoneNumber || undefined,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Registration failed');
			}

			// Store tokens
			localStorage.setItem('volteryde_auth_access_token', data.accessToken);
			localStorage.setItem('volteryde_auth_refresh_token', data.refreshToken);
			localStorage.setItem('volteryde_auth_expires_at', String(Date.now() + data.expiresIn * 1000));

			// Redirect back to app
			const callbackUrl = new URL(redirectUrl !== '/' ? redirectUrl : 'https://admin.volteryde.org');
			callbackUrl.searchParams.set('code', data.accessToken);
			window.location.href = callbackUrl.toString();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
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
								<h2 className="text-white text-3xl font-bold tracking-tight mb-2">Join Volteryde</h2>
								<p className="text-white/60 text-sm font-medium tracking-widest uppercase">Create Your Account</p>
							</div>
						</motion.div>
					</div>
				</GlobeContainer>
			</LeftSide>

			<RightSide>
				<AuthCard>
					<Header>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<h1>Create Account</h1>
							<p>Fill in your details to get started.</p>
						</motion.div>
					</Header>

					<form onSubmit={handleRegister}>
						{error && <ErrorMessage>{error}</ErrorMessage>}

						<NameRow>
							<LabelInputContainer>
								<Label>First Name</Label>
								<Input
									type="text"
									name="firstName"
									placeholder="John"
									required
									value={formData.firstName}
									onChange={handleChange}
								/>
							</LabelInputContainer>

							<LabelInputContainer>
								<Label>Last Name</Label>
								<Input
									type="text"
									name="lastName"
									placeholder="Doe"
									required
									value={formData.lastName}
									onChange={handleChange}
								/>
							</LabelInputContainer>
						</NameRow>

						<LabelInputContainer>
							<Label>Email Address</Label>
							<Input
								type="email"
								name="email"
								placeholder="you@example.com"
								required
								value={formData.email}
								onChange={handleChange}
							/>
						</LabelInputContainer>

						<LabelInputContainer>
							<Label>Phone Number <span className="text-neutral-400">(optional)</span></Label>
							<Input
								type="tel"
								name="phoneNumber"
								placeholder="+233 534 544 454"
								value={formData.phoneNumber}
								onChange={handleChange}
							/>
						</LabelInputContainer>

						<LabelInputContainer>
							<Label>Password</Label>
							<Input
								type="password"
								name="password"
								placeholder="••••••••"
								required
								minLength={8}
								value={formData.password}
								onChange={handleChange}
							/>
							<span className="text-xs text-neutral-400">Must be at least 8 characters</span>
						</LabelInputContainer>

						<LabelInputContainer>
							<Label>Confirm Password</Label>
							<Input
								type="password"
								name="confirmPassword"
								placeholder="••••••••"
								required
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
						</LabelInputContainer>

						<p className="text-xs text-neutral-500 mb-4">
							By creating an account, you agree to our{' '}
							<a href="https://volteryde.org/legal/terms" className="text-[#0CCF0E] hover:underline">
								Terms of Service
							</a>{' '}
							and{' '}
							<a href="https://volteryde.org/legal/privacy" className="text-[#0CCF0E] hover:underline">
								Privacy Policy
							</a>
						</p>

						<AuthButton type="submit" disabled={isLoading}>
							{isLoading ? (
								<Loader2 className="animate-spin" size={20} />
							) : (
								<>
									Create Account <ArrowRight size={20} />
								</>
							)}
						</AuthButton>
					</form>

					<div className="text-center mt-6">
						<p className="text-neutral-600">
							Already have an account?{' '}
							<Link
								href={`/login?redirect=${encodeURIComponent(redirectUrl)}&app=${appId}`}
								className="text-[#0CCF0E] font-medium hover:underline"
							>
								Sign in
							</Link>
						</p>
					</div>
				</AuthCard>
			</RightSide>
		</MainContainer>
	);
}

export default function RegisterPage() {
	return (
		<Suspense fallback={
			<div className="w-full h-screen flex items-center justify-center bg-white">
				<Loader2 className="w-8 h-8 animate-spin text-[#0CCF0E]" />
			</div>
		}>
			<RegisterContent />
		</Suspense>
	);
}
