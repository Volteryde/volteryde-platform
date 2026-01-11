import type { ApiError } from '../types';

/**
 * API Client configuration
 */
export interface ApiClientConfig {
	baseUrl: string;
	getAccessToken?: () => Promise<string | null>;
	onUnauthorized?: () => void;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean | undefined>;
	signal?: AbortSignal;
}

/**
 * Default configuration - can be overridden per-app
 */
let globalConfig: ApiClientConfig = {
	baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
};

/**
 * Configure the API client globally
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
	globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current API client configuration
 */
export function getApiConfig(): ApiClientConfig {
	return globalConfig;
}

/**
 * Build URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
	const url = new URL(path, globalConfig.baseUrl);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.append(key, String(value));
			}
		});
	}

	return url.toString();
}

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorData: Partial<ApiError> = {};

		try {
			errorData = await response.json() as Partial<ApiError>;
		} catch {
			// Response is not JSON
		}

		const error: ApiError = {
			message: errorData.message || response.statusText || 'An error occurred',
			code: errorData.code || 'UNKNOWN_ERROR',
			status: response.status,
			details: errorData.details,
		};

		// Handle 401 Unauthorized
		if (response.status === 401 && globalConfig.onUnauthorized) {
			globalConfig.onUnauthorized();
		}

		throw error;
	}

	// Handle 204 No Content
	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

/**
 * Get default headers including auth token if available
 */
async function getHeaders(additionalHeaders?: Record<string, string>): Promise<Headers> {
	const headers = new Headers({
		'Content-Type': 'application/json',
		...additionalHeaders,
	});

	if (globalConfig.getAccessToken) {
		const token = await globalConfig.getAccessToken();
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
	}

	return headers;
}

/**
 * Make a GET request
 */
export async function get<T>(path: string, options?: RequestOptions): Promise<T> {
	const url = buildUrl(path, options?.params);
	const headers = await getHeaders(options?.headers);

	const response = await fetch(url, {
		method: 'GET',
		headers,
		signal: options?.signal,
	});

	return handleResponse<T>(response);
}

/**
 * Make a POST request
 */
export async function post<T, D = unknown>(path: string, data?: D, options?: RequestOptions): Promise<T> {
	const url = buildUrl(path, options?.params);
	const headers = await getHeaders(options?.headers);

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: data ? JSON.stringify(data) : undefined,
		signal: options?.signal,
	});

	return handleResponse<T>(response);
}

/**
 * Make a PUT request
 */
export async function put<T, D = unknown>(path: string, data?: D, options?: RequestOptions): Promise<T> {
	const url = buildUrl(path, options?.params);
	const headers = await getHeaders(options?.headers);

	const response = await fetch(url, {
		method: 'PUT',
		headers,
		body: data ? JSON.stringify(data) : undefined,
		signal: options?.signal,
	});

	return handleResponse<T>(response);
}

/**
 * Make a DELETE request
 */
export async function del<T>(path: string, options?: RequestOptions): Promise<T> {
	const url = buildUrl(path, options?.params);
	const headers = await getHeaders(options?.headers);

	const response = await fetch(url, {
		method: 'DELETE',
		headers,
		signal: options?.signal,
	});

	return handleResponse<T>(response);
}
