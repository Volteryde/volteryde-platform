package com.volteryde.shared.enums;

/**
 * Enum defining all specific actions that can be logged.
 */
public enum ActivityAction {
	// Auth actions
	LOGIN_SUCCESS("User logged in successfully"),
	LOGIN_FAILED("Login attempt failed"),
	LOGOUT("User logged out"),
	TOKEN_REFRESH("Access token refreshed"),

	// Registration & Verification
	REGISTER("New user registered"),
	EMAIL_VERIFIED("Email address verified"),
	EMAIL_VERIFICATION_SENT("Verification email sent"),

	// Password management
	PASSWORD_RESET_REQUEST("Password reset requested"),
	PASSWORD_RESET_COMPLETE("Password reset completed"),
	PASSWORD_CHANGED("Password changed"),

	// Account management
	ACCOUNT_DISABLED("Account disabled"),
	ACCOUNT_ENABLED("Account enabled"),
	ACCOUNT_LOCKED("Account locked due to failed attempts"),
	ACCOUNT_UNLOCKED("Account unlocked"),

	// Profile updates
	PROFILE_UPDATED("User profile updated"),
	SETTINGS_CHANGED("User settings changed"),

	// Admin actions
	USER_CREATED("Admin created new user"),
	USER_UPDATED("Admin updated user"),
	USER_DELETED("Admin deleted user"),
	ROLE_ASSIGNED("Role assigned to user"),
	ROLE_REMOVED("Role removed from user"),

	// Driver & Partner
	DRIVER_APPROVED("Driver application approved"),
	DRIVER_REJECTED("Driver application rejected"),
	DOCUMENTS_UPLOADED("Verification documents uploaded"),
	LICENSE_VERIFIED("Driver license verified"),

	// Fleet & Vehicle
	VEHICLE_ADDED("New vehicle added to fleet"),
	VEHICLE_STATUS_CHANGED("Vehicle status changed"),
	MAINTENANCE_LOGGED("Maintenance record created"),
	INSPECTION_COMPLETED("Vehicle inspection completed"),
	PHOTOS_UPLOADED("Vehicle photos uploaded"),
	TELEMETRY_RECEIVED("Vehicle telemetry data received"),
	CHARGING_STARTED("Charging session started"),
	CHARGING_ENDED("Charging session ended"),

	// Bookings & Rides
	RIDE_BOOKED("Bus seat booked"),
	RIDE_CANCELLED("Booking cancelled"),
	PASSENGER_BOARDED("Passenger boarded bus"),
	PASSENGER_DROPPED("Passenger dropped off"),
	RIDE_COMPLETED("Ride completed successfully"),
	RATING_SUBMITTED("Service rating submitted"),

	// Support
	TICKET_CREATED("Support ticket created"),
	TICKET_RESOLVED("Support ticket resolved"),
	MESSAGE_SENT("Support message sent"),

	// Payment (Extended)
	PAYMENT_INITIATED("Payment initiated"),
	PAYMENT_COMPLETED("Payment completed successfully"),
	PAYMENT_FAILED("Payment failed"),
	REFUND_PROCESSED("Refund processed"),
	WALLET_CREDIT("Wallet credited"),
	WALLET_DEBIT("Wallet debited"),

	// Access control
	ACCESS_GRANTED("Access granted to resource"),
	PERMISSION_DENIED("Permission denied"),

	// API events
	API_ACCESS("API endpoint accessed"),
	API_ERROR("API error occurred");

	private final String description;

	ActivityAction(String description) {
		this.description = description;
	}

	public String getDescription() {
		return description;
	}
}
