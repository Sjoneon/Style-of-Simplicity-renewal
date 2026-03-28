package com.prosos.sosos.service.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String upload(MultipartFile file, String directory, String fallbackBaseName);
}
