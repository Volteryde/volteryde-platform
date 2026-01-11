/**
 * Request to onboard a new driver
 * Matches backend AdminDto.OnboardDriverRequest
 */
export interface OnboardDriverRequest {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	licenseNumber: string;
	yearsOfExperience: number;
}

/**
 * Request to onboard a fleet manager
 * Matches backend AdminDto.OnboardManagerRequest
 */
export interface OnboardFleetManagerRequest {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	assignedRegion: string;
	hubId: string;
}

/**
 * Driver response after onboarding
 * Matches backend AdminDto.DriverResponse
 */
export interface DriverResponse {
	userId: string;
	profileId: string;
	fullName: string;
	licenseNumber: string;
	status: string;
	vehicleAssignedId?: string;
}

/**
 * Request to create a new user (generic)
 * Matches backend AdminDto.CreateUserRequest
 */
export interface AdminCreateUserRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	role: string;
}
