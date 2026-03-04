package com.prosos.sosos.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.dto.ProductOptionDto;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/products")
public class ProductController {

    private final SellerService sellerService;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    public ProductController(SellerService sellerService, ObjectMapper objectMapper, UserService userService) {
        this.sellerService = sellerService;
        this.objectMapper = objectMapper;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Void> addProduct(
            @ModelAttribute ProductDto productDto,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam("keywords") String keywordsJson,
            @RequestParam(value = "options", required = false) String optionsJson
    ) throws IOException {
        Map<String, List<String>> keywords = objectMapper.readValue(keywordsJson, new TypeReference<>() {
        });
        List<ProductOptionDto> optionDtos = parseOptionDtos(optionsJson, Collections.emptyList());
        sellerService.addProduct(productDto, imageFile, keywords, descriptionImageFile, optionDtos);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Location", "http://localhost:8085/seller/dashboard");
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/detail")
    public String getProductDetailPage(@RequestParam("id") Long id, Model model) {
        ProductDto product = sellerService.getProductById(id);
        model.addAttribute("product", product);
        return "product_detail";
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(sellerService.getAllProducts());
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long productId,
            @ModelAttribute ProductDto productDto,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam(value = "options", required = false) String optionsJson
    ) throws IOException {
        List<ProductOptionDto> optionDtos = parseOptionDtos(optionsJson, null);
        ProductDto updatedProduct = sellerService.updateProduct(productId, productDto, imageFile, descriptionImageFile, optionDtos);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/delete/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        sellerService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProductsByTitle(@RequestParam String title) {
        return ResponseEntity.ok(sellerService.searchProductsByTitle(title));
    }

    @GetMapping("/category")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@RequestParam String category) {
        return ResponseEntity.ok(sellerService.getProductsByCategory(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sellerService.getProductById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/edit-product")
    public String editProductPage(@RequestParam("id") Long id, Model model) {
        ProductDto product = sellerService.getProductById(id);
        model.addAttribute("product", product);
        return "product-edit";
    }

    @GetMapping("/cart")
    public String cartPage(HttpSession session, Model model) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return "redirect:/users/login";
        }
        model.addAttribute("cartItems", userService.getCartItems(user));
        return "cart";
    }

    @GetMapping("/cart/items")
    public ResponseEntity<List<ProductDto>> getCartItems(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        return ResponseEntity.ok(userService.getCartItems(user));
    }

    @PostMapping("/cart/{productId}")
    public ResponseEntity<?> addToCart(
            @PathVariable Long productId,
            @RequestParam(value = "optionId", required = false) Long optionId,
            HttpSession session
    ) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        userService.addToCart(user, productId, optionId, 1);
        return ResponseEntity.ok("장바구니 추가 성공");
    }

    @DeleteMapping("/cart/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        userService.removeFromCart(user, productId);
        return ResponseEntity.ok("장바구니 삭제 성공");
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        try {
            userService.purchaseCart(user);
            return ResponseEntity.ok("구매 완료");
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("구매 처리 중 오류");
        }
    }

    private List<ProductOptionDto> parseOptionDtos(String optionsJson, List<ProductOptionDto> defaultValue) throws IOException {
        if (optionsJson == null) {
            return defaultValue;
        }
        if (optionsJson.isBlank()) {
            return defaultValue == null ? null : defaultValue;
        }
        return objectMapper.readValue(optionsJson, new TypeReference<>() {
        });
    }
}
