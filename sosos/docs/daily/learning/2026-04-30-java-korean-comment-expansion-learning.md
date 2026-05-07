# 2026-04-30 Java 핵심 로직 한글 주석 확장 학습 메모

## 무엇
- 서비스/컨트롤러/설정 계층에서 주석이 비어 있던 Java 파일에 한글 주석을 보강했다.
- 작업 대상:
  - `config/PasswordConfig.java`
  - `controller/OrderController.java`
  - `controller/SellerController.java`
  - `controller/UserController.java`
  - `controller/api/v1/DiscoveryTabApiController.java`
  - `controller/api/v1/MainBannerApiController.java`
  - `controller/api/v1/OrderApiController.java`
  - `controller/api/v1/UserApiController.java`
  - `controller/api/v1/WishlistApiController.java`
  - `service/DiscoveryTabService.java`
  - `service/MainBannerService.java`
  - `service/storage/FileStorageService.java`
  - `service/storage/LocalFileStorageService.java`

## 왜
- 인증 분기/소유권 검증/정렬 보정/파일 경로 보안 같은 핵심 지점은 코드만으로 의도를 파악하기 어렵다.
- 한글 주석을 최소한으로 붙여 사후 유지보수와 인수인계 속도를 높인다.

## 언제
- 기능 추가/보안 패치 이후, 로직은 맞지만 “왜 이렇게 처리하는지”가 바로 드러나지 않을 때 적용한다.

## 어떻게
1. 주석이 없는 핵심 파일 선별
- 서비스/컨트롤러/설정 계층에서 코멘트가 없는 파일을 우선 대상으로 선정
2. 주석 기준
- “무엇을 하는지”보다 “왜 이 검증/정렬/차단이 필요한지”를 짧게 기록
- 반복되는 단순 로직은 과도한 주석을 피함
3. 인코딩 안정성 검증
- `scripts/check-korean-garbled.ps1`로 깨진 한글 패턴 점검
- `mvn compile`로 문법/빌드 영향 확인

## 완료 기준(Definition of Done)
- 핵심 Java 파일에 유지보수에 필요한 한글 주석이 추가되고, 깨진 한글 없이 컴파일이 통과한다.
