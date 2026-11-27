package com.lifedrop.enums;

/**
 * Roles in City Help 24x7 / LifeDrop.
 * USER is the unified standard account role (can both request and donate blood).
 * ADMIN is the administrative role.
 * DONOR and RECIPIENT are kept as legacy values for backward compatibility with existing accounts/clients.
 */
public enum Role {
    USER,
    ADMIN,
    DONOR,
    RECIPIENT
}
