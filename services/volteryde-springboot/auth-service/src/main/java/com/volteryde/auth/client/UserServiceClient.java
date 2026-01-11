package com.volteryde.auth.client;

import com.volteryde.auth.dto.CreateUserRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for communicating with the User Management Service.
 */
@FeignClient(name = "user-management-service", url = "${application.config.user-service-url:http://localhost:8082}")
public interface UserServiceClient {

	/**
	 * Create a new user profile in the User Management Service.
	 *
	 * @param request User creation request
	 * @return Created user response (as Object/Map since we might not need the full
	 *         response structure here)
	 */
	@PostMapping("/api/users")
	Object createUser(@RequestBody CreateUserRequest request);
}
