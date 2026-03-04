package com.prosos.sosos.dto;

import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.ProductOption;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class ProductDto {
    private Long id;
    private String name;
    private String category;
    private double price;
    private int quantity;
    private String description;
    private Integer situationScore;
    private String imageUrl;
    private Long sellerId;
    private String descriptionImageUrl;
    private List<ProductOptionDto> options = new ArrayList<>();
    private Long selectedOptionId;
    private String selectedSizeLabel;
    private Long cartItemId;
    private Boolean showInStarterTab;
    private Boolean showInGiftTab;
    private Boolean showInNewTab;
    private Boolean showInBasicTab;
    private Boolean showInWorkTab;
    private Integer soldCount;
    private List<String> discoveryTabKeys = new ArrayList<>();

    public ProductDto() {
    }

    public ProductDto(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.category = product.getCategory();
        this.price = product.getPrice();
        this.quantity = product.getQuantity();
        this.description = product.getDescription();
        this.situationScore = product.getSituationScore();
        this.imageUrl = product.getImageUrl();
        this.sellerId = (product.getSeller() != null) ? product.getSeller().getId() : null;
        this.descriptionImageUrl = product.getDescriptionImageUrl();
        this.showInStarterTab = product.getShowInStarterTab();
        this.showInGiftTab = product.getShowInGiftTab();
        this.showInNewTab = product.getShowInNewTab();
        this.showInBasicTab = product.getShowInBasicTab();
        this.showInWorkTab = product.getShowInWorkTab();
        this.soldCount = 0;
        this.discoveryTabKeys = parseDiscoveryTabKeys(product.getDiscoveryTabKeys());

        if (product.getOptions() != null) {
            this.options = product.getOptions().stream()
                    .sorted(Comparator
                            .comparing((ProductOption option) -> option.getDisplayOrder() == null ? 0 : option.getDisplayOrder())
                            .thenComparing(option -> option.getId() == null ? 0L : option.getId()))
                    .map(ProductOptionDto::new)
                    .toList();
        }
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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
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

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getDescriptionImageUrl() {
        return descriptionImageUrl;
    }

    public void setDescriptionImageUrl(String descriptionImageUrl) {
        this.descriptionImageUrl = descriptionImageUrl;
    }

    public List<ProductOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<ProductOptionDto> options) {
        this.options = options == null ? new ArrayList<>() : options;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public void setSelectedOptionId(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }

    public String getSelectedSizeLabel() {
        return selectedSizeLabel;
    }

    public void setSelectedSizeLabel(String selectedSizeLabel) {
        this.selectedSizeLabel = selectedSizeLabel;
    }

    public Long getCartItemId() {
        return cartItemId;
    }

    public void setCartItemId(Long cartItemId) {
        this.cartItemId = cartItemId;
    }

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
        if (discoveryTabKeys == null) {
            this.discoveryTabKeys = null;
            return;
        }
        Set<String> dedupe = new LinkedHashSet<>();
        for (String key : discoveryTabKeys) {
            if (key == null) {
                continue;
            }
            String normalized = key.trim();
            if (!normalized.isBlank()) {
                dedupe.add(normalized);
            }
        }
        this.discoveryTabKeys = new ArrayList<>(dedupe);
    }

    public String toDiscoveryTabKeysCsv() {
        if (discoveryTabKeys == null || discoveryTabKeys.isEmpty()) {
            return null;
        }
        return String.join(",", discoveryTabKeys);
    }

    private static List<String> parseDiscoveryTabKeys(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return new ArrayList<>();
        }
        Set<String> dedupe = new LinkedHashSet<>();
        Arrays.stream(rawValue.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .forEach(dedupe::add);
        return new ArrayList<>(dedupe);
    }
}
