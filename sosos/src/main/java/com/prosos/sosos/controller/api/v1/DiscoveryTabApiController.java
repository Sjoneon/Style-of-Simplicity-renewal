package com.prosos.sosos.controller.api.v1;

import com.prosos.sosos.dto.ApiResponse;
import com.prosos.sosos.dto.DiscoveryTabDto;
import com.prosos.sosos.dto.DiscoveryTabRequest;
import com.prosos.sosos.service.DiscoveryTabService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discovery-tabs")
public class DiscoveryTabApiController {

    private final DiscoveryTabService discoveryTabService;

    public DiscoveryTabApiController(DiscoveryTabService discoveryTabService) {
        this.discoveryTabService = discoveryTabService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DiscoveryTabDto>>> getActiveTabs() {
        List<DiscoveryTabDto> tabs = discoveryTabService.getActiveTabs();
        return ResponseEntity.ok(ApiResponse.success(tabs, "탐색 탭 조회 성공"));
    }

    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<List<DiscoveryTabDto>>> getManageTabs(HttpSession session) {
        try {
            requireSellerAdmin(session);
            List<DiscoveryTabDto> tabs = discoveryTabService.getManageTabs();
            return ResponseEntity.ok(ApiResponse.success(tabs, "탐색 탭 관리 조회 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DiscoveryTabDto>> createTab(
            @RequestBody DiscoveryTabRequest request,
            HttpSession session
    ) {
        try {
            requireSellerAdmin(session);
            DiscoveryTabDto created = discoveryTabService.createTab(
                    request == null ? null : request.getLabel(),
                    request == null ? null : request.getDisplayOrder(),
                    request == null ? null : request.getActive()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "탐색 탭 추가 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PutMapping("/{tabId}")
    public ResponseEntity<ApiResponse<DiscoveryTabDto>> updateTab(
            @PathVariable Long tabId,
            @RequestBody DiscoveryTabRequest request,
            HttpSession session
    ) {
        try {
            requireSellerAdmin(session);
            DiscoveryTabDto updated = discoveryTabService.updateTab(
                    tabId,
                    request == null ? null : request.getLabel(),
                    request == null ? null : request.getDisplayOrder(),
                    request == null ? null : request.getActive()
            );
            return ResponseEntity.ok(ApiResponse.success(updated, "탐색 탭 수정 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    @DeleteMapping("/{tabId}")
    public ResponseEntity<ApiResponse<Void>> deleteTab(@PathVariable Long tabId, HttpSession session) {
        try {
            requireSellerAdmin(session);
            discoveryTabService.deleteTab(tabId);
            return ResponseEntity.ok(ApiResponse.success(null, "탐색 탭 삭제 성공"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(e.getMessage()));
        }
    }

    private void requireSellerAdmin(HttpSession session) {
        Object userType = session.getAttribute("userType");
        if (!"seller".equals(userType)) {
            throw new IllegalStateException("슈퍼관리자 로그인이 필요합니다.");
        }
    }
}
