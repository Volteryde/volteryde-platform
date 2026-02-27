package com.volteryde.payment.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class PaystackHttpConfig {

    @Bean
    public RestTemplate paystackRestTemplate(RestTemplateBuilder builder, PaystackProperties properties) {
        return builder
                .setConnectTimeout(properties.getConnectTimeout())
                .setReadTimeout(properties.getReadTimeout())
                .rootUri(properties.getBaseUrl())
                .additionalInterceptors(authorizationInterceptor(properties))
                .build();
    }

    private ClientHttpRequestInterceptor authorizationInterceptor(PaystackProperties properties) {
        return (request, body, execution) -> {
            request.getHeaders().add("Authorization", "Bearer " + properties.getSecretKey());
            return execution.execute(request, body);
        };
    }
}
