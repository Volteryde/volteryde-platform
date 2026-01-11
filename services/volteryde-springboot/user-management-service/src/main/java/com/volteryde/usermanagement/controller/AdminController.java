package com.volteryde.usermanagement.controller;

import com.volteryde.usermanagement.dto.AdminDto;
import com.volteryde.usermanagement.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

	private final AdminService adminService;

	@PostMapping("/drivers")
	@PreAuthorize("hasAnyAuthority('SYSTEM_SUPPORT', 'ADMIN', 'SUPER_ADMIN')")
	public ResponseEntity<AdminDto.DriverResponse> onboardDriver(@RequestBody AdminDto.OnboardDriverRequest request) {
		return new ResponseEntity<>(adminService.onboardDriver(request), HttpStatus.CREATED);
	}

	@PostMapping("/fleet-managers")
	@PreAuthorize("hasAnyAuthority('SYSTEM_SUPPORT', 'ADMIN', 'SUPER_ADMIN')")
	public ResponseEntity<Void> onboardFleetManager(@RequestBody AdminDto.OnboardManagerRequest request) {
		adminService.onboardFleetManager(request);
		return new ResponseEntity<>(HttpStatus.CREATED);
	}

	@PostMapping("/users")
	@PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN')")
	public ResponseEntity<com.volteryde.usermanagement.model.User> createUser(
			@RequestBody AdminDto.CreateUserRequest request) {
		return new ResponseEntity<>(adminService.createUser(request), HttpStatus.CREATED);
	}
}
