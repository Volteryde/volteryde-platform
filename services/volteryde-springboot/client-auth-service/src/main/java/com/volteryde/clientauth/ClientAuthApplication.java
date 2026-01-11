package com.volteryde.clientauth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Client Authentication Service Application
 * 
 * Handles authentication for mobile/external clients (Riders, Drivers)
 * Separate from internal auth-service for admins/dispatchers
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class ClientAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClientAuthApplication.class, args);
    }
}
