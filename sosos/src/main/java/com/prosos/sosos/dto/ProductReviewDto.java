package com.prosos.sosos.dto;

import com.prosos.sosos.model.ProductReview;

import java.time.LocalDateTime;

public class ProductReviewDto {
    private Long id;
    private Long orderId;
    private Long productId;
    private String productName;
    private String productCategory;
    private String productImageUrl;
    private Integer rating;
    private String content;
    // 프론트 정렬/표시용 생성 시각 필드
    private LocalDateTime createdDate;

    public ProductReviewDto() {
    }

    public ProductReviewDto(ProductReview review) {
        this.id = review.getId();
        this.orderId = review.getOrder() != null ? review.getOrder().getId() : null;
        this.productId = review.getProduct() != null ? review.getProduct().getId() : null;
        this.productName = review.getProduct() != null ? review.getProduct().getName() : null;
        this.productCategory = review.getProduct() != null ? review.getProduct().getCategory() : null;
        this.productImageUrl = review.getProduct() != null ? review.getProduct().getImageUrl() : null;
        this.rating = review.getRating();
        this.content = review.getContent();
        this.createdDate = review.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductCategory() {
        return productCategory;
    }

    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
    }

    public String getProductImageUrl() {
        return productImageUrl;
    }

    public void setProductImageUrl(String productImageUrl) {
        this.productImageUrl = productImageUrl;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
}
