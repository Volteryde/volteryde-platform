// ============================================================================
// Volteryde Platform - Centralized Environment Configuration
// ============================================================================
// This package provides type-safe access to environment variables
// All frontends should import from @volteryde/config
// ============================================================================

/**
 * Environment type
 */
export type Environment = "development" | "staging" | "production";

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  const env = (process.env.NODE_ENV as string) || "development";
  if (env === "production" || env === "staging") return env as Environment;
  return "development";
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

// ============================================================================
// Service URLs
// ============================================================================

/**
 * Get the auth service URL
 */
export function getAuthServiceUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ||
    (isDevelopment() ? "http://localhost:4001" : "https://auth.volteryde.org")
  );
}

/**
 * Get the auth API URL
 */
export function getAuthApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    (isDevelopment()
      ? "http://localhost:8081/api/auth"
      : "https://auth.volteryde.org/api/auth")
  );
}

/**
 * Get the admin dashboard URL
 */
export function getAdminUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    (isDevelopment() ? "http://localhost:4002" : "https://admin.volteryde.org")
  );
}

/**
 * Get the landing page / company site URL
 */
export function getLandingUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LANDING_URL ||
    (isDevelopment() ? "http://localhost:4000" : "https://volteryde.org")
  );
}

/**
 * Get the docs platform URL
 */
export function getDocsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DOCS_URL ||
    (isDevelopment() ? "http://localhost:3002" : "https://docs.volteryde.org")
  );
}

/**
 * Get the main API URL
 */
export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (isDevelopment() ? "http://localhost:8080" : "https://api.volteryde.org")
  );
}

/**
 * Get the user management API URL
 */
export function getUserApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_USER_API_URL ||
    (isDevelopment() ? "http://localhost:8082" : "https://users.volteryde.org")
  );
}

/**
 * Get the partner app URL
 */
export function getPartnersUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PARTNERS_URL ||
    (isDevelopment()
      ? "http://localhost:4003"
      : "https://partners.volteryde.org")
  );
}

/**
 * Get the customer support app URL
 */
export function getSupportUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_URL ||
    (isDevelopment()
      ? "http://localhost:4004"
      : "https://support.volteryde.org")
  );
}

/**
 * Get the dispatcher app URL
 */
export function getDispatchUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISPATCH_URL ||
    (isDevelopment()
      ? "http://localhost:4005"
      : "https://dispatch.volteryde.org")
  );
}

// ============================================================================
// Config Object (Centralized access to all configuration)
// ============================================================================

export interface VolterdeConfig {
  // Environment
  env: Environment;
  isDev: boolean;
  isProd: boolean;

  // Service URLs
  authServiceUrl: string;
  authApiUrl: string;
  adminUrl: string;
  landingUrl: string;
  docsUrl: string;
  apiUrl: string;
  userApiUrl: string;
  partnersUrl: string;
  supportUrl: string;
  dispatchUrl: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableDebug: boolean;

  // Branding
  companyName: string;
  supportEmail: string;
  supportPhone: string;

  // Third Party (Client-safe keys only)
  mapboxPublicToken: string;
  paystackPublicKey: string;
}

/**
 * Get the complete configuration object
 */
export function getConfig(): VolterdeConfig {
  const env = getEnvironment();
  const isDev = isDevelopment();

  return {
    // Environment
    env,
    isDev,
    isProd: isProduction(),

    // Service URLs
    authServiceUrl: getAuthServiceUrl(),
    authApiUrl: getAuthApiUrl(),
    adminUrl: getAdminUrl(),
    landingUrl: getLandingUrl(),
    docsUrl: getDocsUrl(),
    apiUrl: getApiUrl(),
    userApiUrl: getUserApiUrl(),
    partnersUrl: getPartnersUrl(),
    supportUrl: getSupportUrl(),
    dispatchUrl: getDispatchUrl(),

    // Feature Flags
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true" || isDev,

    // Branding
    companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "Volteryde",
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@volteryde.org",
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+233 534544454",

    // Third Party
    mapboxPublicToken: process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN || "",
    paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  };
}

// Default export for convenience
export default getConfig;
