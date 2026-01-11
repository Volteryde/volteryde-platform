'use client';

import { useState, useEffect, Suspense } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, X, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAdminUrl, getAuthApiUrl, getDispatchUrl, getPartnersUrl, getSupportUrl } from '@volteryde/config';

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
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: #1D1D1F;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #86868B;
    font-size: 1.1rem;
  }
`;

const RoleSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

const RoleButton = styled.button<{ $isActive: boolean }>`
  padding: 0.6rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  background-color: ${props => props.$isActive ? '#0CCF0E' : 'transparent'};
  color: ${props => props.$isActive ? '#fff' : '#86868B'};
  border: 1px solid ${props => props.$isActive ? '#0CCF0E' : '#E5E5E5'};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: #0CCF0E;
    color: ${props => props.$isActive ? '#fff' : '#1D1D1F'};
    transform: translateY(-1px);
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

const TextArea = styled.textarea`
  display: flex;
  min-height: 80px;
  width: 100%;
  border-radius: 0.375rem;
  border: none;
  background-color: #F9FAFB;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #000000;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  resize: none;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #e5e5e5;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled(motion.div)`
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 28rem;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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

function LoginContent() {
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/';
	const appId = searchParams.get('app') || 'admin';

	// Map app ID to role
	const appToRoleMap: Record<string, 'admin' | 'bi-partner' | 'customer-care' | 'system-support' | 'dispatcher'> = {
		'admin-dashboard': 'admin',
		'admin': 'admin',
		'bi-partner': 'bi-partner',
		'bi-partner-app': 'bi-partner',
		'dispatcher': 'dispatcher',
		'dispatcher-app': 'dispatcher',
		'customer-care': 'customer-care',
		'customer-and-support-app': 'customer-care',
		'system-support': 'system-support',
	};

	const initialRole = appToRoleMap[appId] || 'admin';

	const [role, setRole] = useState<'admin' | 'bi-partner' | 'customer-care' | 'system-support' | 'dispatcher'>(initialRole);

	// Sync role with URL param
	useEffect(() => {
		if (appId && appToRoleMap[appId]) {
			setRole(appToRoleMap[appId]);
		}
	}, [appId]);

	const roles = [
		{ id: 'admin', label: 'Admin', prefix: 'VR-A' },
		{ id: 'bi-partner', label: 'BI-Partner', prefix: 'VR-P' },
		{ id: 'customer-care', label: 'Customer Care', prefix: 'VR-CC' },
		{ id: 'system-support', label: 'System Support', prefix: 'VR-SC' },
		{ id: 'dispatcher', label: 'Dispatcher', prefix: 'VR-DP' },
	] as const;

	const [isLoading, setIsLoading] = useState(false);
	const [showLogo, setShowLogo] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [accessIdNumber, setAccessIdNumber] = useState(''); // Just the numbers after the prefix
	const [password, setPassword] = useState('');

	// Role-based Access ID prefixes
	const rolePrefix: Record<string, string> = {
		'admin': 'VR-A',
		'bi-partner': 'VR-P',
		'customer-care': 'VR-CC',
		'system-support': 'VR-SC',
		'dispatcher': 'VR-DP',
	};

	// Construct full Access ID from prefix + numbers
	const getFullAccessId = () => {
		if (!accessIdNumber) return '';
		return `${rolePrefix[role]}${accessIdNumber}`;
	};

	// Recovery Modal State
	const [isRecoverOpen, setIsRecoverOpen] = useState(false);
	const [isRecoverSubmitted, setIsRecoverSubmitted] = useState(false);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	// Get logout parameter from URL (set when user logs out from other apps)
	const isLogout = searchParams.get('logout') === 'true';

	// Check if user is already authenticated - redirect to target app
	useEffect(() => {
		// If coming from a logout action, clear all tokens first
		if (isLogout) {
			localStorage.removeItem('volteryde_auth_access_token');
			localStorage.removeItem('volteryde_auth_refresh_token');
			localStorage.removeItem('volteryde_auth_expires_at');
			document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			setIsCheckingAuth(false);
			return;
		}

		const token = localStorage.getItem('volteryde_auth_access_token');
		if (token) {
			try {
				// Decode token to check if it's valid and not expired
				const [, payload] = token.split('.');
				const decoded = JSON.parse(atob(payload));
				const expiry = decoded.exp * 1000;

				if (Date.now() < expiry) {
					// Token is valid - redirect to admin (or the requested redirect URL)
					const adminUrl = getAdminUrl();
					const targetUrl = redirectUrl !== '/' ? redirectUrl : adminUrl;

					// Add auth code to URL to prevent loop
					const callbackUrl = new URL(targetUrl);
					callbackUrl.searchParams.set('code', token);
					window.location.href = callbackUrl.toString();
					return;
				} else {
					// Token expired - clear it
					localStorage.removeItem('volteryde_auth_access_token');
					localStorage.removeItem('volteryde_auth_refresh_token');
				}
			} catch {
				// Invalid token - clear it
				localStorage.removeItem('volteryde_auth_access_token');
				localStorage.removeItem('volteryde_auth_refresh_token');
			}
		}
		setIsCheckingAuth(false);
	}, [redirectUrl, isLogout]);

	useEffect(() => {
		if (showLogo) {
			const timer = setTimeout(() => {
				setShowLogo(false);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [showLogo]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const authApiUrl = getAuthApiUrl();
			const response = await fetch(`${authApiUrl}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					identifier: getFullAccessId(), // Constructs VR-A001 from prefix + numbers
					password,
					rememberMe: true
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Invalid credentials');
			}

			// Store tokens
			localStorage.setItem('volteryde_auth_access_token', data.accessToken);
			localStorage.setItem('volteryde_auth_refresh_token', data.refreshToken);
			localStorage.setItem('volteryde_auth_expires_at', String(Date.now() + data.expiresIn * 1000));

			// Redirect based on role or back to app
			// Use env vars for production, fallback to localhost for development
			const adminUrl = getAdminUrl();
			const partnersUrl = getPartnersUrl();
			const supportUrl = getSupportUrl();
			const dispatchUrl = getDispatchUrl();

			const roleRedirects: Record<string, string> = {
				'admin': adminUrl,
				'bi-partner': partnersUrl,
				'customer-care': supportUrl,
				'system-support': supportUrl,
				'dispatcher': dispatchUrl,
			};

			// User requested: "it should take the role that i select"
			// We prioritize the selected role's dashboard URL over the 'redirect' param to ensure 
			// the user actually goes to the app matching their selected role.
			const targetUrl = roleRedirects[role];

			// Add auth code to URL
			const callbackUrl = new URL(targetUrl);
			callbackUrl.searchParams.set('code', data.accessToken);
			window.location.href = callbackUrl.toString();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRecoverSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsRecoverSubmitted(true);
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
						{!showLogo ? (
							<video
								className="w-full h-full object-cover"
								autoPlay
								muted
								playsInline
								onEnded={() => setShowLogo(true)}
							>
								<source src="/volteryde.mp4" type="video/mp4" />
							</video>
						) : (
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
									<h2 className="text-white text-3xl font-bold tracking-tight mb-2">Access Portal</h2>
									<p className="text-white/60 text-sm font-medium tracking-widest uppercase">Authorized Personnel Only</p>
								</div>
							</motion.div>
						)}
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
							<h1>Access Portal</h1>
							<p>Enter your credentials to access the grid.</p>
						</motion.div>
					</Header>

					<RoleSelector>
						{roles.map((r) => (
							<RoleButton
								key={r.id}
								$isActive={role === r.id}
								onClick={() => setRole(r.id)}
							>
								{r.label}
							</RoleButton>
						))}
					</RoleSelector>

					<form onSubmit={handleLogin}>
						{error && <ErrorMessage>{error}</ErrorMessage>}

						<LabelInputContainer>
							<Label>Access ID</Label>
							<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
								<div style={{
									padding: '0.5rem 0.75rem',
									backgroundColor: '#0CCF0E',
									color: 'white',
									borderRadius: '0.375rem',
									fontWeight: 600,
									fontSize: '0.875rem',
									minWidth: '60px',
									textAlign: 'center'
								}}>
									{rolePrefix[role]}
								</div>
								<Input
									type="text"
									placeholder="001"
									required
									value={accessIdNumber}
									onChange={(e) => setAccessIdNumber(e.target.value.replace(/[^0-9]/g, ''))}
									style={{ flex: 1 }}
									maxLength={6}
								/>
							</div>
						</LabelInputContainer>

						<LabelInputContainer>
							<Label>Passcode</Label>
							<Input
								type="password"
								placeholder="••••••••"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</LabelInputContainer>

						<div className="flex justify-end items-center mb-8">
							<button
								type="button"
								onClick={() => setIsRecoverOpen(true)}
								className="text-sm font-medium text-neutral-600 hover:text-neutral-800 underline decoration-neutral-400 underline-offset-4 transition-colors"
							>
								Forgot Password?
							</button>
						</div>

						<AuthButton type="submit" disabled={isLoading}>
							{isLoading ? (
								<Loader2 className="animate-spin" size={20} />
							) : (
								<>
									Connect <ArrowRight size={20} />
								</>
							)}
						</AuthButton>
					</form>
				</AuthCard>
			</RightSide>

			{/* Recover Credentials Modal */}
			<AnimatePresence>
				{isRecoverOpen && (
					<ModalOverlay
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<ModalContent
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<button
								onClick={() => { setIsRecoverOpen(false); setIsRecoverSubmitted(false); }}
								className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
							>
								<X size={20} />
							</button>

							{!isRecoverSubmitted ? (
								<>
									<div className="mb-6">
										<h3 className="text-lg font-bold text-neutral-800 mb-2">Contact Support</h3>
										<p className="text-sm text-neutral-600">
											Please enter your email and a message. Our support team will help you reset your credentials.
										</p>
									</div>

									<form onSubmit={handleRecoverSubmit} className="space-y-4">
										<LabelInputContainer>
											<Label>Email</Label>
											<Input type="email" placeholder="partner@volteryde.com" required />
										</LabelInputContainer>

										<LabelInputContainer>
											<Label>Message</Label>
											<TextArea placeholder="I forgot my password..." required />
										</LabelInputContainer>

										<button
											type="submit"
											className="w-full rounded-md bg-[#0CCF0E] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0bb00d] transition-colors"
										>
											Send Message
										</button>
									</form>
								</>
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
									<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
										<Check className="w-6 h-6 text-[#0CCF0E]" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-neutral-800 mb-1">Message Sent</h3>
										<p className="text-sm text-neutral-600">
											Thanks for reaching out! Our support team will be in touch shortly.
										</p>
									</div>
									<button
										onClick={() => { setIsRecoverOpen(false); setTimeout(() => setIsRecoverSubmitted(false), 300); }}
										className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
									>
										Close
									</button>
								</div>
							)}
						</ModalContent>
					</ModalOverlay>
				)}
			</AnimatePresence>
		</MainContainer>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={
			<div className="w-full h-screen flex items-center justify-center bg-white">
				<Loader2 className="w-8 h-8 animate-spin text-[#0CCF0E]" />
			</div>
		}>
			<LoginContent />
		</Suspense>
	);
}
