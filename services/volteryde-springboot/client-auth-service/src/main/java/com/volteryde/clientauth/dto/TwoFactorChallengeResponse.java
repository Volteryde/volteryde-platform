package com.volteryde.clientauth.dto;

/**
 * Returned by the login endpoint when 2FA verification (or setup) is required
 * instead of issuing full auth tokens.
 *
 * Flow A — 2FA enabled, enter code:
 *   twoFactorRequired=true, setupRequired=false, challengeToken=<5-min JWT>
 *
 * Flow B — admin without 2FA configured (M7 forced setup):
 *   twoFactorRequired=true, setupRequired=true, challengeToken=<10-min JWT>
 *   → call POST /2fa/force-setup with this token to obtain QR code
 *   → call POST /2fa/force-enable { challengeToken, code } to activate and get full auth
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
