package com.prosos.sosos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final List<String> DEFAULT_LOCAL_ORIGINS = List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
    );

    @Value("${app.upload.base-dir:uploads}")
    private String uploadBaseDir;

    @Value("${app.storage.type:local}")
    private String storageType;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173}")
    private String corsAllowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(resolveAllowedOrigins())
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!"local".equalsIgnoreCase(storageType)) {
            return;
        }

        registry.addResourceHandler("/images/**")
                .addResourceLocations(toDirectoryLocation(uploadBaseDir));
    }

    // Path.toUri()는 폴더가 이미 있을 때만 끝에 '/'를 붙인다. '/'가 없으면 Spring이 파일을
    // 상위 폴더에서 찾아 업로드 이미지가 404가 되므로 폴더 존재 여부와 상관없이 붙인다.
    // 자세한 배경: docs/daily/learning/2026-11-23-upload-image-404-trailing-slash-learning.md
    static String toDirectoryLocation(String baseDir) {
        Path uploadPath = Paths.get(baseDir).toAbsolutePath().normalize();
        String location = uploadPath.toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }

    private String[] resolveAllowedOrigins() {
        String[] parsed = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .distinct()
                .toArray(String[]::new);

        if (parsed.length > 0) {
            return parsed;
        }

        return DEFAULT_LOCAL_ORIGINS.toArray(new String[0]);
    }
}
