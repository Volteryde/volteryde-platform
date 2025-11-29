package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackWebhookEvent(
    String event,
    Map<String, Object> data,
    @JsonProperty("created_at") String createdAt,
    @JsonProperty("id") String id,
    @JsonProperty("amount") BigDecimal amount
) {
}
