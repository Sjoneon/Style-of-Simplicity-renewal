package com.prosos.sosos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
public class SososApplication {

    private static final List<String> REQUIRED_DB_ENV_KEYS = List.of(
            "DB_USERNAME",
            "DB_PASSWORD"
    );

    public static void main(String[] args) {
        validateRequiredEnvironmentVariables();
        SpringApplication.run(SososApplication.class, args);
    }

    private static void validateRequiredEnvironmentVariables() {
        for (String envKey : REQUIRED_DB_ENV_KEYS) {
            if (!hasText(readValue(envKey))) {
                throw new IllegalStateException(
                        "Missing required environment variable: " + envKey
                                + ". Set it before starting backend."
                );
            }
        }

        if (isProdProfileActive() && isS3StorageEnabled() && !hasText(readValue("APP_STORAGE_S3_BUCKET"))) {
            throw new IllegalStateException(
                    "Missing required environment variable: APP_STORAGE_S3_BUCKET "
                            + "(required when prod profile uses S3 storage)."
            );
        }
    }

    private static boolean isProdProfileActive() {
        String activeProfiles = readValue("SPRING_PROFILES_ACTIVE");
        if (!hasText(activeProfiles)) {
            return false;
        }

        return Arrays.stream(activeProfiles.split(","))
                .map(String::trim)
                .anyMatch("prod"::equalsIgnoreCase);
    }

    private static boolean isS3StorageEnabled() {
        String storageType = readValue("APP_STORAGE_TYPE");
        if (!hasText(storageType)) {
            return true;
        }
        return "s3".equalsIgnoreCase(storageType.trim());
    }

    private static String readValue(String key) {
        String fromEnv = System.getenv(key);
        if (hasText(fromEnv)) {
            return fromEnv;
        }
        return System.getProperty(key);
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
