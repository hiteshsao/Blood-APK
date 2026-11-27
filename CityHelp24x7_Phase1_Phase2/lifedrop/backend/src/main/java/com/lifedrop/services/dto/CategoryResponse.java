package com.lifedrop.services.dto;

import com.lifedrop.services.entity.ServiceCategory;

public record CategoryResponse(Long id, String name, String icon, boolean featured) {
    public static CategoryResponse from(ServiceCategory c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getIcon(), c.isFeatured());
    }
}
