package com.volteryde.clientauth.repository;

import com.volteryde.clientauth.entity.TermsAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Terms Acceptance Repository
 * 
 * Austin: Repository for querying terms and privacy policy acceptances.
 * Supports audit requirements by tracking all acceptance records.
 */
@Repository
public interface TermsAcceptanceRepository extends JpaRepository<TermsAcceptance, String> {

    /**
     * Find the latest terms acceptance for a user
     */
    Optional<TermsAcceptance> findTopByUserIdOrderByAcceptedAtDesc(String userId);

    /**
     * Find all terms acceptances for a user (for audit purposes)
     */
    List<TermsAcceptance> findByUserIdOrderByAcceptedAtDesc(String userId);

    /**
     * Check if user has accepted current terms version
     */
    @Query("SELECT COUNT(t) > 0 FROM TermsAcceptance t WHERE t.user.id = :userId " +
           "AND t.termsVersion = :termsVersion AND t.privacyVersion = :privacyVersion " +
           "AND t.termsAccepted = true AND t.privacyAccepted = true")
    boolean hasAcceptedCurrentTerms(String userId, String termsVersion, String privacyVersion);

    /**
     * Check if user has ever accepted any terms
     */
    @Query("SELECT COUNT(t) > 0 FROM TermsAcceptance t WHERE t.user.id = :userId " +
           "AND t.termsAccepted = true AND t.privacyAccepted = true")
    boolean hasAcceptedAnyTerms(String userId);
}
