# 2026-03-03 핵심 화면 마이그레이션 학습 노트

## 무엇
- React 프론트에 핵심 5개 화면을 만든다.
- 대상 화면: 메인 목록, 상품 상세, 장바구니, 로그인/회원가입, 판매자 대시보드.
- 화면 간 이동을 위해 라우팅을 추가한다.
- 백엔드 `/api/v1/*` API와 직접 연결해 실제 사용자 흐름을 완성한다.

## 왜
- 로드맵 5번 완료 기준이 `조회 -> 장바구니 -> 주문` 동작이기 때문이다.
- 현재 프론트는 상품 목록 1개 화면만 있어 실제 구매 흐름 검증이 불가능하다.
- API 경계를 `/api/v1/*`로 유지하면 이후 배포/테스트 단계에서 관리가 쉬워진다.

## 언제
- 로드맵 2순위 `5) 핵심 화면 마이그레이션` 단계에서 지금 바로 수행한다.
- 오늘 완료 기준(Definition of Done): 로그인 사용자 기준으로
  - 상품 조회
  - 장바구니 담기
  - 장바구니 주문
  - 주문 결과 확인
  이 한 흐름이 React 화면에서 실제 API 호출로 동작한다.

## 어떻게
1. 인증/세션 기반 API 호출 구조를 먼저 만든다.
- Axios 공통 설정에 쿠키 전송(`withCredentials`)을 켠다.
- `AuthContext`로 현재 로그인 사용자 상태를 공통 관리한다.

2. 화면 라우팅을 추가한다.
- `/` 메인 목록
- `/products/:id` 상품 상세
- `/cart` 장바구니
- `/auth` 로그인/회원가입
- `/seller/dashboard` 판매자 대시보드

3. API 모듈을 화면별로 분리한다.
- `productApi`: 목록/상세/장바구니 담기/장바구니 조회/삭제
- `userApi`: 로그인/회원가입/내 세션 조회/로그아웃
- `orderApi`: 장바구니 주문/내 주문 조회/판매자 주문 조회/주문 상태 변경

4. 백엔드 API를 최소 보강한다.
- `/api/v1/orders/cart/purchase`를 추가해 장바구니 주문을 `/api/v1/*` 경계 안에서 처리한다.

5. 검증 후 문서를 업데이트한다.
- 프론트 `lint`, `build`
- 백엔드 `test`
- 데일리 로그와 로드맵 상태 반영

## 쉬운 용어 설명
- 라우팅: URL 주소에 따라 다른 화면을 보여주는 규칙.
- 컨텍스트(Context): 여러 컴포넌트가 같이 쓰는 전역 상태 저장소.
- 세션(Session): 서버가 로그인 상태를 기억하는 방식.
- `withCredentials`: 브라우저가 세션 쿠키를 API 요청에 같이 보내도록 하는 옵션.

## 오늘 작업 대상 파일(예정)
- `frontend/package.json`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/productApi.js`
- `frontend/src/services/userApi.js` (신규)
- `frontend/src/services/orderApi.js` (신규)
- `frontend/src/contexts/AuthContext.jsx` (신규)
- `frontend/src/components/*` (레이아웃/공통 UI)
- `frontend/src/pages/*` (핵심 5화면)
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java`
