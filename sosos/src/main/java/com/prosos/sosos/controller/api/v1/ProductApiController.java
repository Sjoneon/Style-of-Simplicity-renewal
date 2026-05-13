package com.prosos.sosos.controller.api.v1;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.dto.ProductOptionDto;
import com.prosos.sosos.dto.PublicProductDto;
import com.prosos.sosos.model.Seller;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
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
    public ResponseEntity<ApiResponse<List<PublicProductDto>>> getAllProducts() {
        List<PublicProductDto> products = toPublicProducts(sellerService.getAllProducts());
        return ResponseEntity.ok(ApiResponse.success(products, "상품 목록 조회 성공"));
    }

    @GetMapping("/managed")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getManagedProducts(HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            List<ProductDto> products = sellerService.getProductsBySeller(seller.getId());
            return ResponseEntity.ok(ApiResponse.success(products, "판매자 상품 목록 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicProductDto>> getProductById(@PathVariable Long id) {
        try {
            PublicProductDto product = new PublicProductDto(sellerService.getProductById(id));
            return ResponseEntity.ok(ApiResponse.success(product, "상품 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PublicProductDto>>> searchProductsByTitle(@RequestParam String title) {
        try {
            List<PublicProductDto> products = toPublicProducts(sellerService.searchProductsByTitle(title));
            return ResponseEntity.ok(ApiResponse.success(products, "상품 검색 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/category")
    public ResponseEntity<ApiResponse<List<PublicProductDto>>> getProductsByCategory(@RequestParam String category) {
        try {
            List<PublicProductDto> products = toPublicProducts(sellerService.getProductsByCategory(category));
            return ResponseEntity.ok(ApiResponse.success(products, "카테고리 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> addProduct(
            @ModelAttribute ProductDto productDto,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam("keywords") String keywordsJson,
            @RequestParam(value = "optionsJson", required = false) String optionsJson,
            @RequestParam(value = "discoveryTabKeysJson", required = false) String discoveryTabKeysJson,
            HttpSession session
    ) {
        try {
            Seller seller = requireLoggedInSeller(session);
            Map<String, List<String>> keywords = parseKeywordMap(keywordsJson);
            List<ProductOptionDto> optionDtos = parseOptionDtos(optionsJson, Collections.emptyList());
            List<String> discoveryTabKeys = parseStringList(discoveryTabKeysJson, Collections.emptyList());
            productDto.setDiscoveryTabKeys(discoveryTabKeys);

            ProductDto savedProduct = sellerService.addProductForSeller(
                    seller.getId(),
                    productDto,
                    imageFile,
                    keywords,
                    descriptionImageFile,
                    optionDtos
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(savedProduct, "상품 등록 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("JSON 형식이 올바르지 않습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long productId,
            @ModelAttribute ProductDto productDto,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam(value = "keywords", required = false) String keywordsJson,
            @RequestParam(value = "optionsJson", required = false) String optionsJson,
            @RequestParam(value = "discoveryTabKeysJson", required = false) String discoveryTabKeysJson,
            HttpSession session
    ) {
        try {
            Seller seller = requireLoggedInSeller(session);
            Map<String, List<String>> keywords = keywordsJson == null ? null : parseKeywordMap(keywordsJson);
            List<ProductOptionDto> optionDtos = parseOptionDtos(optionsJson, null);
            List<String> discoveryTabKeys = parseStringList(discoveryTabKeysJson, null);
            productDto.setDiscoveryTabKeys(discoveryTabKeys);
            ProductDto updatedProduct = sellerService.updateProductForSeller(
                    seller.getId(),
                    productId,
                    productDto,
                    imageFile,
                    descriptionImageFile,
                    keywords,
                    optionDtos
            );
            return ResponseEntity.ok(ApiResponse.success(updatedProduct, "상품 수정 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("사이즈 옵션 JSON 형식이 올바르지 않습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long productId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            sellerService.deleteProductForSeller(productId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "상품 삭제 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
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
    public ResponseEntity<ApiResponse<Void>> addToCart(
            @PathVariable Long productId,
            @RequestParam(value = "optionId", required = false) Long optionId,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            userService.addToCart(user, productId, optionId, 1);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 추가 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> removeCartItem(@PathVariable Long cartItemId, HttpSession session) {
        try {
            User user = requireLoggedInUser(session);
            userService.removeCartItem(user, cartItemId);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 항목 삭제 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/cart/items/{cartItemId}/quantity")
    public ResponseEntity<ApiResponse<Void>> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestParam("quantity") Integer quantity,
            HttpSession session
    ) {
        try {
            User user = requireLoggedInUser(session);
            if (quantity == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.failure("수량 값이 필요합니다."));
            }
            userService.updateCartItemQuantity(user, cartItemId, quantity);
            return ResponseEntity.ok(ApiResponse.success(null, "장바구니 수량 변경 성공"));
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

    private Seller requireLoggedInSeller(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller seller) {
            return seller;
        }
        throw new IllegalStateException("판매자 로그인이 필요합니다.");
    }

    private User requireLoggedInUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        throw new IllegalStateException("사용자 로그인이 필요합니다.");
    }

    private List<ProductOptionDto> parseOptionDtos(String optionsJson, List<ProductOptionDto> defaultValue) throws IOException {
        if (optionsJson == null) {
            return defaultValue;
        }
        if (optionsJson.isBlank()) {
            return defaultValue == null ? null : defaultValue;
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<>() {
            });
        } catch (IOException ignored) {
            List<ProductOptionDto> parsedOptions = new ArrayList<>();
            String[] tokens = optionsJson.split(",");
            int displayOrder = 0;
            for (String token : tokens) {
                if (token == null) {
                    continue;
                }
                String normalized = token.trim();
                if (normalized.isBlank()) {
                    continue;
                }
                String[] pair = normalized.split(":");
                if (pair.length != 2) {
                    throw new IOException("Invalid option format: " + normalized);
                }
                String sizeLabel = pair[0].trim();
                Integer quantity;
                try {
                    quantity = Integer.parseInt(pair[1].trim());
                } catch (NumberFormatException e) {
                    throw new IOException("Invalid option quantity: " + normalized, e);
                }
                ProductOptionDto optionDto = new ProductOptionDto();
                optionDto.setSizeLabel(sizeLabel);
                optionDto.setQuantity(quantity);
                optionDto.setDisplayOrder(displayOrder++);
                parsedOptions.add(optionDto);
            }
            return parsedOptions;
        }
    }

    private List<String> parseStringList(String value, List<String> defaultValue) throws IOException {
        if (value == null) {
            return defaultValue;
        }
        if (value.isBlank()) {
            return defaultValue == null ? null : defaultValue;
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {
            });
        } catch (IOException ignored) {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .distinct()
                    .toList();
        }
    }

    private List<PublicProductDto> toPublicProducts(List<ProductDto> products) {
        return products.stream().map(PublicProductDto::new).toList();
    }

    private Map<String, List<String>> parseKeywordMap(String value) throws IOException {
        if (value == null || value.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {
            });
        } catch (IOException ignored) {
            List<String> manualKeywords = Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .distinct()
                    .toList();
            if (manualKeywords.isEmpty()) {
                return Collections.emptyMap();
            }
            Map<String, List<String>> fallback = new LinkedHashMap<>();
            fallback.put("manual", new ArrayList<>(new LinkedHashSet<>(manualKeywords)));
            return fallback;
        }
    }
}
