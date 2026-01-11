package com.volteryde.clientauth.dto.sms;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * Request DTO for Gatekeeper Pro OTP generation.
 * 
 * API Endpoint: POST https://api.gatekeeperpro.live/api/generate_otp
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpGenerateRequest {

    @JsonProperty("project")
    private String projectId;

    @JsonProperty("phoneNumber")
    private String phoneNumber;

    @JsonProperty("email")
    private String email;

    @JsonProperty("size")
    private Integer size;

    @JsonProperty("extra")
    private Map<String, Object> extra;

    public OtpGenerateRequest() {
    }

    public OtpGenerateRequest(String projectId, String phoneNumber) {
        this.projectId = projectId;
        this.phoneNumber = phoneNumber;
        this.size = 6; // Default to 6 digits
    }

    public OtpGenerateRequest(String projectId, String phoneNumber, Integer size) {
        this.projectId = projectId;
        this.phoneNumber = phoneNumber;
        this.size = size;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    /**
     * Alias for setProjectId - for convenience.
     */
    public void setProject(String project) {
        this.projectId = project;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Map<String, Object> getExtra() {
        return extra;
    }

    public void setExtra(Map<String, Object> extra) {
        this.extra = extra;
    }
}
