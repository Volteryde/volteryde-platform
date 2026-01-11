package com.volteryde.usermanagement.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "auth-service", url = "${application.config.auth-service-url:http://localhost:8081}")
public interface AuthServiceClient {

	@PostMapping("/register")
	Object register(@RequestBody Object request,
			@RequestHeader(value = "User-Agent", required = false) String userAgent);
}
