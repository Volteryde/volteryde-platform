package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.dto.AdminDto;

public interface AdminService {
	AdminDto.DriverResponse onboardDriver(AdminDto.OnboardDriverRequest request);

	void onboardFleetManager(AdminDto.OnboardManagerRequest request);
}
