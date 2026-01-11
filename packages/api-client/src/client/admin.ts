import { post } from './base';
import type {
	OnboardDriverRequest,
	OnboardFleetManagerRequest,
	DriverResponse,
} from '../types';

const BASE_PATH = '/api/admin';

/**
 * Onboard a new driver
 */
export async function onboardDriver(data: OnboardDriverRequest): Promise<DriverResponse> {
	return post<DriverResponse, OnboardDriverRequest>(`${BASE_PATH}/drivers`, data);
}

/**
 * Onboard a new fleet manager
 */
export async function onboardFleetManager(data: OnboardFleetManagerRequest): Promise<void> {
	return post<void, OnboardFleetManagerRequest>(`${BASE_PATH}/fleet-managers`, data);
}

/**
 * Create a new user (generic)
 */
export async function createUser(data: import('../types').AdminCreateUserRequest): Promise<any> {
	return post<any, import('../types').AdminCreateUserRequest>(`${BASE_PATH}/users`, data);
}
