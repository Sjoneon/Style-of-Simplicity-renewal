package com.prosos.sosos.dto;

import java.time.LocalDateTime;

public class InquiryDto {
    private Long id;
    private Long userId;
    private Long productId;
    private String userName;
    private String category;
    private String title;
    private String content;
    private String imageUrl;
    private String answer;
    private LocalDateTime createdDate;
    private LocalDateTime answeredDate;

    // Constructor
    public InquiryDto(Long id, Long userId, Long productId, String userName, String category, String title, String content,
                      String imageUrl,
                      String answer, LocalDateTime createdDate, LocalDateTime answeredDate) {
        this.id = id;
        this.userId = userId;
        this.productId = productId;
        this.userName = userName;
        this.category = category;
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.answer = answer;
        this.createdDate = createdDate;
        this.answeredDate = answeredDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDateTime getAnsweredDate() {
        return answeredDate;
    }

    public void setAnsweredDate(LocalDateTime answeredDate) {
        this.answeredDate = answeredDate;
    }
}
