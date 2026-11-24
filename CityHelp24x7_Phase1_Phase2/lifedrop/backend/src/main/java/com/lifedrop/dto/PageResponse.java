package com.lifedrop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.ArrayList;
import java.util.List;

/**
 * Simple page wrapper used by list endpoints (facilities, providers, bookings...).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    /** Slices an already filtered and sorted in-memory list. size is clamped to 1..100 (default 20). */
    public static <T> PageResponse<T> of(List<T> all, int page, int size) {
        int safeSize = size < 1 ? 20 : Math.min(size, 100);
        int safePage = Math.max(page, 0);
        long total = all.size();
        int totalPages = (int) Math.ceil(total / (double) safeSize);
        int from = (int) Math.min((long) safePage * safeSize, total);
        int to = (int) Math.min((long) from + safeSize, total);
        return PageResponse.<T>builder()
                .content(new ArrayList<>(all.subList(from, to)))
                .page(safePage)
                .size(safeSize)
                .totalElements(total)
                .totalPages(totalPages)
                .build();
    }

    /** Wraps a Spring Data page that has already been mapped to the response type. */
    public static <T> PageResponse<T> from(Page<T> springPage) {
        return PageResponse.<T>builder()
                .content(new ArrayList<>(springPage.getContent()))
                .page(springPage.getNumber())
                .size(springPage.getSize())
                .totalElements(springPage.getTotalElements())
                .totalPages(springPage.getTotalPages())
                .build();
    }
}
