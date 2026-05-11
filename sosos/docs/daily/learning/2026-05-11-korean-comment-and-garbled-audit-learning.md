# 한글 주석 보강 + 한글 깨짐 전수 검수

## 무엇
- 핵심 함수(문의/검색/SQLi 가드) 중심으로 한글 주석을 보강한다.
- 기존 코드의 한글 깨짐(문자열/주석/인코딩)을 전수 검사한다.
- 깨짐이 발견되면 즉시 복구하고 컴파일 정상 여부를 확인한다.

## 왜
- 핵심 보안/도메인 로직은 읽는 사람이 빠르게 의도를 이해해야 유지보수 비용이 줄어든다.
- 한글 깨짐은 메시지 품질 저하와 디버깅 난이도 상승으로 이어진다.
- 운영 직전/운영 중에는 작은 인코딩 오류도 장애성 이슈가 될 수 있다.

## 언제
- 기능 추가 전후, 배포 전 회귀 점검 시점에 수행한다.
- 특히 최근 수정 파일이 많거나 보안 로직이 바뀐 날에는 우선 수행한다.

## 어떻게
1. 전수 점검 스크립트 실행
   - `scripts/check-korean-garbled.ps1`
2. 핵심 파일 주석 보강
   - `InquiryController`, `ProductApiController`, `SellerService`, `SqlInputGuardService` 중심
3. 재점검
   - 스크립트 재실행으로 깨짐 0 확인
4. 컴파일 검증
   - `./mvnw -DskipTests compile` 성공 확인

## 오늘 작업 대상 파일
- `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/src/main/java/com/prosos/sosos/service/security/SqlInputGuardService.java`

## 완료 기준 (Definition of Done)
- 핵심 함수에 한글 주석이 보강되고, 전수 검사 결과 한글 깨짐이 없으며, 백엔드 컴파일이 성공하면 완료.
