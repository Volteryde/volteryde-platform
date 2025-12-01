package com.volteryde.payment.service.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaystackVerifyResponseDataAuthorization(
    @JsonProperty("authorization_code") String authorizationCode,
    @JsonProperty("card_type") String cardType,
    @JsonProperty("last4") String last4,
    @JsonProperty("exp_month") String expMonth,
    @JsonProperty("exp_year") String expYear,
    @JsonProperty("channel") String channel,
    @JsonProperty("bank") String bank,
    @JsonProperty("reusable") boolean reusable,
    @JsonProperty("signature") String signature,
    @JsonProperty("account_name") String accountName
) {
}
