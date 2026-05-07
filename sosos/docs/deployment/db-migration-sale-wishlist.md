# 세일/찜 DB 마이그레이션 가이드 (2026-04-29)

## 목적
- 세일 기능(`products.original_price`)과 찜 기능(`wishlist_items`)의 DB 스키마를 운영 기준으로 맞춘다.
- `prod` 프로필(`spring.jpa.hibernate.ddl-auto=validate`)에서 기동 실패를 예방한다.

## 배경
- dev: `ddl-auto=update`라 로컬에서 컬럼/테이블이 자동 반영될 수 있다.
- prod: `ddl-auto=validate`라 DB 구조가 코드와 다르면 서버 시작이 실패한다.

## 대상 SQL
- 파일: `docs/deployment/sql/2026-04-29-sale-wishlist.sql`
- 포함 항목:
  - `products.original_price` 컬럼 추가(없을 때만)
  - `wishlist_items` 테이블 생성
  - `wishlist_items` 인덱스 보강

## 실행 절차
1. 운영 DB 백업
2. 스테이징 DB에 SQL 선적용
3. 스테이징에서 백엔드 `prod` 프로필 기동 검증
4. 운영 DB에 SQL 적용
5. 운영 백엔드 재기동 및 헬스체크

## 검증 포인트
1. 컬럼 확인
```sql
SHOW COLUMNS FROM products LIKE 'original_price';
```

2. 테이블/제약/인덱스 확인
```sql
SHOW CREATE TABLE wishlist_items;
SHOW INDEX FROM wishlist_items;
```

3. 애플리케이션 검증
- `prod` 프로필에서 서버가 정상 기동되는지 확인
- 홈 리스트에서 할인율/정상가 노출 확인
- 로그인 사용자 기준 찜 추가/해제 동작 확인

## 롤백 가이드 (필요 시)
- 기능 롤백이 필요할 때는 백엔드 코드를 이전 버전으로 되돌린 뒤 DB 롤백 수행
- DB 롤백은 운영 영향이 크므로 백업 복원 또는 변경 이력 기반 수동 롤백으로 처리
