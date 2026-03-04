package com.prosos.sosos.dto;

import com.prosos.sosos.model.ProductOption;

public class ProductOptionDto {

    private Long id;
    private String sizeLabel;
    private Integer quantity;
    private Integer displayOrder;

    public ProductOptionDto() {
    }

    public ProductOptionDto(ProductOption option) {
        this.id = option.getId();
        this.sizeLabel = option.getSizeLabel();
        this.quantity = option.getQuantity();
        this.displayOrder = option.getDisplayOrder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSizeLabel() {
        return sizeLabel;
    }

    public void setSizeLabel(String sizeLabel) {
        this.sizeLabel = sizeLabel;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
