package com.prosos.sosos.service.storage;

import org.springframework.web.multipart.MultipartFile;

// 저장소 구현체(Local/S3)를 교체 가능하게 만드는 공통 업로드 계약이다.
public interface FileStorageService {

    // 업로드 후 웹에서 접근 가능한 상대 경로를 반환한다.
    String upload(MultipartFile file, String directory, String fallbackBaseName);
}
