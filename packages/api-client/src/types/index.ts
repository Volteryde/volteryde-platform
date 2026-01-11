// User types
export * from './user';

// Admin types
export * from './admin';

// Payment types
export * from './payment';

// Dashboard types
export * from './dashboard';

// Common types
export interface ApiError {
	message: string;
	code: string;
	status: number;
	details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}
