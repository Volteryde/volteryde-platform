package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackVerifyResponseData(
    String status,
    BigDecimal amount,
    String currency,
    @JsonProperty("paid_at") OffsetDateTime paidAt,
    @JsonProperty("created_at") OffsetDateTime createdAt,
    @JsonProperty("reference") String reference,
    @JsonProperty("authorization") PaystackVerifyResponseDataAuthorization authorization
) {
}
