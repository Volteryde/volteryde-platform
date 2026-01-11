// Base client utilities
export { configureApiClient, getApiConfig, get, post, put, del } from './base';
export type { ApiClientConfig, RequestOptions } from './base';

// User API
export * as usersApi from './users';

// Admin API
export * as adminApi from './admin';

// Dashboard API
export * as dashboardApi from './dashboard';

// Payment API
export * as paymentApi from './payment';
