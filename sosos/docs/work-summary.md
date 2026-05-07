# SOS 리뉴얼 작업 요약 (현재 상태 기준)

## 기준 시점
- 작성일: 2026-04-27
- 로드맵 상태: P1 완료, P2 마감 정리 중, P3 배포 준비 착수
- 현재 집중 항목: S3 실자격증명 검증 완료 + EC2 IAM Role 리허설 완료

## 완료된 핵심 축
### P1 (완료)
- 운영 기본선 정리
  - 비밀번호 해시(BCrypt)
  - dev/prod 설정 분리
  - 민감정보 환경변수 분리
  - Actuator 노출 최소화
- API 경계 정리
  - `/api/v1/*` JSON API 정리
  - 공통 응답 형식(`success/data/message`) 적용
- 주문/재고 무결성 보강
  - 트랜잭션 적용
  - 동시성 제어
  - 주문/재고 데이터 일관성 검증

### P2 (진행 중)
- 프론트 전환
  - React + Vite + MUI + Axios 구성 완료
  - 핵심 화면(메인, 상세, 장바구니, 인증, 판매자 대시보드) 전환 완료
  - 고객센터(`/support`), 마이페이지(`/mypage`), 알림(`/notifications`) MVP 완료
- 이미지/파일 저장 전략
  - `local`/`s3` 분기 구현 완료
  - `FileStorageService` 추상화 완료
  - 로컬 S3 코드 경로 스모크 확인 완료
  - 실제 자격증명 성공 검증은 진행 중

## 오늘(2026-04-27) 반영 사항
1. 백엔드 실행 안정화
- `SososApplication`에서 필수 환경변수 누락 시 Fail Fast 적용
  - `DB_USERNAME`, `DB_PASSWORD` 필수
  - `prod + s3`일 때 `APP_STORAGE_S3_BUCKET` 필수
- 사용자 피드백 반영
  - `.env 자동 주입 코드`는 적용하지 않음

2. CORS/도메인 정책 외부화
- `WebConfig` 하드코딩 Origin 제거
- `APP_CORS_ALLOWED_ORIGINS` 기반 로드 방식으로 전환
- dev/prod 프로필별 기본값 정리

3. 배포 준비 파일 추가
- `sosos/Dockerfile`
- `sosos/.dockerignore`
- `sosos/docs/deployment/env-standard.md`
- `sosos/docs/deployment/ec2-iam-role-rehearsal.md`
- `sosos/.env.example` 최신 키 기준 업데이트

4. S3 실검증 경로 추가
- `S3CredentialSmokeTest` 신규 추가
  - 실제 자격증명 기반 업로드/조회/삭제 검증
  - `RUN_S3_SMOKE_TEST=true`일 때만 실행

## 현재 주요 경로
- 프론트(소비자): `http://localhost:3000/`
- 프론트(판매자 로그인): `http://localhost:3000/admin/login`
- 백엔드(Thymeleaf/레거시): `http://localhost:8085/`
- 백엔드 API: `http://localhost:8085/api/v1/*`

## 검증 명령
- 백엔드 컴파일
  - `cd sosos && .\mvnw.cmd -DskipTests compile`
- 프론트 린트/빌드
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
- S3 스모크 테스트
  - `cd sosos && .\mvnw.cmd -Dtest=S3CredentialSmokeTest test`
  - 실실행 시 환경변수:
    - `RUN_S3_SMOKE_TEST=true`
    - `APP_STORAGE_S3_BUCKET=<실버킷>`

## 남은 우선 작업
1. 실제 자격증명으로 S3 스모크 테스트 성공 로그 확보
2. EC2 + IAM Role 리허설 실행 및 성공 로그 확보
3. 운영 도메인 기준 CORS 값(`APP_CORS_ALLOWED_ORIGINS`) 최종 고정
4. 배포 런북 기준으로 Docker 실행 리허설 1회 완료
