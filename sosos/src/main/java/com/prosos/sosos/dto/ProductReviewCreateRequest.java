package com.prosos.sosos.dto;

public class ProductReviewCreateRequest {
    // 주문 식별자는 DB PK와 동일한 Long으로 받는다. (주문당 리뷰 1건 제약에 사용)
    private Long orderId;
    // Integer를 쓰는 이유: 요청 누락(null)과 실제 값(1~5)을 구분해 검증하기 위해서다.
    private Integer rating;
    // 내용 길이가 가변적이므로 문자열(String)로 수신한다.
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
