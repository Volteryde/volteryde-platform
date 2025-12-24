package com.volteryde.auth.entity;

import jakarta.persistence.*;

/**
 * Role entity for role-based access control
 */
@Entity
@Table(name = "roles")
public class RoleEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true, nullable = false)
	@Enumerated(EnumType.STRING)
	private UserRole name;

	@Column
	private String description;

	public enum UserRole {
		SUPER_ADMIN,
		ADMIN,
		DISPATCHER,
		SUPPORT_AGENT,
		PARTNER,
		DRIVER,
		FLEET_MANAGER,
		PASSENGER
	}

	// Constructors
	public RoleEntity() {
	}

	public RoleEntity(UserRole name) {
		this.name = name;
	}

	public RoleEntity(UserRole name, String description) {
		this.name = name;
		this.description = description;
	}

	// Getters and Setters
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public UserRole getName() {
		return name;
	}

	public void setName(UserRole name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}
}
