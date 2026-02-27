// ============================================================================
// Volteryde Auth SDK - Main Entry Point
// ============================================================================

// Types
export type {
  UserRole,
  AuthUser,
  TokenPayload,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  AuthState,
  AuthContextValue,
  AuthConfig,
  ApiResponse,
} from "./types";

// Auth Client
export { AuthClient } from "./auth-client";

// Token Storage
export { TokenStorage } from "./token-storage";

// React Provider and Hooks
export {
  AuthProvider,
  AuthContext,
  useAuth,
  useUser,
  useHasRole,
} from "./auth-provider";

// Utility functions
export { createAuthMiddleware } from "./middleware";
export { withAuth, type WithAuthProps } from "./with-auth";
