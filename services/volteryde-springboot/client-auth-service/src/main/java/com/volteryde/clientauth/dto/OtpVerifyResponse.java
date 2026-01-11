package com.volteryde.clientauth.dto;

/**
 * Response after OTP verification
 */
public class OtpVerifyResponse {

    private boolean verified;
    private boolean newUser;
    private String signupToken; // Used to complete profile for new users

    public OtpVerifyResponse() {}

    public OtpVerifyResponse(boolean verified, boolean newUser, String signupToken) {
        this.verified = verified;
        this.newUser = newUser;
        this.signupToken = signupToken;
    }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public boolean isNewUser() { return newUser; }
    public void setNewUser(boolean newUser) { this.newUser = newUser; }

    public String getSignupToken() { return signupToken; }
    public void setSignupToken(String signupToken) { this.signupToken = signupToken; }
}
