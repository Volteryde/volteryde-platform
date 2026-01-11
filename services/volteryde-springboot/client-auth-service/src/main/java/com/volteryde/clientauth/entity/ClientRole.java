package com.volteryde.clientauth.entity;

/**
 * Client Role Enum
 * Roles specific to mobile/external clients
 * 
 * NOTE: Drivers are INTERNAL workers and use auth-service, not client-auth-service.
 * Only Riders (passengers) are external clients.
 */
public enum ClientRole {
    RIDER
}
