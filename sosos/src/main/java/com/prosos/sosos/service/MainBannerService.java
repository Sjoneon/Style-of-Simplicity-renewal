package com.prosos.sosos.service;

import com.prosos.sosos.dto.MainBannerDto;
import com.prosos.sosos.model.MainBanner;
import com.prosos.sosos.model.Seller;
import com.prosos.sosos.repository.MainBannerRepository;
import com.prosos.sosos.repository.ProductRepository;
import com.prosos.sosos.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class MainBannerService {

    private final MainBannerRepository mainBannerRepository;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final Path bannerUploadPath;

    public MainBannerService(
            MainBannerRepository mainBannerRepository,
            SellerRepository sellerRepository,
            ProductRepository productRepository,
            @Value("${app.upload.base-dir:uploads}") String uploadBaseDir
    ) {
        this.mainBannerRepository = mainBannerRepository;
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;

        String normalizedBaseDir = (uploadBaseDir == null || uploadBaseDir.isBlank()) ? "uploads" : uploadBaseDir;
        this.bannerUploadPath = Paths.get(normalizedBaseDir).toAbsolutePath().normalize().resolve("banners");
    }

    public List<MainBannerDto> getActiveBanners() {
        return mainBannerRepository.findByActiveTrueOrderByDisplayOrderAscIdDesc()
                .stream()
                .map(MainBannerDto::new)
                .toList();
    }

    public List<MainBannerDto> getBannersBySeller(Long sellerId) {
        return mainBannerRepository.findBySeller_IdOrderByDisplayOrderAscIdDesc(sellerId)
                .stream()
                .map(MainBannerDto::new)
                .toList();
    }

    @Transactional
    public MainBannerDto createBanner(
            Long sellerId,
            String title,
            String subtitle,
            Long targetProductId,
            Integer displayOrder,
            MultipartFile imageFile
    ) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("배너 이미지를 선택해 주세요.");
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보를 찾을 수 없습니다."));

        if (targetProductId != null && !productRepository.existsById(targetProductId)) {
            throw new IllegalArgumentException("연결할 상품을 찾을 수 없습니다.");
        }

        MainBanner banner = new MainBanner();
        banner.setSeller(seller);
        banner.setTitle(trimToNull(title));
        banner.setSubtitle(trimToNull(subtitle));
        banner.setTargetProductId(targetProductId);
        banner.setDisplayOrder(displayOrder == null ? 0 : Math.max(displayOrder, 0));
        banner.setActive(true);
        banner.setImageUrl(saveBannerImageFile(imageFile));

        MainBanner savedBanner = mainBannerRepository.save(banner);
        return new MainBannerDto(savedBanner);
    }

    @Transactional
    public void deleteBanner(Long bannerId, Long sellerId) {
        MainBanner banner = mainBannerRepository.findById(bannerId)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));

        if (!Objects.equals(banner.getSeller().getId(), sellerId)) {
            throw new IllegalArgumentException("본인이 등록한 배너만 삭제할 수 있습니다.");
        }

        mainBannerRepository.delete(banner);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String saveBannerImageFile(MultipartFile imageFile) {
        try {
            Files.createDirectories(bannerUploadPath);

            String originalName = imageFile.getOriginalFilename();
            String safeOriginalName = (originalName == null || originalName.isBlank()) ? "main-banner" : originalName;
            String uniqueFileName = UUID.randomUUID() + "_" + safeOriginalName;
            Path targetPath = bannerUploadPath.resolve(uniqueFileName).normalize();

            imageFile.transferTo(targetPath.toFile());
            return "/images/banners/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("배너 이미지 저장 중 오류가 발생했습니다.", e);
        }
    }
}
