package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.UserLoginApiRequest;
import com.prosos.sosos.dto.UserRegistrationRequest;
import com.prosos.sosos.dto.UserSessionDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserApiController {

    private final UserService userService;
    private final SellerService sellerService;

    public UserApiController(UserService userService, SellerService sellerService) {
        this.userService = userService;
        this.sellerService = sellerService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@RequestBody UserRegistrationRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("회원가입 정보를 입력하세요.");
            }
            userService.registerUser(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPhone(),
                    request.getAddress()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(null, "회원가입 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserSessionDto>> login(
            @RequestBody UserLoginApiRequest request,
            HttpSession session
    ) {
        try {
            if (request == null || request.getUsername() == null || request.getPassword() == null) {
                throw new IllegalArgumentException("아이디와 비밀번호를 입력하세요.");
            }

            String username = request.getUsername().trim();
            String password = request.getPassword();
            if (username.isBlank() || password.isBlank()) {
                throw new IllegalArgumentException("아이디와 비밀번호를 입력하세요.");
            }

            if (isBusinessNumber(username)) {
                boolean isLoggedIn = sellerService.login(username, password);
                if (!isLoggedIn) {
                    throw new IllegalArgumentException("판매자 로그인 정보가 올바르지 않습니다.");
                }

                Seller seller = sellerService.findByBusinessNumber(username);
                session.setAttribute("loggedInUser", seller);
                session.setAttribute("userType", "seller");
                return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromSeller(seller), "판매자 로그인 성공"));
            }

            if (isEmail(username)) {
                boolean isLoggedIn = userService.login(username, password);
                if (!isLoggedIn) {
                    throw new IllegalArgumentException("사용자 이메일 또는 비밀번호가 올바르지 않습니다.");
                }

                User user = userService.findByEmail(username);
                session.setAttribute("loggedInUser", user);
                session.setAttribute("userType", "user");
                return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromUser(user), "사용자 로그인 성공"));
            }

            throw new IllegalArgumentException("올바른 아이디 형식을 입력하세요.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(ApiResponse.success(null, "로그아웃 성공"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSessionDto>> getCurrentUser(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromUser(user), "현재 사용자 조회 성공"));
        }
        if (loggedInUser instanceof Seller seller) {
            return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromSeller(seller), "현재 판매자 조회 성공"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("로그인된 사용자가 없습니다."));
    }

    @GetMapping("/type")
    public ResponseEntity<ApiResponse<String>> getUserType(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller) {
            return ResponseEntity.ok(ApiResponse.success("seller", "사용자 유형 조회 성공"));
        }
        if (loggedInUser instanceof User) {
            return ResponseEntity.ok(ApiResponse.success("user", "사용자 유형 조회 성공"));
        }
        return ResponseEntity.ok(ApiResponse.success("guest", "비로그인 사용자"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserSessionDto>> getUserById(@PathVariable Long userId) {
        User user = userService.findUserById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("사용자를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromUser(user), "사용자 조회 성공"));
    }

    private boolean isBusinessNumber(String username) {
        return username.matches("\\d{3}-\\d{2}-\\d{5}");
    }

    private boolean isEmail(String username) {
        return username.matches("^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$");
    }
}
