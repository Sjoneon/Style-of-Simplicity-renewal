# 2026-03-19 찜(Wish List) 기능 구현 학습

## 무엇
사용자가 나중에 다시 보려고 상품을 저장하는 `찜` 기능을 추가한다.
이번 범위는 아래 3가지다.
- 상품상세에서 찜 추가/해제 토글
- 마이페이지 `3. 찜/최근 본`에서 내 찜 목록 조회
- 로그인 사용자 기준으로 찜 데이터 분리(계정별 관리)

작업 대상 파일
- `sosos/src/main/java/com/prosos/sosos/model/WishlistItem.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/repository/WishlistItemRepository.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/WishlistApiController.java` (신규)
- `frontend/src/services/wishlistApi.js` (신규)
- `frontend/src/pages/ProductDetailPage.jsx`
- `frontend/src/pages/MyPagePage.jsx`

완료 기준(DoD)
- 일반 사용자 로그인 상태에서 상품상세의 찜 버튼으로 추가/해제가 된다.
- 마이페이지에서 내 계정의 찜 목록만 보인다.
- 비로그인 또는 사용자 계정이 아닌 경우 401/권한 처리가 일관되게 동작한다.

의사결정 1줄
- 이번 찜 기능은 `localStorage` 임시 저장이 아니라 `DB 저장형`으로 구현한다. 이유: 계정별 분리와 재로그인 후 유지가 필요하기 때문이다.

## 왜
찜은 쇼핑몰에서 재방문 전환율에 직접 영향을 주는 기본 기능이다.
현재 마이페이지에는 `찜 목록 기능 연동 준비중`만 있고 실제 저장/조회가 불가능해서 사용자 흐름이 끊긴다.

특히 계정마다 찜 목록이 달라야 하므로, 브라우저 단독 저장보다 서버 저장이 맞다.
- 서버 저장: 로그인 계정 기준 분리, 세션 재접속 후에도 유지
- 브라우저 저장만 사용: 기기/브라우저가 바뀌면 데이터 소실

## 언제
- 마이페이지 섹션 구조와 계정관리 API 연동이 끝난 직후
- 알림 고도화 전 단계에서 사용자 개인화 데이터(관심상품)를 먼저 확보해야 하는 시점

## 어떻게
1. 백엔드에 `WishlistItem` 엔티티와 리포지토리를 추가한다.
   - `user_id + product_id` 유니크 제약으로 중복 찜 방지
2. `/api/v1/wishlist` API를 추가한다.
   - `GET /api/v1/wishlist`: 내 찜 목록
   - `GET /api/v1/wishlist/{productId}/status`: 특정 상품 찜 여부
   - `POST /api/v1/wishlist/{productId}`: 찜 추가
   - `DELETE /api/v1/wishlist/{productId}`: 찜 해제
3. 프론트 `wishlistApi`를 만들고 상품상세에 찜 버튼을 연결한다.
4. 마이페이지 `3. 찜/최근 본` 섹션에서 실 목록을 보여준다.
5. 프론트 린트/빌드, 백엔드 컴파일로 최소 검증한다.
