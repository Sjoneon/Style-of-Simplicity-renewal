package com.prosos.sosos.controller;

import com.prosos.sosos.dto.InquiryDto;
import com.prosos.sosos.model.Inquiry;
import com.prosos.sosos.model.Product;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.repository.InquiryRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.UserRepository;
import com.prosos.sosos.service.NotificationService;
import com.prosos.sosos.service.storage.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InquiryControllerSecurityTest {

    private InquiryRepository inquiryRepository;
    private UserRepository userRepository;
    private ProductRepository productRepository;
    private NotificationService notificationService;
    private FileStorageService fileStorageService;
    private InquiryController controller;

    @BeforeEach
    void setUp() {
        inquiryRepository = mock(InquiryRepository.class);
        userRepository = mock(UserRepository.class);
        productRepository = mock(ProductRepository.class);
        notificationService = mock(NotificationService.class);
        fileStorageService = mock(FileStorageService.class);

        controller = new InquiryController(
                inquiryRepository,
                userRepository,
                productRepository,
                notificationService,
                fileStorageService
        );
    }

    @Test
    void shouldReturnUnauthorizedWhenFetchingAllInquiriesWithoutSellerLogin() {
        ResponseEntity<List<InquiryDto>> response = controller.getInquiries(new MockHttpSession());

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void shouldReturnOnlyOwnProductInquiriesForSeller() {
        MockHttpSession session = new MockHttpSession();
        Seller seller = new Seller();
        seller.setId(5L);
        session.setAttribute("loggedInUser", seller);

        Inquiry ownProductInquiry = new Inquiry();
        ownProductInquiry.setId(1L);
        ownProductInquiry.setUserId(10L);
        ownProductInquiry.setProductId(100L);
        ownProductInquiry.setCategory("SERVICE");
        ownProductInquiry.setTitle("A");
        ownProductInquiry.setContent("A");
        ownProductInquiry.setCreatedDate(LocalDateTime.now());

        Inquiry otherSellerInquiry = new Inquiry();
        otherSellerInquiry.setId(2L);
        otherSellerInquiry.setUserId(11L);
        otherSellerInquiry.setProductId(200L);
        otherSellerInquiry.setCategory("SERVICE");
        otherSellerInquiry.setTitle("B");
        otherSellerInquiry.setContent("B");
        otherSellerInquiry.setCreatedDate(LocalDateTime.now());

        Inquiry siteInquiry = new Inquiry();
        siteInquiry.setId(3L);
        siteInquiry.setUserId(12L);
        siteInquiry.setProductId(null);
        siteInquiry.setCategory("SITE_USAGE");
        siteInquiry.setTitle("C");
        siteInquiry.setContent("C");
        siteInquiry.setCreatedDate(LocalDateTime.now());

        Product ownProduct = new Product();
        ownProduct.setId(100L);
        ownProduct.setSeller(seller);

        Seller anotherSeller = new Seller();
        anotherSeller.setId(9L);
        Product anotherProduct = new Product();
        anotherProduct.setId(200L);
        anotherProduct.setSeller(anotherSeller);

        when(inquiryRepository.findAll()).thenReturn(List.of(ownProductInquiry, otherSellerInquiry, siteInquiry));
        when(productRepository.findById(100L)).thenReturn(Optional.of(ownProduct));
        when(productRepository.findById(200L)).thenReturn(Optional.of(anotherProduct));

        User user10 = new User();
        user10.setId(10L);
        user10.setName("u10");
        User user12 = new User();
        user12.setId(12L);
        user12.setName("u12");
        when(userRepository.findById(10L)).thenReturn(Optional.of(user10));
        when(userRepository.findById(12L)).thenReturn(Optional.of(user12));

        ResponseEntity<List<InquiryDto>> response = controller.getInquiries(session);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals(List.of(1L, 3L), response.getBody().stream().map(InquiryDto::getId).toList());
    }
}
