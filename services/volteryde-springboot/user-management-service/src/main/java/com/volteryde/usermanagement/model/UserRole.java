package com.volteryde.usermanagement.model;

public enum UserRole {
	CLIENT,
	DRIVER,
	FLEET_MANAGER,
	DISPATCHER,
	PARTNER,
	CUSTOMER_SUPPORT, // EXTERNAL Support (End-users)
	SYSTEM_SUPPORT, // INTERNAL Support (Drivers, etc.)
	ADMIN,
	SUPER_ADMIN
}
