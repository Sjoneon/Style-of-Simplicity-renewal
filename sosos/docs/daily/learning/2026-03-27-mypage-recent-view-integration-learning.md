# 2026-03-27 마이페이지 최근 본 상품 실연동 학습

## 무엇
마이페이지 `3. 찜/최근 본` 섹션의 `최근 본 상품 연동 준비중`을 실제 API 데이터로 교체한다.

작업 대상 파일
- 백엔드
  - `sosos/src/main/java/com/prosos/sosos/model/RecentProductView.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/repository/RecentProductViewRepository.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/dto/RecentProductViewDto.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/service/RecentProductViewService.java` (신규)
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/UserApiController.java` (최근 본 조회/기록 API 추가)
- 프론트
  - `frontend/src/services/userApi.js` (최근 본 API 함수 추가)
  - `frontend/src/pages/ProductDetailPage.jsx` (상품 상세 진입 시 최근 본 기록 호출)
  - `frontend/src/pages/MyPagePage.jsx` (최근 본 목록 실데이터 렌더링)
- DB 스크립트
  - `sosos/db/migrations/2026-03-27-recent-product-view-schema.sql` (신규)

완료 기준(DoD)
- 사용자 계정으로 상품 상세를 보면 최근 본 기록이 서버 DB에 저장된다.
- 마이페이지에서 최근 본 상품 목록이 API 데이터로 표시된다.
- `준비중` 문구가 제거되고 최소 목록/빈 상태가 실제 데이터 기준으로 동작한다.
- 백엔드 컴파일, 프론트 린트/빌드가 통과한다.

의사결정 1줄
- 이번 1차 실연동은 `리뷰`가 아니라 `최근 본`을 먼저 구현한다. 이유: 기존 도메인(상품/사용자) 자산으로 빠르게 안정적인 서버 연동을 완성할 수 있기 때문이다.

## 왜
지금 마이페이지는 섹션 구조와 레이아웃은 준비됐지만 일부 항목이 `준비중` 상태다.
핵심 화면 마이그레이션 5번 항목을 실질 완료로 닫으려면 최소 1개 항목을 실제 데이터 기반으로 전환해야 한다.

`최근 본`은 리뷰보다 의존 관계가 단순하다.
- 리뷰: 보통 주문 검증, 평점 정책, 본문 관리까지 필요
- 최근 본: 사용자 + 상품 + 조회시각만으로 MVP 가능

## 언제
- 2026-03-27
- 알림 정식 모델/API 확정 직후, 핵심 화면 마이그레이션 마감 작업으로 진행

## 어떻게
1. `recent_product_views` 테이블 모델을 추가한다.
   - 사용자/상품 쌍은 unique로 유지하고, 다시 보면 `viewed_at`만 갱신한다.
2. 사용자 API에 최근 본 기록/조회 엔드포인트를 추가한다.
3. 상품 상세 페이지에서 사용자 로그인 상태일 때 조회 기록 API를 호출한다.
4. 마이페이지에서 최근 본 목록 API를 불러와 카드 목록으로 렌더링한다.
5. 컴파일/린트/빌드 및 간단 API 시나리오로 검증한다.
