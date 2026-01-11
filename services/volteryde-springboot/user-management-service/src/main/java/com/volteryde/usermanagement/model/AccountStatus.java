package com.volteryde.usermanagement.model;

/**
 * Account status enum for user accounts.
 * Status transitions are enforced by the backend service layer.
 * 
 * Valid transitions:
 * - PENDING → ACTIVE (after verification)
 * - ACTIVE → INACTIVE (user/admin deactivation)
 * - ACTIVE → SUSPENDED (admin action)
 * - INACTIVE → ACTIVE (reactivation)
 * - SUSPENDED → ACTIVE (admin reinstatement)
 */
public enum AccountStatus {
	/**
	 * Account awaiting verification (e.g., email confirmation)
	 */
	PENDING,

	/**
	 * Normal operational state - user can access all features
	 */
	ACTIVE,

	/**
	 * Account deactivated by user or admin - can be reactivated
	 */
	INACTIVE,

	/**
	 * Account temporarily blocked by admin - requires admin action to reinstate
	 */
	SUSPENDED
}
