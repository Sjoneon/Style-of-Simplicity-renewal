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

// 사용자-상품 조합을 1건만 유지하고, 마지막 조회 시각(viewedAt)만 갱신해 "최근 본 순서"를 관리한다.
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

    // PK는 DB BIGINT와 맞추기 위해 Long을 사용한다. (JPA 식별자 기본 관례)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recent_view_id")
    private Long id;

    // 목록 조회 시 연관 엔티티 전체를 즉시 로딩하지 않기 위해 LAZY를 사용한다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 최근 본 목록 정렬/필터에서 상품 정보가 필요해 연관관계로 관리한다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // DATETIME 컬럼과 1:1 대응되고, "최근 순 정렬" 목적이라 타임존 정보가 없는 LocalDateTime을 사용한다.
    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @PrePersist
    protected void onCreate() {
        // 저장 시점 기본값을 채워 null 정렬 이슈를 방지한다.
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
