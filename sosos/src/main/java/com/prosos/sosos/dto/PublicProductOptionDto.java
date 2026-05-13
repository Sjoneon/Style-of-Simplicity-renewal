package com.prosos.sosos.dto;

public class PublicProductOptionDto {

    private Long id;
    private String sizeLabel;
    private boolean soldOut;
    private Integer displayOrder;

    public PublicProductOptionDto() {
    }

    public PublicProductOptionDto(ProductOptionDto optionDto) {
        this.id = optionDto.getId();
        this.sizeLabel = optionDto.getSizeLabel();
        this.soldOut = optionDto.getQuantity() == null || optionDto.getQuantity() <= 0;
        this.displayOrder = optionDto.getDisplayOrder();
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

    public boolean isSoldOut() {
        return soldOut;
    }

    public void setSoldOut(boolean soldOut) {
        this.soldOut = soldOut;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
