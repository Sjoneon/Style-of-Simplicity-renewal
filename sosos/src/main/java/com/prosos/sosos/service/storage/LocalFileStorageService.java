package com.prosos.sosos.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
// 개발/로컬 실행에서 파일을 디스크에 저장하는 구현체다.
public class LocalFileStorageService implements FileStorageService {

    private final Path uploadRootPath;

    public LocalFileStorageService(@Value("${app.upload.base-dir:uploads}") String uploadBaseDir) {
        String normalizedBaseDir = (uploadBaseDir == null || uploadBaseDir.isBlank()) ? "uploads" : uploadBaseDir;
        this.uploadRootPath = Paths.get(normalizedBaseDir).toAbsolutePath().normalize();
    }

    @Override
    public String upload(MultipartFile file, String directory, String fallbackBaseName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required.");
        }

        String normalizedDirectory = normalizeDirectory(directory);
        Path targetDirectory = normalizedDirectory.isBlank()
                ? uploadRootPath
                : uploadRootPath.resolve(normalizedDirectory).normalize();

        try {
            Files.createDirectories(targetDirectory);

            String safeOriginalName = sanitizeFileName(file.getOriginalFilename(), fallbackBaseName);
            String uniqueFileName = UUID.randomUUID() + "_" + safeOriginalName;
            Path targetPath = targetDirectory.resolve(uniqueFileName).normalize();
            // 상위 경로 탈출(path traversal) 업로드를 차단한다.
            if (!targetPath.startsWith(uploadRootPath)) {
                throw new IllegalArgumentException("Invalid target path.");
            }

            file.transferTo(targetPath.toFile());
            return buildPublicPath(normalizedDirectory, uniqueFileName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    private String normalizeDirectory(String directory) {
        if (directory == null || directory.isBlank()) {
            return "";
        }
        String normalized = directory.replace("\\", "/").trim();
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String sanitizeFileName(String originalName, String fallbackBaseName) {
        String fallback = (fallbackBaseName == null || fallbackBaseName.isBlank()) ? "upload-file" : fallbackBaseName;
        String candidate = originalName == null ? "" : originalName.trim();
        if (candidate.isBlank()) {
            return fallback;
        }

        String fileName = Paths.get(candidate).getFileName().toString();
        // 파일명은 URL/파일시스템 안전 문자를 제외하고 정리한다.
        fileName = fileName.replaceAll("\\s+", "-");
        fileName = fileName.replaceAll("[^A-Za-z0-9._-]", "");

        return fileName.isBlank() ? fallback : fileName;
    }

    private String buildPublicPath(String normalizedDirectory, String fileName) {
        if (normalizedDirectory.isBlank()) {
            return "/images/" + fileName;
        }
        return "/images/" + normalizedDirectory + "/" + fileName;
    }
}
