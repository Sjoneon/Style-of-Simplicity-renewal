package com.prosos.sosos.dto;

import java.util.ArrayList;
import java.util.List;

public class PublicProductDto {

    private Long id;
    private String name;
    private String category;
    private double price;
    private Double originalPrice;
    private String description;
    private Integer situationScore;
    private String imageUrl;
    private String sellerName;
    private String descriptionImageUrl;
    private List<PublicProductOptionDto> options = new ArrayList<>();
    private boolean hasStock;
    private boolean soldOut;
    private Integer soldCount;
    private List<String> discoveryTabKeys = new ArrayList<>();

    public PublicProductDto() {
    }

    public PublicProductDto(ProductDto productDto) {
        this.id = productDto.getId();
        this.name = productDto.getName();
        this.category = productDto.getCategory();
        this.price = productDto.getPrice();
        this.originalPrice = productDto.getOriginalPrice();
        this.description = productDto.getDescription();
        this.situationScore = productDto.getSituationScore();
        this.imageUrl = productDto.getImageUrl();
        this.sellerName = productDto.getSellerName();
        this.descriptionImageUrl = productDto.getDescriptionImageUrl();
        this.options = productDto.getOptions() == null
                ? new ArrayList<>()
                : productDto.getOptions().stream().map(PublicProductOptionDto::new).toList();
        this.hasStock = productDto.getQuantity() > 0;
        this.soldOut = !this.hasStock;
        this.soldCount = productDto.getSoldCount();
        this.discoveryTabKeys = productDto.getDiscoveryTabKeys() == null
                ? new ArrayList<>()
                : new ArrayList<>(productDto.getDiscoveryTabKeys());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Double getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(Double originalPrice) {
        this.originalPrice = originalPrice;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSituationScore() {
        return situationScore;
    }

    public void setSituationScore(Integer situationScore) {
        this.situationScore = situationScore;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getDescriptionImageUrl() {
        return descriptionImageUrl;
    }

    public void setDescriptionImageUrl(String descriptionImageUrl) {
        this.descriptionImageUrl = descriptionImageUrl;
    }

    public List<PublicProductOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<PublicProductOptionDto> options) {
        this.options = options == null ? new ArrayList<>() : options;
    }

    public boolean isHasStock() {
        return hasStock;
    }

    public void setHasStock(boolean hasStock) {
        this.hasStock = hasStock;
    }

    public boolean isSoldOut() {
        return soldOut;
    }

    public void setSoldOut(boolean soldOut) {
        this.soldOut = soldOut;
    }

    public Integer getSoldCount() {
        return soldCount;
    }

    public void setSoldCount(Integer soldCount) {
        this.soldCount = soldCount;
    }

    public List<String> getDiscoveryTabKeys() {
        return discoveryTabKeys;
    }

    public void setDiscoveryTabKeys(List<String> discoveryTabKeys) {
        this.discoveryTabKeys = discoveryTabKeys == null ? new ArrayList<>() : discoveryTabKeys;
    }
}
