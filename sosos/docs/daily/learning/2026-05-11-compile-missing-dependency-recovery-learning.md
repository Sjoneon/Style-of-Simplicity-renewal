# 컴파일 실패(누락 의존코드) 복구 학습

## 무엇
- `InquiryController`에서 참조하는 Turnstile 관련 의존코드가 일부 누락되어 컴파일이 실패한 상태를 복구한다.
- 누락된 항목:
  - `TurnstileVerificationService` 클래스
  - `InquiryCreateRequest.turnstileToken` 필드/접근자
  - `ProductRepository.searchByNameEscaped(...)` 메서드

## 왜
- 현재 `mvnw -DskipTests compile`가 실패하면 EC2 `systemd` 재기동 루프가 발생하고 서비스가 내려간다.
- 특히 운영 서버에서 `cannot find symbol`이 반복되면 배포 자체가 불가능해진다.

## 언제
- 부분 커밋/부분 머지 이후, 호출 코드만 들어가고 의존 파일이 빠진 직후에 진행한다.

## 어떻게
1. 누락 심볼을 기준으로 복구 범위를 먼저 확정한다.
2. 누락된 Java 파일/필드/리포지토리 메서드를 복구한다.
3. `.\mvnw.cmd -DskipTests compile`로 컴파일 성공 여부를 확인한다.
4. 필요 시 일일 로그와 학습 인덱스에 복구 내역을 기록한다.

## 오늘 작업 대상 파일
- `sosos/src/main/java/com/prosos/sosos/service/security/TurnstileVerificationService.java`
- `sosos/src/main/java/com/prosos/sosos/dto/InquiryCreateRequest.java`
- `sosos/src/main/java/com/prosos/sosos/repository/ProductRepository.java`
- `sosos/src/main/resources/application-dev.properties`
- `sosos/src/main/resources/application-prod.properties`
- `sosos/.env.example`

## 완료 기준 (Definition of Done)
- 누락 심볼 6건이 모두 해소되고 `.\mvnw.cmd -DskipTests compile`가 성공한다.
