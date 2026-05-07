# SOS Frontend

## 목적
- React 기반으로 핵심 사용자 화면을 마이그레이션한다.
- 백엔드 `/api/v1/*` API와 연결해 조회 -> 장바구니 -> 주문 흐름을 구현한다.

## 실행
```bash
cd frontend
npm install
npm run dev
```

기본 접속 주소: `http://localhost:3000`

## 주요 경로
- `/` 메인 목록
- `/products/:productId` 상품 상세
- `/cart` 장바구니 (사용자 로그인 필요)
- `/support` 고객센터
- `/mypage` 마이페이지
- `/notifications` 알림
- `/auth` 로그인/회원가입
- `/admin/login` 관리자 로그인
- `/admin/dashboard` 관리자 대시보드 (관리자 로그인 필요)

## 환경변수
백엔드 URL을 직접 지정하려면 `.env`(또는 `.env.local`)에 아래를 추가한다.

```bash
VITE_API_BASE_URL=http://localhost:8085
```

개발 기본값은 Vite 프록시(`/api` -> `http://localhost:8085`)를 사용한다.

토스페이먼츠 테스트 결제를 쓰려면 프론트 환경변수에 아래를 추가한다.

```bash
VITE_TOSS_CLIENT_KEY=test_gck_docs_xxxxxxxxxxxxx
```

주의:
- `VITE_TOSS_CLIENT_KEY`는 테스트용 클라이언트 키만 넣는다.
- 시크릿 키(`test_gsk...`)는 절대 프론트에 두지 않고 백엔드 환경변수로만 관리한다.

## 검증 명령어
```bash
npm run lint
npm run build
```
