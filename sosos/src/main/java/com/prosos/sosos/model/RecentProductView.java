package com.prosos.sosos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

// 사용자-상품 조합 1건 유지, 마지막 조회 시각 갱신, 최근 본 순서 관리
@Entity
@Table(
        name = "recent_product_views",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_recent_view_user_product", columnNames = {"user_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_recent_view_user_viewed", columnList = "user_id, viewed_at")
        }
)
public class RecentProductView {

    // PK 타입 Long, DB BIGINT 매핑
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recent_view_id")
    private Long id;

    // 연관 엔티티 지연 로딩 LAZY, 목록 조회 성능 부담 감소
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 최근 본 목록 정렬/필터용 상품 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // DATETIME 매핑용 조회 시각 타입 LocalDateTime
    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @PrePersist
    protected void onCreate() {
        // 저장 시점 기본값 세팅, null 정렬 이슈 방지
        if (viewedAt == null) {
            viewedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }
}
