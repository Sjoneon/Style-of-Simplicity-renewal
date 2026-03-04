package com.prosos.sosos.dto;

import com.prosos.sosos.model.MainBanner;

public class MainBannerDto {

    private Long id;
    private String title;
    private String subtitle;
    private String imageUrl;
    private Long targetProductId;
    private Integer displayOrder;
    private Boolean active;
    private Long sellerId;

    public MainBannerDto() {
    }

    public MainBannerDto(MainBanner banner) {
        this.id = banner.getId();
        this.title = banner.getTitle();
        this.subtitle = banner.getSubtitle();
        this.imageUrl = banner.getImageUrl();
        this.targetProductId = banner.getTargetProductId();
        this.displayOrder = banner.getDisplayOrder();
        this.active = banner.getActive();
        this.sellerId = banner.getSeller() != null ? banner.getSeller().getId() : null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Long getTargetProductId() {
        return targetProductId;
    }

    public void setTargetProductId(Long targetProductId) {
        this.targetProductId = targetProductId;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }
}
