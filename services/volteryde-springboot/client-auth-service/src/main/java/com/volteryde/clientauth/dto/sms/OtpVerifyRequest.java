package com.volteryde.clientauth.dto.sms;

/**
 * Request DTO for Gatekeeper Pro OTP verification.
 * 
 * API Endpoint: POST https://api.gatekeeperpro.live/api/verify_otp
 */
public class OtpVerifyRequest {

    private String reference;
    private String otp;

    public OtpVerifyRequest() {
    }

    public OtpVerifyRequest(String reference, String otp) {
        this.reference = reference;
        this.otp = otp;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
