package com.volteryde.usermanagement.model;

import java.security.SecureRandom;

/**
 * Utility class for generating prefixed user IDs.
 * Format: PREFIX-XXXXXX (6 digits)
 * 
 * The ID is:
 * - Unique (enforced by database constraint)
 * - Immutable after creation
 * - Human-readable with clear user type prefix
 */
public final class UserIdGenerator {

	private static final String PREFIX = "USR-";
	private static final String NUMERIC = "0123456789";
	private static final int ID_LENGTH = 6;
	private static final SecureRandom RANDOM = new SecureRandom();

	private UserIdGenerator() {
		// Utility class - prevent instantiation
	}

	/**
	 * Generates a new prefixed user ID.
	 * Format: USR-XXXXXX
	 *
	 * @return A unique prefixed user ID
	 */
	public static String generate() {
		return generate(null);
	}

	/**
	 * Generates a new prefixed user ID based on role.
	 *
	 * @param role The user role to determine the prefix
	 * @return A unique prefixed user ID
	 */
	public static String generate(UserRole role) {
		String prefix = PREFIX;
		if (role != null) {
			switch (role) {
				case DISPATCHER:
					prefix = "VR-DP";
					break;
				case SYSTEM_SUPPORT:
					prefix = "VR-SC";
					break;
				case CUSTOMER_SUPPORT:
					prefix = "VR-CC";
					break;
				case ADMIN:
				case SUPER_ADMIN:
					prefix = "VR-A";
					break;
				case PARTNER:
					prefix = "VR-P";
					break;
				default:
					prefix = PREFIX;
			}
		}

		StringBuilder sb = new StringBuilder(prefix);
		for (int i = 0; i < ID_LENGTH; i++) {
			int index = RANDOM.nextInt(NUMERIC.length());
			sb.append(NUMERIC.charAt(index));
		}
		return sb.toString();
	}

	public static boolean isValid(String userId) {
		if (userId == null) {
			return false;
		}
		// Basic check for customized prefixes with numeric suffix
		return userId.matches("^(USR-|VR-[A-Z]+)[0-9]+$");
	}
}
