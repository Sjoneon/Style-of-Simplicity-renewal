package com.prosos.sosos.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

import com.prosos.sosos.dto.ProductDto;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(name = "product_name", nullable = false)
    private String name;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "price", nullable = false)
    private double price;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "situation_score")
    private Integer situationScore;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "description_image_url")
    private String descriptionImageUrl;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    // Keyword.ProductKeyword와의 일대다 관계
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Keyword.ProductKeyword> productKeywords = new ArrayList<>();

    // 기본 생성자
    public Product() {}

    // ProductDto를 매개변수로 받는 생성자 추가
    public Product(ProductDto productDto) {
        this.id = productDto.getId();
        this.name = productDto.getName();
        this.category = productDto.getCategory();
        this.price = productDto.getPrice();
        this.quantity = productDto.getQuantity();
        this.description = productDto.getDescription();
        this.situationScore = productDto.getSituationScore();
        this.imageUrl = productDto.getImageUrl();
        this.descriptionImageUrl = productDto.getDescriptionImageUrl();
        // seller는 ProductDto에 포함되지 않으므로 별도로 처리해야 할 수 있음.
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getSituationScore() { return situationScore; }
    public void setSituationScore(Integer situationScore) { this.situationScore = situationScore; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getDescriptionImageUrl() { return descriptionImageUrl; }
    public void setDescriptionImageUrl(String descriptionImageUrl) { this.descriptionImageUrl = descriptionImageUrl; }

    public Seller getSeller() { return seller; }
    public void setSeller(Seller seller) { this.seller = seller; }

    public List<Keyword.ProductKeyword> getProductKeywords() {
        return productKeywords;
    }

    public void setProductKeywords(List<Keyword.ProductKeyword> productKeywords) {
        this.productKeywords = productKeywords;
    }
}
