package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackInitializeResponseData(
    @JsonProperty("authorization_url") String authorizationUrl,
    @JsonProperty("access_code") String accessCode,
    String reference
) {
}
