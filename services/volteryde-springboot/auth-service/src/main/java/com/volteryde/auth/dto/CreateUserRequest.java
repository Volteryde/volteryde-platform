package com.volteryde.auth.dto;

/**
 * Request DTO for creating a generic user in User Management Service.
 * Matches the structure expected by User Management Service's
 * CreateUserRequest.
 */
public class CreateUserRequest {
	private String email;
	private String authId;
	private String firstName;
	private String lastName;
	private String phoneNumber;
	private String role;
	private String createdBy; // User ID of creator (for audit)

	public CreateUserRequest() {
	}

	public CreateUserRequest(String email, String authId, String firstName, String lastName, String phoneNumber,
			String role, String createdBy) {
		this.email = email;
		this.authId = authId;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phoneNumber = phoneNumber;
		this.role = role;
		this.createdBy = createdBy;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getAuthId() {
		return authId;
	}

	public void setAuthId(String authId) {
		this.authId = authId;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}
}
