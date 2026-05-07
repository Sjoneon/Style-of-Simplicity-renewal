package com.prosos.sosos.dto;

import java.util.ArrayList;
import java.util.List;

public class AiStylistChatResponse {

    // 챗봇이 화면에 보여줄 최종 답변 문장
    private String reply;
    // 부적절/비패션 요청 등으로 추천을 차단했는지 여부
    private boolean blocked;
    // 추천 카드 렌더링에 사용하는 상품 목록
    private List<RecommendedProduct> recommendedProducts = new ArrayList<>();

    public AiStylistChatResponse() {
    }

    public AiStylistChatResponse(String reply, boolean blocked, List<RecommendedProduct> recommendedProducts) {
        this.reply = reply;
        this.blocked = blocked;
        if (recommendedProducts != null) {
            this.recommendedProducts = recommendedProducts;
        }
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public List<RecommendedProduct> getRecommendedProducts() {
        return recommendedProducts;
    }

    public void setRecommendedProducts(List<RecommendedProduct> recommendedProducts) {
        this.recommendedProducts = recommendedProducts == null ? new ArrayList<>() : recommendedProducts;
    }

    public static class RecommendedProduct {
        private Long productId;
        private String productName;
        // TOP/BOTTOM/OUTER/SHOES/BAG/ACC 중 하나
        private String category;
        private double price;
        private String imageUrl;
        // 추천 근거(키워드/카테고리 매칭 등)
        private String reason;

        public RecommendedProduct() {
        }

        public RecommendedProduct(Long productId, String productName, String category, double price, String imageUrl, String reason) {
            this.productId = productId;
            this.productName = productName;
            this.category = category;
            this.price = price;
            this.imageUrl = imageUrl;
            this.reason = reason;
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

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public double getPrice() {
            return price;
        }

        public void setPrice(double price) {
            this.price = price;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
