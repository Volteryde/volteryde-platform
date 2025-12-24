package com.volteryde.shared.enums;

/**
 * Enum defining all activity types for logging.
 * Used for categorizing and filtering activity logs.
 */
public enum ActivityType {
	// Authentication events
	AUTH("Authentication"),

	// User profile/account events
	USER("User Account"),

	// Administrative actions
	ADMIN("Administration"),

	// Payment related events
	PAYMENT("Payment"),

	// Fleet management (Vehicles, Maintenance, Charging)
	FLEET("Fleet Management"),

	// Booking and Ride events
	BOOKING("Bus Booking"),

	// Support and Tickets
	SUPPORT("Customer Support"),

	// Notifications
	NOTIFICATION("Notification"),

	// Analytics
	ANALYTICS("Analytics"),

	// System events (API access, errors, etc.)
	SYSTEM("System");

	private final String displayName;

	ActivityType(String displayName) {
		this.displayName = displayName;
	}

	public String getDisplayName() {
		return displayName;
	}
}
