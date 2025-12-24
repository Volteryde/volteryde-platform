package com.volteryde.usermanagement.service;

import com.volteryde.usermanagement.model.Organization;
import com.volteryde.usermanagement.repository.OrganizationRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrganizationService {

	private final OrganizationRepository organizationRepository;

	public OrganizationService(OrganizationRepository organizationRepository) {
		this.organizationRepository = organizationRepository;
	}

	public List<Organization> getAll() {
		return organizationRepository.findAll();
	}

	public Organization create(Organization organization) {
		if (organization == null) {
			throw new IllegalArgumentException("Organization cannot be null");
		}
		return organizationRepository.save(organization);
	}
}
