package com.prosos.sosos.dto;

import com.prosos.sosos.model.DiscoveryTab;

public class DiscoveryTabDto {

    private Long id;
    private String tabKey;
    private String label;
    private Integer displayOrder;
    private Boolean active;

    public DiscoveryTabDto() {
    }

    public DiscoveryTabDto(DiscoveryTab tab) {
        this.id = tab.getId();
        this.tabKey = tab.getTabKey();
        this.label = tab.getLabel();
        this.displayOrder = tab.getDisplayOrder();
        this.active = tab.getActive();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTabKey() {
        return tabKey;
    }

    public void setTabKey(String tabKey) {
        this.tabKey = tabKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
