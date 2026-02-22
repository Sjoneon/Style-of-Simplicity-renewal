package com.prosos.sosos.controller.api.v1;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
public class ProductApiController {

    private final SellerService sellerService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public ProductApiController(SellerService sellerService, UserService userService, ObjectMapper objectMapper) {
        this.sellerService = sellerService;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getAllProducts() {
        List<ProductDto> products = sellerService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success(products, "상품 목록 조회 성공"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        try {
            ProductDto product = sellerService.getProductById(id);
            return ResponseEntity.ok(ApiResponse.success(product, "상품 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProductDto>>> searchProductsByTitle(@RequestParam String title) {
        List<ProductDto> products = sellerService.searchProductsByTitle(title);
        return ResponseEntity.ok(ApiResponse.success(products, "상품 검색 성공"));
    }

    @GetMapping("/category")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProductsByCategory(@RequestParam String category) {
        List<ProductDto> products = sellerService.getProductsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(products, "카테고리 조회 성공"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> addProduct(
            @ModelAttribute ProductDto productDto,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam("keywords") String keywordsJson
    ) {
        try {
            Map<String, List<String>> keywords = objectMapper.readValue(keywordsJson, new TypeReference<>() {
            });
            ProductDto savedProduct = sellerService.addProduct(productDto, imageFile, keywords, descriptionImageFile);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(savedProduct, "상품 등록 성공"));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("키워드 JSON 형식이 올바르지 않습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long productId,
            @ModelAttribute ProductDto productDto,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile
    ) {
        try {
            ProductDto updatedProduct = sellerService.updateProduct(productId, productDto, imageFile, descriptionImageFile);
            return ResponseEntity.ok(ApiResponse.success(updatedProduct, "상품 수정 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long productId) {
        sellerService.deleteProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(null, "상품 삭제 성공"));
    }

    @GetMapping("/cart/items")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getCartItems(HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            List<ProductDto> cartItems = userService.getCartItems(user);
            return ResponseEntity.ok(ApiResponse.success(cartItems, "장바구니 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/cart/{productId}")
    public ResponseEntity<ApiResponse<Void>> addToCart(@PathVariable Long productId, HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            ProductDto product = sellerService.getProductById(productId);
            userService.addToCart(user, product, 1);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 추가 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/cart/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(@PathVariable Long productId, HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            userService.removeFromCart(user, productId);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 삭제 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    private User requireLoggedInUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        throw new IllegalStateException("사용자 로그인이 필요합니다.");
    }
}
