package com.prosos.sosos.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicProductDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void publicProductDto_excludesInternalFieldsAndKeepsSafeStockSignals() throws Exception {
        ProductOptionDto medium = new ProductOptionDto();
        medium.setId(1L);
        medium.setSizeLabel("M");
        medium.setQuantity(3);
        medium.setDisplayOrder(0);

        ProductOptionDto large = new ProductOptionDto();
        large.setId(2L);
        large.setSizeLabel("L");
        large.setQuantity(0);
        large.setDisplayOrder(1);

        ProductDto productDto = new ProductDto();
        productDto.setId(10L);
        productDto.setName("Security Test Product");
        productDto.setCategory("TOP");
        productDto.setPrice(39000);
        productDto.setOriginalPrice(49000.0);
        productDto.setQuantity(5);
        productDto.setDescription("test");
        productDto.setImageUrl("https://example.com/image.jpg");
        productDto.setSellerId(99L);
        productDto.setSellerName("TEST_ADMIN");
        productDto.setDescriptionImageUrl("https://example.com/detail.jpg");
        productDto.setOptions(List.of(medium, large));
        productDto.setShowInStarterTab(true);
        productDto.setShowInGiftTab(false);
        productDto.setShowInNewTab(true);
        productDto.setShowInBasicTab(false);
        productDto.setShowInWorkTab(true);
        productDto.setSoldCount(7);
        productDto.setDiscoveryTabKeys(List.of("new", "gift"));
        productDto.setKeywords(List.of("빈티지", "스트릿"));

        PublicProductDto publicProductDto = new PublicProductDto(productDto);
        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(publicProductDto));

        assertTrue(json.get("hasStock").asBoolean());
        assertFalse(json.get("soldOut").asBoolean());
        assertTrue(json.get("options").get(0).get("soldOut").isBoolean());
        assertTrue(json.get("options").get(1).get("soldOut").asBoolean());

        assertFalse(json.has("quantity"));
        assertFalse(json.has("sellerId"));
        assertFalse(json.has("keywords"));
        assertFalse(json.has("showInStarterTab"));
        assertFalse(json.get("options").get(0).has("quantity"));
    }
}
