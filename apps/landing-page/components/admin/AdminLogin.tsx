'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, X, Check } from 'lucide-react';
import Image from 'next/image';

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

// Replicating the design from bi-partner-app
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
  color: #171717; // text-neutral-800
  line-height: none;
`;

const Input = styled.input`
  display: flex;
  height: 2.5rem;
  width: 100%;
  border-radius: 0.375rem;
  border: none;
  background-color: #F9FAFB; // bg-gray-50
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #000000;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #e5e5e5; // ring-neutral-400 equivalent
  }

  &::placeholder {
    color: #a3a3a3; // text-neutral-400
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



// Modal Components
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
  max-width: 28rem; // max-w-md
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

export function AdminLogin() {
  const [role, setRole] = useState<'admin' | 'bi-partner' | 'customer-support' | 'dispatcher'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  // Recovery Modal State
  const [isRecoverOpen, setIsRecoverOpen] = useState(false);
  const [isRecoverSubmitted, setIsRecoverSubmitted] = useState(false);

  useEffect(() => {
    if (showLogo) {
      const timer = setTimeout(() => {
        setShowLogo(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showLogo]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoverSubmitted(true);
    // Simulate API
    setTimeout(() => {
      // logic to close or reset could go here
    }, 2000);
  };

  const roles = [
    { id: 'admin', label: 'Admin' },
    { id: 'bi-partner', label: 'BI-Partner' },
    { id: 'customer-support', label: 'Customer & Support' },
    { id: 'dispatcher', label: 'Dispatcher' },
  ] as const;

  return (
    <MainContainer>
      {/* ... LeftSide ... */}
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
                  <h2 className="text-white text-3xl font-bold tracking-tight mb-2">Internal Portal</h2>
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
            <LabelInputContainer>
              <Label>Access ID</Label>
              <Input type="text" placeholder="Enter your ID" required />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label>Passcode</Label>
              <Input type="password" placeholder="••••••••" required />
            </LabelInputContainer>

            <div className="flex justify-end mb-8">
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
