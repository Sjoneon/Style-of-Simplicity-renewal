# 이미지/파일 저장 전략 마무리 (dev local / prod S3)

## 무엇
- 업로드 저장 방식을 환경별로 분리한다.
  - dev: 로컬 디스크 저장
  - prod: AWS S3 저장
- 서비스 코드에서 파일 시스템 경로를 직접 다루지 않고, 공통 스토리지 인터페이스를 통해 저장/조회 URL을 받는다.

## 왜
- 업로드 경로가 서비스 클래스에 박혀 있으면 환경 전환 시 수정 범위가 커진다.
- 운영 배포에서는 서버 디스크보다 S3가 확장/백업/운영 측면에서 유리하다.
- 저장 정책을 코드에서 분리하면 dev/prod 전환 시 설정값만 바꿔서 동작시킬 수 있다.

## 언제
- 로드맵 2순위 6번 항목(이미지/파일 저장 전략 정리) 마무리 단계
- Docker/AWS 배포(3순위) 전 선행 작업

## 어떻게
1. 저장 인터페이스 `FileStorageService` 추가
2. 로컬 구현 `LocalFileStorageService` 추가 (`app.storage.type=local`)
3. S3 구현 `S3FileStorageService` 추가 (`app.storage.type=s3`)
4. `SellerService`, `MainBannerService` 업로드 로직을 스토리지 인터페이스 호출로 변경
5. `application-dev.properties` / `application-prod.properties`에 저장 타입 및 S3 설정키 확정
6. `WebConfig`에서 local 모드일 때만 `/images/**` 리소스 매핑
7. 백엔드 `clean compile`로 검증

## 쉬운 용어 설명
- 스토리지 추상화: 저장 방법을 숨기고 공통 호출만 쓰는 방식
- 구현체: 실제 저장을 담당하는 클래스(local 저장 클래스, S3 저장 클래스)
- 공개 URL: 프론트에서 이미지 표시 시 사용하는 최종 주소

## 작업 파일
- `sosos/pom.xml`
- `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/src/main/java/com/prosos/sosos/service/MainBannerService.java`
- `sosos/src/main/java/com/prosos/sosos/service/storage/FileStorageService.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/service/storage/LocalFileStorageService.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/service/storage/S3FileStorageService.java` (신규)
- `sosos/src/main/resources/application-dev.properties`
- `sosos/src/main/resources/application-prod.properties`

## 완료 기준 (DoD)
- dev 프로필에서 로컬 업로드/조회가 기존처럼 동작
- prod 프로필에서 `app.storage.type=s3` 설정 시 S3 업로드 + 조회 URL 반환
- 서비스 코드에 로컬 경로 하드코딩이 남지 않음

## 검증 결과
- `cd sosos && .\\mvnw.cmd clean -DskipTests compile` 성공
- 로컬 S3 모드 스모크 확인
  - `APP_STORAGE_TYPE=s3`로 기동 후 업로드 API 호출 가능
  - AWS 자격증명 미설정 시 `Unable to load credentials...` 오류 반환 확인
  - 결론: 코드 경로 정상, 실제 자격증명 연결 검증만 남음
