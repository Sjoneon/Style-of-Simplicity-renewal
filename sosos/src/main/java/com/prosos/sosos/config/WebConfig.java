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

        Path uploadPath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        String resourceLocation = uploadPath.toUri().toString();

        registry.addResourceHandler("/images/**")
                .addResourceLocations(resourceLocation);
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
