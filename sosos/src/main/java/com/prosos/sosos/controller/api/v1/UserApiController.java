package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.RecentProductViewDto;
import com.prosos.sosos.dto.UserAddressUpdateRequest;
import com.prosos.sosos.dto.UserLoginApiRequest;
import com.prosos.sosos.dto.UserPasswordChangeRequest;
import com.prosos.sosos.dto.UserProfileUpdateRequest;
import com.prosos.sosos.dto.UserRegistrationRequest;
import com.prosos.sosos.dto.UserSessionDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.RecentProductViewService;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
// 사용자 인증/프로필/최근본상품 API를 제공한다.
public class UserApiController {

    private final UserService userService;
    private final SellerService sellerService;
    private final RecentProductViewService recentProductViewService;

    public UserApiController(
            UserService userService,
            SellerService sellerService,
            RecentProductViewService recentProductViewService
    ) {
        this.userService = userService;
        this.sellerService = sellerService;
        this.recentProductViewService = recentProductViewService;
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

            // 로그인 아이디 형식으로 판매자/사용자 인증 경로를 분기한다.
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

    @GetMapping("/me/recent-products")
    public ResponseEntity<ApiResponse<List<RecentProductViewDto>>> getMyRecentProducts(HttpSession session) {
        User loggedInUser = resolveLoggedInUser(session);
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
        }

        List<RecentProductViewDto> recentProducts = recentProductViewService.getMyRecentProducts(loggedInUser.getId());
        return ResponseEntity.ok(ApiResponse.success(recentProducts, "최근 본 상품 조회 성공"));
    }

    @PostMapping("/me/recent-products/{productId}")
    public ResponseEntity<ApiResponse<Void>> recordRecentProduct(
            @PathVariable Long productId,
            HttpSession session
    ) {
        try {
            User loggedInUser = resolveLoggedInUser(session);
            if (loggedInUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
            }

            recentProductViewService.recordView(loggedInUser.getId(), productId);
            return ResponseEntity.ok(ApiResponse.success(null, "최근 본 상품 기록 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserSessionDto>> updateMyProfile(
            @RequestBody UserProfileUpdateRequest request,
            HttpSession session
    ) {
        try {
            User loggedInUser = resolveLoggedInUser(session);
            if (loggedInUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
            }

            if (request == null) {
                throw new IllegalArgumentException("수정할 회원정보를 입력해 주세요.");
            }

            User updatedUser = userService.updateProfile(
                    loggedInUser.getId(),
                    request.getName(),
                    request.getPhone(),
                    request.getAddress()
            );

            session.setAttribute("loggedInUser", updatedUser);
            session.setAttribute("userType", "user");
            return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromUser(updatedUser), "회원정보 수정 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/me/address")
    public ResponseEntity<ApiResponse<UserSessionDto>> updateMyAddress(
            @RequestBody UserAddressUpdateRequest request,
            HttpSession session
    ) {
        try {
            User loggedInUser = resolveLoggedInUser(session);
            if (loggedInUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
            }

            if (request == null) {
                throw new IllegalArgumentException("수정할 배송지 정보를 입력해 주세요.");
            }

            User updatedUser = userService.updateAddress(loggedInUser.getId(), request.getAddress());
            session.setAttribute("loggedInUser", updatedUser);
            session.setAttribute("userType", "user");
            return ResponseEntity.ok(ApiResponse.success(UserSessionDto.fromUser(updatedUser), "배송지 수정 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changeMyPassword(
            @RequestBody UserPasswordChangeRequest request,
            HttpSession session
    ) {
        try {
            User loggedInUser = resolveLoggedInUser(session);
            if (loggedInUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.failure("사용자 로그인이 필요합니다."));
            }

            if (request == null) {
                throw new IllegalArgumentException("비밀번호 변경 정보를 입력해 주세요.");
            }

            userService.changePassword(
                    loggedInUser.getId(),
                    request.getCurrentPassword(),
                    request.getNewPassword()
            );

            session.invalidate();
            return ResponseEntity.ok(ApiResponse.success(null, "비밀번호가 변경되었습니다. 다시 로그인해 주세요."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
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

    private User resolveLoggedInUser(HttpSession session) {
        // 사용자 전용 API는 Seller 세션을 허용하지 않고 User 세션만 통과시킨다.
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof User user) {
            return user;
        }
        return null;
    }
}
