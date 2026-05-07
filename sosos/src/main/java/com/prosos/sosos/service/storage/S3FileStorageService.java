package com.prosos.sosos.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;
    private final String prefix;
    private final String publicBaseUrl;

    public S3FileStorageService(
            @Value("${app.storage.s3.bucket}") String bucket,
            @Value("${app.storage.s3.region:ap-northeast-2}") String region,
            @Value("${app.storage.s3.prefix:sosos}") String prefix,
            @Value("${app.storage.s3.public-base-url:}") String publicBaseUrl,
            @Value("${app.storage.s3.endpoint:}") String endpoint,
            @Value("${app.storage.s3.path-style-access:false}") boolean pathStyleAccess
    ) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalArgumentException("Missing app.storage.s3.bucket");
        }

        this.bucket = bucket.trim();
        this.region = (region == null || region.isBlank()) ? "ap-northeast-2" : region.trim();
        this.prefix = normalizeDirectory(prefix);
        this.publicBaseUrl = normalizeBaseUrl(publicBaseUrl);

        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(this.region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(pathStyleAccess)
                        .build());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint.trim()));
        }

        this.s3Client = builder.build();
    }

    @Override
    public String upload(MultipartFile file, String directory, String fallbackBaseName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required.");
        }

        String normalizedDirectory = normalizeDirectory(directory);
        String safeOriginalName = sanitizeFileName(file.getOriginalFilename(), fallbackBaseName);
        String uniqueFileName = UUID.randomUUID() + "_" + safeOriginalName;
        String key = buildObjectKey(normalizedDirectory, uniqueFileName);

        try (InputStream inputStream = file.getInputStream()) {
            PutObjectRequest.Builder requestBuilder = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key);

            String contentType = file.getContentType();
            if (contentType != null && !contentType.isBlank()) {
                requestBuilder.contentType(contentType);
            }

            s3Client.putObject(
                    requestBuilder.build(),
                    RequestBody.fromInputStream(inputStream, file.getSize())
            );

            return resolvePublicUrl(key);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3.", e);
        }
    }

    private String buildObjectKey(String directory, String fileName) {
        List<String> segments = new ArrayList<>();
        if (!prefix.isBlank()) {
            segments.add(prefix);
        }
        if (!directory.isBlank()) {
            segments.add(directory);
        }
        segments.add(fileName);
        return String.join("/", segments);
    }

    private String resolvePublicUrl(String key) {
        if (!publicBaseUrl.isBlank()) {
            return publicBaseUrl + "/" + key;
        }
        if ("us-east-1".equals(region)) {
            return "https://" + bucket + ".s3.amazonaws.com/" + key;
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
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

        String fileName = candidate.replace("\\", "/");
        int slashIndex = fileName.lastIndexOf("/");
        if (slashIndex >= 0 && slashIndex < fileName.length() - 1) {
            fileName = fileName.substring(slashIndex + 1);
        }

        fileName = fileName.replaceAll("\\s+", "-");
        fileName = fileName.replaceAll("[^A-Za-z0-9._-]", "");
        return fileName.isBlank() ? fallback : fileName;
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null) {
            return "";
        }
        String trimmed = baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
