package com.prosos.sosos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;  // 문의를 남긴 사용자 ID

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "answer")
    private String answer;  // 판매자가 작성한 답변

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "answered_at")
    private LocalDateTime answeredDate;  // 답변이 작성된 날짜

    @Column(name = "seller_name")
    private String sellerName; // 판매자 이름 (답변 작성 시 저장)

    // 기본 생성자
    public Inquiry() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public LocalDateTime getAnsweredDate() { return answeredDate; }
    public void setAnsweredDate(LocalDateTime answeredDate) { this.answeredDate = answeredDate; }

    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
}
