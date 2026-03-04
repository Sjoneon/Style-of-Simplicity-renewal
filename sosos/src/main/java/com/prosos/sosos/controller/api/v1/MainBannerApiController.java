package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.MainBannerDto;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.service.MainBannerService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
public class MainBannerApiController {

    private final MainBannerService mainBannerService;

    public MainBannerApiController(MainBannerService mainBannerService) {
        this.mainBannerService = mainBannerService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MainBannerDto>>> getActiveBanners() {
        List<MainBannerDto> banners = mainBannerService.getActiveBanners();
        return ResponseEntity.ok(ApiResponse.success(banners, "메인 배너 목록 조회 성공"));
    }

    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<List<MainBannerDto>>> getManageBanners(HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            List<MainBannerDto> banners = mainBannerService.getBannersBySeller(seller.getId());
            return ResponseEntity.ok(ApiResponse.success(banners, "관리자 배너 목록 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MainBannerDto>> createBanner(
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam(value = "targetProductId", required = false) Long targetProductId,
            @RequestParam(value = "displayOrder", required = false) Integer displayOrder,
            @RequestParam("image") MultipartFile imageFile,
            HttpSession session
    ) {
        try {
            Seller seller = requireLoggedInSeller(session);
            MainBannerDto createdBanner = mainBannerService.createBanner(
                    seller.getId(),
                    title,
                    subtitle,
                    targetProductId,
                    displayOrder,
                    imageFile
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(createdBanner, "메인 배너 등록 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/{bannerId}")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long bannerId, HttpSession session) {
        try {
            Seller seller = requireLoggedInSeller(session);
            mainBannerService.deleteBanner(bannerId, seller.getId());
            return ResponseEntity.ok(ApiResponse.success(null, "메인 배너 삭제 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    private Seller requireLoggedInSeller(HttpSession session) {
        Object loggedInUser = session.getAttribute("loggedInUser");
        if (loggedInUser instanceof Seller seller) {
            return seller;
        }
        throw new IllegalStateException("슈퍼관리자 로그인이 필요합니다.");
    }
}
