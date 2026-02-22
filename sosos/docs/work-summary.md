# P1 작업 요약 (2026-02-13 ~ 2026-02-22)

## 기간
- 시작: 2026-02-13
- 종료: 2026-02-22 14:37

## 수행한 작업
- 2026-02-13 ~ 2026-02-15: 백엔드 운영 기본선 정리
  - 비밀번호 해시(BCrypt) 적용
  - 환경변수 기반 설정으로 전환
  - `application-dev` / `application-prod` 분리
  - Actuator 외부 노출 최소화(`health`, `info`)
- 2026-02-16 ~ 2026-02-19: API 경계 정리
  - `/api/v1/products`, `/api/v1/orders`, `/api/v1/users` 추가
  - 공통 응답 포맷(`success`, `data`, `message`) 적용
  - 기존 Thymeleaf 엔드포인트 유지
- 2026-02-19 ~ 2026-02-22: 주문/재고 무결성 보강
  - 주문/재고 처리 트랜잭션 적용(`@Transactional`)
  - 재고 조회 비관적 락 적용(`findByIdForUpdate`)
  - `Order.quantity` 저장/조회 일관성 정리
  - 장바구니 결제 흐름 서비스 계층으로 정리

## 결과
- 1순위(P1) 3개 항목 완료
  - P1-1 완료: 2026-02-15
  - P1-2 완료: 2026-02-19
  - P1-3 완료: 2026-02-22
- 검증 결과
  - `mvnw clean compile` 성공
  - `mvnw test` 성공 (총 6개, 실패 0, 에러 0)
  - 핵심 API 스모크 검증 완료
