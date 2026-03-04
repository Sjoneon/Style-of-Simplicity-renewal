package com.prosos.sosos.controller;

import com.prosos.sosos.dto.ProductDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.service.SellerService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("/seller")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @GetMapping("/register")
    public String showRegistrationPage() {
        return "register-seller";
    }

    @PostMapping("/register")
    public String registerSeller(Seller seller) {
        sellerService.registerSeller(seller);
        return "redirect:/seller/login";
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login-seller";
    }

    @PostMapping("/login")
    public String login(@RequestParam String businessNumber,
                        @RequestParam String password,
                        Model model) {
        boolean isLoggedIn = sellerService.login(businessNumber, password);
        if (isLoggedIn) {
            return "redirect:/seller/dashboard";
        }

        model.addAttribute("error", "로그인 실패");
        return "login-seller";
    }

    @GetMapping("/dashboard")
    public String showDashboard() {
        return "seller-dashboard";
    }

    @GetMapping("/products/product_register")
    public String showAddProductPage() {
        return "product_register";
    }

    @PostMapping("/products/product_register")
    public String addProduct(@ModelAttribute ProductDto productDto,
                             @RequestParam("image") MultipartFile imageFile) {
        sellerService.addProduct(productDto, imageFile, null, null, null);
        return "redirect:/seller/products";
    }

    @GetMapping("/products")
    public String listProducts(Model model) {
        model.addAttribute("products", sellerService.getAllProducts());
        return "list-products";
    }

    @PostMapping("/products/delete/{productId}")
    public String deleteProduct(@PathVariable Long productId) {
        sellerService.deleteProduct(productId);
        return "redirect:/seller/products";
    }

    @GetMapping("/orders")
    public String showOrdersPage() {
        return "seller-orders";
    }

    @GetMapping("/inquiries")
    public String sellerInquiries(HttpSession session) {
        Seller seller = (Seller) session.getAttribute("loggedInUser");
        if (seller == null) {
            return "redirect:/seller/login";
        }
        return "inquiry";
    }
}
