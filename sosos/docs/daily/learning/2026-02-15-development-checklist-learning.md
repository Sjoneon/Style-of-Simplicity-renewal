# 학습 설명 (구현 전) - 2026-02-15

## 무엇
- 백엔드 운영 기본선(P1) 항목을 실제 코드/설정/DB에 반영한다.
- 반영 범위: 비밀번호 해시, 환경변수 분리, `dev/prod` 설정 분리, Actuator 노출 최소화, `SOS_db` 스키마 정합성.

## 왜
- 운영 배포 전 보안/설정/DB 타입 불일치를 선제 차단해야 장애를 줄일 수 있다.
- `prod`의 `ddl-auto=validate`에서 실패하는 타입 불일치(INT/BIGINT, DECIMAL/DOUBLE)를 미리 해결해야 한다.

## 언제
- 구현 시작 전에 먼저 작성하고, 피드백 반영 시에도 갱신한다.
- `prod` 기동 검증 전에 DB 스키마 정합성 점검을 완료한다.

## 어떻게
- 비밀번호: `PasswordEncoder(BCrypt)` 적용, 로그인 시 `matches` 사용, 평문 레거시는 로그인 시 해시로 승격 저장.
- 설정: `application-dev.properties` / `application-prod.properties` 분리 + 민감값 환경변수화.
- Actuator: `health`, `info`만 노출하고 `env`는 비노출.
- DB: `SOS_db` 기준으로 컬럼 타입을 엔티티 타입과 일치시킴 (`Long` -> `BIGINT`, `double` -> `DOUBLE`).

## 쉬운 용어 설명
- `ddl-auto=validate`: 앱 시작 시 "코드 모델과 DB 구조가 같은지" 검사만 하는 모드.
- 스키마 정합성: 테이블/컬럼 타입이 코드와 정확히 맞는 상태.
- 환경변수: 코드 파일에 비밀번호를 쓰지 않고 실행 시 외부에서 주입하는 값.

## 대상 파일
- `sosos/src/main/resources/application.properties`
- `sosos/src/main/resources/application-dev.properties`
- `sosos/src/main/resources/application-prod.properties`
- `sosos/src/main/java/com/prosos/sosos/config/PasswordConfig.java`
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/src/main/java/com/prosos/sosos/model/*.java`
- `sosos/db/seed/mydb.sql`
- `sosos/db/backup/mydb_en.sql`

## 완료 기준(DoD)
- 해시/설정분리/Actuator 최소노출/`prod` 기동 검증까지 완료.
