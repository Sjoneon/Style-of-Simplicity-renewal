package com.prosos.sosos.service.storage;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class S3CredentialSmokeTest {

    @Test
    void shouldUploadAndDeleteObjectWithRealCredentials() throws IOException {
        String runFlag = readValue("RUN_S3_SMOKE_TEST");
        Assumptions.assumeTrue(
                "true".equalsIgnoreCase(runFlag),
                "Skip S3 smoke test. Set RUN_S3_SMOKE_TEST=true to run."
        );

        String bucket = readValue("APP_STORAGE_S3_BUCKET");
        Assumptions.assumeTrue(hasText(bucket), "Skip S3 smoke test. APP_STORAGE_S3_BUCKET is missing.");

        String region = readValue("APP_STORAGE_S3_REGION");
        if (!hasText(region)) {
            region = "ap-northeast-2";
        }

        String prefix = readValue("APP_STORAGE_S3_PREFIX");
        String objectKey = buildObjectKey(prefix);
        String expectedPayload = "s3-smoke-test-" + Instant.now();
        boolean uploaded = false;

        S3Client s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(objectKey)
                            .contentType("text/plain")
                            .build(),
                    RequestBody.fromString(expectedPayload, StandardCharsets.UTF_8)
            );
            uploaded = true;

            HeadObjectResponse head = s3Client.headObject(
                    HeadObjectRequest.builder()
                            .bucket(bucket)
                            .key(objectKey)
                            .build()
            );
            assertNotNull(head.eTag(), "Uploaded object must have ETag.");

            try (InputStream response = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(objectKey)
                            .build(),
                    software.amazon.awssdk.core.sync.ResponseTransformer.toInputStream())) {
                String actualPayload = new String(response.readAllBytes(), StandardCharsets.UTF_8);
                assertEquals(expectedPayload, actualPayload, "Uploaded payload must be readable.");
            }
        } finally {
            if (uploaded) {
                s3Client.deleteObject(
                        DeleteObjectRequest.builder()
                                .bucket(bucket)
                                .key(objectKey)
                                .build()
                );
            }
            s3Client.close();
        }
    }

    private String buildObjectKey(String prefix) {
        String normalizedPrefix = normalize(prefix);
        String fileName = "smoke-test-" + UUID.randomUUID() + ".txt";
        if (!hasText(normalizedPrefix)) {
            return fileName;
        }
        return normalizedPrefix + "/smoke/" + fileName;
    }

    private String normalize(String value) {
        if (!hasText(value)) {
            return "";
        }

        String normalized = value.trim().replace("\\", "/");
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String readValue(String key) {
        String fromEnv = System.getenv(key);
        if (hasText(fromEnv)) {
            return fromEnv;
        }
        return System.getProperty(key);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
