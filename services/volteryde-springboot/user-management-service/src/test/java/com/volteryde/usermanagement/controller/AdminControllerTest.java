package com.volteryde.usermanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.volteryde.usermanagement.dto.AdminDto;
import com.volteryde.usermanagement.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@SuppressWarnings("null")
public class AdminControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private AdminService adminService;

	@Autowired
	private ObjectMapper objectMapper;

	private AdminDto.OnboardDriverRequest driverRequest;

	@BeforeEach
	void setUp() {
		driverRequest = new AdminDto.OnboardDriverRequest();
		driverRequest.setEmail("driver@example.com");
		driverRequest.setLicenseNumber("LIC-123");
	}

	@Test
	@WithMockUser(authorities = "ADMIN")
	void onboardDriver_ShouldReturnCreated_WhenUserIsAdmin() throws Exception {
		AdminDto.DriverResponse response = AdminDto.DriverResponse.builder()
				.userId(UUID.randomUUID())
				.profileId(UUID.randomUUID())
				.status("INACTIVE")
				.build();

		when(adminService.onboardDriver(any())).thenReturn(response);

		mockMvc.perform(post("/api/admin/drivers")
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(driverRequest)))
				.andExpect(status().isCreated());
	}

	@Test
	@WithMockUser(authorities = "CLIENT")
	void onboardDriver_ShouldReturnForbidden_WhenUserIsClient() throws Exception {
		mockMvc.perform(post("/api/admin/drivers")
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(driverRequest)))
				.andExpect(status().isForbidden());
	}

	@Test
	void onboardDriver_ShouldReturnUnauthorized_WhenUserIsNotAuthenticated() throws Exception {
		mockMvc.perform(post("/api/admin/drivers")
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(driverRequest)))
				.andExpect(status().isUnauthorized());
	}
}
