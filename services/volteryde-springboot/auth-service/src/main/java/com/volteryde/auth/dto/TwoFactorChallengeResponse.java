package com.volteryde.auth.dto;

/**
 * Returned by the login endpoint when 2FA verification (or forced setup) is required.
 *
 * setupRequired=false → user has 2FA enabled; present the 6-digit code entry screen.
 * setupRequired=true  → admin/super-admin must set up 2FA before login completes.
 *   Call POST /2fa/force-setup { challengeToken } → then POST /2fa/force-enable { challengeToken, code }
 */
public class TwoFactorChallengeResponse {

    private final boolean twoFactorRequired = true;
    private boolean setupRequired;
    private String challengeToken;

    public TwoFactorChallengeResponse(boolean setupRequired, String challengeToken) {
        this.setupRequired = setupRequired;
        this.challengeToken = challengeToken;
    }

    public boolean isTwoFactorRequired() { return twoFactorRequired; }
    public boolean isSetupRequired() { return setupRequired; }
    public String getChallengeToken() { return challengeToken; }
}
