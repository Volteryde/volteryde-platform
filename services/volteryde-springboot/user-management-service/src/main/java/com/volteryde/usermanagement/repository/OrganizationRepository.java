package com.volteryde.usermanagement.repository;

import com.volteryde.usermanagement.model.Organization;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
}
