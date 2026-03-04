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

    @Column(name = "show_in_starter_tab")
    private Boolean showInStarterTab;

    @Column(name = "show_in_gift_tab")
    private Boolean showInGiftTab;

    @Column(name = "show_in_new_tab")
    private Boolean showInNewTab;

    @Column(name = "show_in_basic_tab")
    private Boolean showInBasicTab;

    @Column(name = "show_in_work_tab")
    private Boolean showInWorkTab;

    @Column(name = "discovery_tab_keys", length = 500)
    private String discoveryTabKeys;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    // Keyword.ProductKeyword와의 일대다 관계
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Keyword.ProductKeyword> productKeywords = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductOption> options = new ArrayList<>();

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
        this.showInStarterTab = productDto.getShowInStarterTab();
        this.showInGiftTab = productDto.getShowInGiftTab();
        this.showInNewTab = productDto.getShowInNewTab();
        this.showInBasicTab = productDto.getShowInBasicTab();
        this.showInWorkTab = productDto.getShowInWorkTab();
        this.discoveryTabKeys = productDto.toDiscoveryTabKeysCsv();
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

    public Boolean getShowInStarterTab() {
        return showInStarterTab;
    }

    public void setShowInStarterTab(Boolean showInStarterTab) {
        this.showInStarterTab = showInStarterTab;
    }

    public Boolean getShowInGiftTab() {
        return showInGiftTab;
    }

    public void setShowInGiftTab(Boolean showInGiftTab) {
        this.showInGiftTab = showInGiftTab;
    }

    public Boolean getShowInNewTab() {
        return showInNewTab;
    }

    public void setShowInNewTab(Boolean showInNewTab) {
        this.showInNewTab = showInNewTab;
    }

    public Boolean getShowInBasicTab() {
        return showInBasicTab;
    }

    public void setShowInBasicTab(Boolean showInBasicTab) {
        this.showInBasicTab = showInBasicTab;
    }

    public Boolean getShowInWorkTab() {
        return showInWorkTab;
    }

    public void setShowInWorkTab(Boolean showInWorkTab) {
        this.showInWorkTab = showInWorkTab;
    }

    public String getDiscoveryTabKeys() {
        return discoveryTabKeys;
    }

    public void setDiscoveryTabKeys(String discoveryTabKeys) {
        this.discoveryTabKeys = discoveryTabKeys;
    }

    public Seller getSeller() { return seller; }
    public void setSeller(Seller seller) { this.seller = seller; }

    public List<Keyword.ProductKeyword> getProductKeywords() {
        return productKeywords;
    }

    public void setProductKeywords(List<Keyword.ProductKeyword> productKeywords) {
        this.productKeywords = productKeywords;
    }

    public List<ProductOption> getOptions() {
        return options;
    }

    public void setOptions(List<ProductOption> options) {
        this.options = options;
    }
}
