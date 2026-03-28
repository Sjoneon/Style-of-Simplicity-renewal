package com.prosos.sosos.dto;

public class ProductReviewCreateRequest {
    // 주문 식별자 orderId, DB PK Long 매핑
    private Long orderId;
    // 평점 타입 Integer, 값 누락 null 과 1~5 점수 구분
    private Integer rating;
    // 가변 길이 본문 content 문자열 수신
    private String content;

    public ProductReviewCreateRequest() {
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
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
}
