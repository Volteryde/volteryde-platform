package com.volteryde.usermanagement.controller;

import com.volteryde.usermanagement.model.Organization;
import com.volteryde.usermanagement.service.OrganizationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/organizations")
public class OrganizationController {

	private final OrganizationService organizationService;

	public OrganizationController(OrganizationService organizationService) {
		this.organizationService = organizationService;
	}

	@GetMapping
	public ResponseEntity<List<Organization>> getAll() {
		return ResponseEntity.ok(organizationService.getAll());
	}

	@PostMapping
	public ResponseEntity<Organization> create(@RequestBody Organization organization) {
		return ResponseEntity.ok(organizationService.create(organization));
	}
}
