package com.prosos.sosos.dto;

import com.prosos.sosos.model.RecentProductView;

import java.time.LocalDateTime;

public class RecentProductViewDto {

    private Long id;
    private String name;
    private String category;
    private Double price;
    private String imageUrl;
    private LocalDateTime viewedDate;

    public RecentProductViewDto() {
    }

    public RecentProductViewDto(RecentProductView recentProductView) {
        this.id = recentProductView.getProduct().getId();
        this.name = recentProductView.getProduct().getName();
        this.category = recentProductView.getProduct().getCategory();
        this.price = recentProductView.getProduct().getPrice();
        this.imageUrl = recentProductView.getProduct().getImageUrl();
        this.viewedDate = recentProductView.getViewedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getViewedDate() {
        return viewedDate;
    }

    public void setViewedDate(LocalDateTime viewedDate) {
        this.viewedDate = viewedDate;
    }
}
