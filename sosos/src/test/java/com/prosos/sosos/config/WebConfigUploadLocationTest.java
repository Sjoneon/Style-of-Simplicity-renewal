package com.prosos.sosos.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.UrlResource;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebConfigUploadLocationTest {

    @TempDir
    Path tempDir;

    @Test
    void locationEndsWithSlashEvenWhenUploadDirDoesNotExistYet() throws Exception {
        Path missing = tempDir.resolve("uploads");

        String location = WebConfig.toDirectoryLocation(missing.toString());

        assertTrue(location.endsWith("/"));
        // Spring이 요청 파일을 찾는 방식 그대로: 업로드 폴더 안을 가리켜야 한다.
        Path resolved = Path.of(new UrlResource(location).createRelative("a.png").getURI());
        assertEquals(missing.resolve("a.png"), resolved);
    }

    @Test
    void locationUnchangedWhenUploadDirExists() throws Exception {
        Path existing = Files.createDirectory(tempDir.resolve("uploads"));

        assertEquals(existing.toUri().toString(), WebConfig.toDirectoryLocation(existing.toString()));
    }
}
