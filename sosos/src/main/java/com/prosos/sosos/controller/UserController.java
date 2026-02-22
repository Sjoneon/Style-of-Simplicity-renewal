package com.prosos.sosos.controller;

import com.prosos.sosos.dto.UserRegistrationRequest;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final SellerService sellerService;

    @Autowired
    public UserController(UserService userService, SellerService sellerService) {
        this.userService = userService;
        this.sellerService = sellerService;
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login-seller";
    }

    @GetMapping("/info")
    public String showUserInfoPage() {
        return "user-info";
    }

    @GetMapping("/register")
    public String showRegisterPage() {
        return "register-user";
    }

    @PostMapping("/register")
    public String registerUser(@RequestBody UserRegistrationRequest request, Model model) {
        try {
            userService.registerUser(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPhone(),
                    request.getAddress()
            );
            return "redirect:/";
        } catch (IllegalArgumentException e) {
            model.addAttribute("error", e.getMessage());
            return "register-user";
        }
    }

    @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password,
                        Model model,
                        HttpSession session) {
        try {
            if (isBusinessNumber(username)) {
                boolean isLoggedIn = sellerService.login(username, password);
                if (!isLoggedIn) {
                    throw new IllegalArgumentException("판매자 로그인 정보가 올바르지 않습니다.");
                }

                Seller seller = sellerService.findByBusinessNumber(username);
                session.setAttribute("loggedInUser", seller);
                session.setAttribute("userType", "seller");
                model.addAttribute("message", "판매자로 로그인되었습니다.");
                return "redirect:/seller/dashboard";
            }

            if (isEmail(username)) {
                boolean isLoggedIn = userService.login(username, password);
                if (!isLoggedIn) {
                    throw new IllegalArgumentException("사용자 이메일 또는 비밀번호가 올바르지 않습니다.");
                }

                User user = userService.findByEmail(username);
                session.setAttribute("loggedInUser", user);
                session.setAttribute("userType", "user");
                model.addAttribute("message", "사용자로 로그인되었습니다.");
                return "redirect:/";
            }

            throw new IllegalArgumentException("올바른 아이디 형식을 입력하세요.");
        } catch (IllegalArgumentException e) {
            model.addAttribute("error", e.getMessage());
            return "login-seller";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    @GetMapping("/{userId}")
    public String getUserInfo(@PathVariable Long userId, Model model) {
        User user = userService.findUserById(userId);
        if (user != null) {
            model.addAttribute("user", user);
            return "user-info";
        }

        model.addAttribute("error", "사용자를 찾을 수 없습니다.");
        return "user-info";
    }

    private boolean isBusinessNumber(String username) {
        return username.matches("\\d{3}-\\d{2}-\\d{5}");
    }

    private boolean isEmail(String username) {
        return username.matches("^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$");
    }

    @GetMapping("/inquiries")
    public String userInquiries(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user == null) {
            return "redirect:/users/login";
        }
        return "inquiry";
    }

    @GetMapping("/type")
    @ResponseBody
    public String getUserType(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller) {
            return "seller";
        }
        if (loggedInUser instanceof User) {
            return "user";
        }
        return "guest";
    }
}
