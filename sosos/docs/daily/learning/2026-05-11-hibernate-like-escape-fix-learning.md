# Hibernate LIKE ESCAPE 기동 실패 복구

## 무엇
- `ProductRepository.searchByNameEscaped(...)`의 JPQL `escape` 문법을 Hibernate 6 규칙에 맞게 수정했다.

## 왜
- 운영 서버에서 앱 기동 시 아래 오류로 `ApplicationContext` 초기화가 실패했다.
- `Escape character literals must have exactly a single character`
- 결과적으로 `productRepository` 빈 생성 실패 -> `inquiryController` 의존성 실패 -> 서비스 재시작 루프 발생.

## 언제
- 2026-05-11 배포 후 `systemd` 상태가 `activating (auto-restart)`로 반복되고, `HTTP 000`이 지속될 때 적용했다.

## 어떻게
1. `journalctl` 로그에서 원인을 `ProductRepository.searchByNameEscaped`로 특정했다.
2. 쿼리의 escape literal을 `escape '\\\\'`(2글자 해석)에서 `escape '\\'`(1글자 해석)로 수정했다.
3. 로컬에서 `.\mvnw.cmd -DskipTests test-compile`과 `.\mvnw.cmd -DskipTests compile` 모두 성공 확인했다.

## 오늘 작업 파일
- `sosos/src/main/java/com/prosos/sosos/repository/ProductRepository.java`

## 완료 기준 (Definition of Done)
- Hibernate 쿼리 검증 오류 없이 test-compile/compile이 성공하고, EC2에서 `sosos-backend`가 정상 기동한다.
