# 배포 환경변수 표준안 (2026-04-27)

## 목적
- 로컬(dev)과 운영(prod)에서 같은 키 이름으로 실행되도록 기준을 고정한다.
- 배포 시 코드 수정 없이 환경변수만 바꿔서 동작하도록 한다.

## 공통 규칙
- 비밀값(`DB_PASSWORD`, `GEMINI_API_KEY`)은 `.env` 파일 커밋 금지
- 운영 환경에서는 서버/CI의 Secret Manager 또는 시스템 환경변수로 주입
- CORS 허용 도메인은 반드시 `APP_CORS_ALLOWED_ORIGINS`로 관리

## 필수 변수
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_URL` (prod에서는 필수, dev는 기본값 사용 가능)

## DB 마이그레이션 규칙
- `dev`는 `ddl-auto=update`, `prod`는 `ddl-auto=validate`를 사용한다.
- 따라서 운영 배포 전에는 엔티티 변경 사항을 SQL로 먼저 반영해야 한다.
- 세일/찜 관련 이번 반영 SQL:
  - `docs/deployment/sql/2026-04-29-sale-wishlist.sql`
- 실행/검증 가이드:
  - `docs/deployment/db-migration-sale-wishlist.md`

## 프로필/포트
- `SPRING_PROFILES_ACTIVE`
  - dev: `dev`
  - prod: `prod`
- `SERVER_PORT`
  - 기본값: `8085`

## CORS/도메인
- `APP_CORS_ALLOWED_ORIGINS`
  - 형식: 쉼표(`,`)로 구분한 Origin 목록
  - 예시(dev): `http://localhost:3000,http://127.0.0.1:3000`
  - 예시(prod): `https://style-of-simplicity.com,https://www.style-of-simplicity.com`

## 파일 저장(local/S3)
- `APP_STORAGE_TYPE`
  - `local` 또는 `s3`
- `APP_UPLOAD_BASE_DIR`
  - local 모드에서 파일 저장 루트
- `APP_STORAGE_S3_BUCKET`
  - `APP_STORAGE_TYPE=s3`일 때 필수
- `APP_STORAGE_S3_REGION`
  - 기본값 `ap-northeast-2`
- `APP_STORAGE_S3_PREFIX`
  - 기본값 `sosos`
- `APP_STORAGE_S3_PUBLIC_BASE_URL`
  - 필요 시 CDN/커스텀 도메인 URL
- `APP_STORAGE_S3_ENDPOINT`
  - MinIO/테스트 엔드포인트 사용 시만 설정
- `APP_STORAGE_S3_PATH_STYLE_ACCESS`
  - 기본값 `false`

## AI
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (기본값 `gemini-2.5-flash`)
- `GEMINI_BASE_URL` (기본값 `https://generativelanguage.googleapis.com/v1beta`)
- `AI_MAX_INPUT_LENGTH` (기본값 `180`)
- `AI_MAX_CANDIDATES` (기본값 `5`)

## TossPayments (테스트/운영 공통 키 이름)
- 백엔드(`sosos/.env` 또는 서버 환경변수)
  - `TOSS_ENABLED`
    - 테스트 결제 승인 API 활성화 여부 (`true`/`false`)
  - `TOSS_SECRET_KEY`
    - 토스 시크릿 키 (예: `test_gsk_docs_...`)
  - `TOSS_CONFIRM_URL`
    - 기본값 `https://api.tosspayments.com/v1/payments/confirm`
- 프론트(`frontend/.env.local` 또는 배포 환경변수)
  - `VITE_TOSS_CLIENT_KEY`
    - 토스 클라이언트 키 (예: `test_gck_docs_...`)

주의:
- `TOSS_SECRET_KEY`는 절대 프론트에 두면 안 된다.
- 테스트 키라도 서버 승인(confirm)은 백엔드에서 처리해야 한다.

## 실행 예시 (PowerShell)
```powershell
cd sosos
$env:SPRING_PROFILES_ACTIVE="dev"
$env:DB_USERNAME="your_db_user"
$env:DB_PASSWORD="your_db_password"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

## 실행 예시 (Docker, prod)
```bash
docker build -t sosos-backend:latest ./sosos
docker run --rm -p 8085:8085 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL=jdbc:mysql://<rds-endpoint>:3306/SOS_db \
  -e DB_USERNAME=<db-user> \
  -e DB_PASSWORD=<db-password> \
  -e APP_CORS_ALLOWED_ORIGINS=https://style-of-simplicity.com \
  -e APP_STORAGE_TYPE=s3 \
  -e APP_STORAGE_S3_BUCKET=<bucket-name> \
  sosos-backend:latest
```
