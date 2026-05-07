# 2026-04-29 학습 메모 - 세일/찜 DB 점검과 마이그레이션

## 무엇
- 목표:
  - 세일(`original_price`)과 찜(`wishlist_items`) 기능이 DB 스키마 기준으로 안전한지 점검한다.
  - 운영(prod) 환경에서 필요한 수동 마이그레이션 SQL과 검증 절차를 문서화한다.

## 왜
- 기존 누락:
  - dev는 `ddl-auto=update`라 자동 반영되지만, prod는 `ddl-auto=validate`라 스키마 누락 시 기동 실패한다.
  - 세일 컬럼(`products.original_price`)은 신규 추가라 운영 DB 반영 절차가 필요하다.
  - 찜 테이블(`wishlist_items`)이 환경마다 누락될 수 있어 생성/인덱스/제약 조건 점검이 필요하다.

## 언제
- 새 엔티티/컬럼이 추가되었고 prod profile에서 `validate`를 사용하는 배포 전 단계에 적용한다.

## 어떻게
- 쉬운 용어 설명:
  - 마이그레이션: 코드 변경에 맞춰 DB 구조를 수정하는 작업
  - validate: 앱 시작 시 DB 구조와 엔티티가 일치하는지 검사하고, 다르면 실패시키는 모드
- 구현 순서:
  1. 세일/찜 관련 엔티티와 prod 설정(`validate`) 점검
  2. 운영 반영용 SQL(`original_price` + `wishlist_items`) 작성
  3. 실행 순서/검증 쿼리 문서 작성
  4. `prod + validate` 기동 점검으로 누락 여부 확인

## 오늘 작업 대상 파일 경로
- `sosos/docs/deployment/sql/2026-04-29-sale-wishlist.sql`
- `sosos/docs/deployment/db-migration-sale-wishlist.md`
- `sosos/docs/deployment/env-standard.md`
- `sosos/docs/daily/learning/README.md`
- `sosos/docs/daily/2026-04-29.md`

## 완료 기준(Definition of Done)
- 운영에서 실행 가능한 SQL과 검증 절차가 준비되고, prod validate 점검 기준이 문서화된다.
