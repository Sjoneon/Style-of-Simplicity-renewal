package com.prosos.sosos.controller.api.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductApiControllerSecurityTest {

    private SellerService sellerService;
    private UserService userService;
    private ProductApiController controller;

    @BeforeEach
    void setUp() {
        sellerService = mock(SellerService.class);
        userService = mock(UserService.class);
        controller = new ProductApiController(sellerService, userService, new ObjectMapper());
    }

    @Test
    void shouldBlockProductCreateWhenSellerNotLoggedIn() {
        ProductDto productDto = new ProductDto();
        MockMultipartFile imageFile = new MockMultipartFile("image", "item.jpg", "image/jpeg", new byte[]{1, 2, 3});

        ResponseEntity<ApiResponse<ProductDto>> response = controller.addProduct(
                productDto,
                imageFile,
                null,
                "{}",
                "[]",
                "[]",
                new MockHttpSession()
        );

        assertEquals(401, response.getStatusCode().value());
        verify(sellerService, never()).addProductForSeller(anyLong(), any(), any(), anyMap(), any(), anyList());
    }

    @Test
    void shouldUseSessionSellerIdWhenCreatingProduct() {
        MockHttpSession session = new MockHttpSession();
        Seller seller = new Seller();
        seller.setId(2L);
        session.setAttribute("loggedInUser", seller);

        ProductDto requestDto = new ProductDto();
        requestDto.setSellerId(999L);

        ProductDto savedDto = new ProductDto();
        savedDto.setId(100L);
        when(sellerService.addProductForSeller(eq(2L), any(ProductDto.class), any(), anyMap(), any(), anyList()))
                .thenReturn(savedDto);

        MockMultipartFile imageFile = new MockMultipartFile("image", "item.jpg", "image/jpeg", new byte[]{1, 2, 3});

        ResponseEntity<ApiResponse<ProductDto>> response = controller.addProduct(
                requestDto,
                imageFile,
                null,
                "{}",
                "[]",
                "[]",
                session
        );

        assertEquals(201, response.getStatusCode().value());
        verify(sellerService).addProductForSeller(eq(2L), eq(requestDto), any(), anyMap(), any(), anyList());
    }
}
