package com.prosos.sosos.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    // ?곹뭹 ?깅줉 ?붾뱶?ъ씤??
    @PostMapping
    public ResponseEntity<Void> addProduct(
            @ModelAttribute ProductDto productDto,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile,
            @RequestParam("keywords") String keywordsJson
    ) throws IOException {
        Map<String, List<String>> keywords = objectMapper.readValue(keywordsJson, new TypeReference<>() {});
        sellerService.addProduct(productDto, imageFile, keywords, descriptionImageFile);

        String redirectUrl = "http://localhost:8085/seller/dashboard";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Location", redirectUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    // ?곹뭹 ?곸꽭 ?섏씠吏
    @GetMapping("/detail")
    public String getProductDetailPage(@RequestParam("id") Long id, Model model) {
        ProductDto product = sellerService.getProductById(id);
        model.addAttribute("product", product);
        return "product_detail";
    }

    // 紐⑤뱺 ?곹뭹 諛섑솚
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = sellerService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // ?곹뭹 ?섏젙 ?붾뱶?ъ씤??
    @PutMapping("/{productId}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long productId,
            @ModelAttribute ProductDto productDto,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "descriptionImage", required = false) MultipartFile descriptionImageFile
    ) {
        ProductDto updatedProduct = sellerService.updateProduct(productId, productDto, imageFile, descriptionImageFile);
        return ResponseEntity.ok(updatedProduct);
    }

    // ?곹뭹 ??젣 ?붾뱶?ъ씤??(DELETE /api/products/delete/{productId})
    @DeleteMapping("/delete/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        sellerService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    // ?곹뭹 寃???붾뱶?ъ씤??
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProductsByTitle(@RequestParam String title) {
        List<ProductDto> products = sellerService.searchProductsByTitle(title);
        return ResponseEntity.ok(products);
    }

    // 移댄뀒怨좊━蹂??곹뭹 議고쉶
    @GetMapping("/category")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@RequestParam String category) {
        List<ProductDto> products = sellerService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    // ?곹뭹 ID濡?議고쉶
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        try {
            ProductDto product = sellerService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ?곹뭹 ?섏젙 ?섏씠吏 諛섑솚
    @GetMapping("/edit-product")
    public String editProductPage(@RequestParam("id") Long id, Model model) {
        ProductDto product = sellerService.getProductById(id);
        model.addAttribute("product", product);
        return "product-edit";
    }


    // ?λ컮援щ땲 ?섏씠吏
    @GetMapping("/cart")
    public String cartPage(HttpSession session, Model model) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return "redirect:/users/login"; // 濡쒓렇???섏씠吏濡?由щ떎?대젆??
        }

        List<ProductDto> cartItems = userService.getCartItems(user);
        model.addAttribute("cartItems", cartItems); // ?λ컮援щ땲 ?꾩씠?쒖쓣 紐⑤뜽??異붽?
        return "cart"; // templates/cart.html ?ъ슜
    }

    

    // ?λ컮援щ땲 ?곗씠??諛섑솚
    @GetMapping("/cart/items")
    public ResponseEntity<List<ProductDto>> getCartItems(HttpSession session) {
    User user = (User) session.getAttribute("loggedInUser");
    if (user == null) {
        return ResponseEntity.status(401).body(null); // 濡쒓렇?몃릺吏 ?딆쑝硫?401 諛섑솚
    }
    
    // ?λ컮援щ땲 ?꾩씠??濡쒓퉭
    List<ProductDto> cartItems = userService.getCartItems(user);
    System.out.println("?λ컮援щ땲 ?꾩씠?쒕뱾: " + cartItems);  // 濡쒓렇 ?뺤씤
    return ResponseEntity.ok(cartItems);
    }

    

    // ?λ컮援щ땲???곹뭹 異붽?
    @PostMapping("/cart/{productId}")
    public ResponseEntity<?> addToCart(@PathVariable Long productId, HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(401).body("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
        }
    
        // productId瑜?ProductDto 媛앹껜濡?蹂??
        ProductDto productDto = sellerService.getProductById(productId);  // sellerService?먯꽌 ?곹뭹 ?뺣낫 媛?몄샂
    
        // ?섎웾??1濡??ㅼ젙
        int quantity = 1;
    
        // ?λ컮援щ땲??異붽?
        userService.addToCart(user, productDto, quantity);
    
        return ResponseEntity.ok("?λ컮援щ땲??異붽??섏뿀?듬땲??");
    }
    

    // ?λ컮援щ땲?먯꽌 ?곹뭹 ??젣
    @DeleteMapping("/cart/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, HttpSession session) {
    User user = (User) session.getAttribute("loggedInUser");
    if (user == null) {
        return ResponseEntity.status(401).body("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }
    userService.removeFromCart(user, productId);  // ?λ컮援щ땲?먯꽌 ?곹뭹 ??젣
    return ResponseEntity.ok("?λ컮援щ땲?먯꽌 ?쒓굅?섏뿀?듬땲??");
}


    // 援щℓ 泥섎━
    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            userService.purchaseCart(user);
            return ResponseEntity.ok("구매가 완료되었습니다. 메인 페이지로 이동합니다.");
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("구매 처리 중 오류가 발생했습니다.");
        }
    }
}
