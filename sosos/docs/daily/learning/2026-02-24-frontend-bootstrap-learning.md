# 2026-02-24 프론트엔드 프로젝트 시작 학습 노트

## 무엇
- `frontend/` 폴더에 React + Vite 프로젝트를 만든다.
- UI 라이브러리로 MUI를 추가한다.
- HTTP 통신 라이브러리로 Axios를 추가한다.
- 백엔드 `/api/v1/products` API를 프론트에서 1회 호출해 목록을 화면에 보여준다.

## 왜
- 기존 서버 렌더링(Thymeleaf) 화면을 React 화면으로 옮기기 위한 첫 시작점이 필요하다.
- Vite는 개발 서버 시작이 빠르고 설정이 단순해서 초기 생산성이 높다.
- MUI를 쓰면 버튼/카드/레이아웃 같은 기본 UI를 빠르게 안정적으로 만들 수 있다.
- Axios를 쓰면 API 호출 코드(공통 base URL, 에러 처리)를 한곳에서 관리하기 쉽다.

## 언제
- 로드맵 `2순위-4) 프론트엔드 프로젝트 시작` 단계에서 진행한다.
- 완료 기준은 2가지다.
1. 프론트 로컬 실행 확인 (`npm run dev`)
2. 백엔드 API 1개 연동 확인 (`/api/v1/products` 호출 성공 또는 응답 구조 확인)

## 어떻게
1. Vite React 템플릿으로 `frontend/`를 생성한다.
2. `@mui/material`, `@emotion/react`, `@emotion/styled`, `axios`를 설치한다.
3. `src/services/api.js`에 Axios 인스턴스를 만든다.
4. `src/services/productApi.js`에 상품 목록 조회 함수를 만든다.
5. `src/App.jsx`에서 로딩/성공/실패 상태를 나눠서 목록 UI를 렌더링한다.
6. 개발 서버 포트를 백엔드 CORS와 맞추고, 필요하면 백엔드 CORS 허용 Origin을 추가한다.
7. 실행/연동 확인 후 로드맵 문서의 상태를 업데이트한다.

## 쉬운 용어 설명
- React: 화면을 컴포넌트 단위로 쪼개서 만드는 프론트엔드 라이브러리.
- Vite: 프론트 개발 서버를 빠르게 띄워주는 도구.
- MUI: 버튼, 카드, 레이아웃 같은 UI 부품을 제공하는 라이브러리.
- Axios: 백엔드 API를 호출할 때 쓰는 HTTP 통신 도구.
- CORS: 브라우저가 다른 포트/도메인 서버에 요청할 때 필요한 허용 규칙.
- 프록시: 프론트 서버가 요청을 대신 백엔드 서버로 전달해 주는 중간 연결.

## 오늘 작업 대상 파일(예정)
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/ProductList.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/productApi.js`
- `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java`
