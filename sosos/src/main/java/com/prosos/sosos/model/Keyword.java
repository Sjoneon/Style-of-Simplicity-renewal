package com.prosos.sosos.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "keywords")
public class Keyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "keyword_id")
    private Long id;

    @Column(name = "keyword_text", nullable = false)
    private String keyword;

    @Column(name = "keyword_type") // "body", "style", "situation"
    private String type;

    // Product와 다대다 관계를 매핑
    @OneToMany(mappedBy = "keyword", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductKeyword> productKeywords = new ArrayList<>();

    // 기본 생성자
    public Keyword() {}

    public Keyword(String keyword, String type) {
        this.keyword = keyword;
        this.type = type;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<ProductKeyword> getProductKeywords() { return productKeywords; }
    public void setProductKeywords(List<ProductKeyword> productKeywords) {
        this.productKeywords = productKeywords;
    }

    @Entity
    @Table(name = "product_keywords")
    public static class ProductKeyword {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "product_keyword_id")
        private Long id;

        @ManyToOne
        @JoinColumn(name = "product_id", nullable = false)
        private Product product;

        @ManyToOne
        @JoinColumn(name = "keyword_id", nullable = false)
        private Keyword keyword;

        // 기본 생성자
        public ProductKeyword() {}

        public ProductKeyword(Product product, Keyword keyword) {
            this.product = product;
            this.keyword = keyword;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Product getProduct() { return product; }
        public void setProduct(Product product) { this.product = product; }

        public Keyword getKeyword() { return keyword; }
        public void setKeyword(Keyword keyword) { this.keyword = keyword; }
    }
}
