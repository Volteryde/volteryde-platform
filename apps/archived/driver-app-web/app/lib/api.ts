const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MOCK_TOKEN = 'mock-driver-jwt-token-12345'; // Simulation

interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
}

class ApiClient {
	private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const { params, ...init } = options;

		// Build URL with query params
		const url = new URL(`${BASE_URL}${endpoint}`);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		// Auth Header Injection (Mock)
		const headers = new Headers(init.headers);
		if (!headers.has('Authorization')) {
			headers.set('Authorization', `Bearer ${MOCK_TOKEN}`);
		}
		headers.set('Content-Type', 'application/json');

		const response = await fetch(url.toString(), {
			...init,
			headers,
		});

		if (!response.ok) {
			// Handle HTTP errors
			const errorBody = await response.json().catch(() => null);
			throw new Error(errorBody?.message || `API Error: ${response.status} ${response.statusText}`);
		}

		// Handle empty responses (204)
		if (response.status === 204) {
			return {} as T;
		}

		return response.json();
	}

	// HTTP Methods using the typed DTOs context implicitly via generic T

	get<T>(endpoint: string, params?: Record<string, any>) {
		return this.request<T>(endpoint, { method: 'GET', params });
	}

	async post<T>(endpoint: string, body: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: JSON.stringify(body),
		});
	}

	async patch<T>(endpoint: string, body: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PATCH",
			body: JSON.stringify(body),
		});
	}

	async put<T>(endpoint: string, body: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(body)
		});
	}

	delete<T>(endpoint: string) {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}
}

export const api = new ApiClient();
