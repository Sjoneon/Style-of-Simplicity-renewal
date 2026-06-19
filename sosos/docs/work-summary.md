# SOS 리뉴얼 작업 요약

## 기준 시점
- 작성일: 2026-06-19
- 기준: 2026-05-11 1차 마감 이후 문서와 2026-06-16 판매자 대시보드 개선 기록
- 현재 집중 항목: S3 실제 업로드 검증, EC2 IAM Role 리허설, 판매자 대시보드 회귀 확인

## 완료한 작업

### 백엔드 운영 기본선
- 비밀번호 해시(BCrypt) 적용
- dev/prod 설정 분리
- 민감정보 환경변수 분리
- Actuator 노출 최소화
- 필수 환경변수 누락 시 실행 초기에 실패 처리

### API 경계와 데이터 응답
- 기존 Thymeleaf 흐름은 유지
- `/api/v1/*` JSON API 추가
- 공통 응답 형식(`success/data/message`) 적용
- 공개 상품 응답과 판매자 관리 응답 분리
- 검색어/카테고리 입력 SQL Injection 방어 가드 적용

### 주문/재고 흐름
- 주문 처리에 트랜잭션 적용
- 재고/주문 상태 저장 일관성 확인
- 주문 상태 변경, 취소/반품/교환 흐름 정리

### 프론트 전환
- React + Vite + MUI + Axios 구성
- 메인, 상품 상세, 장바구니, 인증, 마이페이지, 알림 화면 전환
- 판매자 대시보드 개선
  - 좌측 메뉴 구조
  - 매출 보기
  - 상품 카테고리/정렬/페이지
  - 문의 답변 상태 분리

### 이미지/파일 저장
- `FileStorageService` 기준으로 local/s3 저장 전략 분리
- 상품/배너/문의 이미지 업로드 경로 정리
- S3 실제 자격증명 검증용 `S3CredentialSmokeTest` 추가

### AI 스타일 추천
- Gemini API를 백엔드에서 호출
- 프론트엔드에 Gemini 키를 넣지 않음
- 로컬 상품 후보 선별 후 추천 설명을 보강하는 방식
- Gemini 호출 실패 시 로컬 fallback 응답 사용

### 배포/운영 문서
- `sosos/Dockerfile`
- `sosos/.dockerignore`
- `sosos/docs/deployment/env-standard.md`
- `sosos/docs/deployment/ec2-iam-role-rehearsal.md`
- Gemini 키 보관 정책 문서

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
- 한글 깨짐 점검
  - `powershell -ExecutionPolicy Bypass -File .\scripts\check-korean-garbled.ps1`

## 남은 작업
1. 실제 AWS 자격증명으로 S3 업로드/조회/삭제 성공 로그 확보
2. EC2 + IAM Role 환경에서 같은 스모크 테스트 실행
3. 운영 도메인 기준 CORS 값 최종 확인
4. 판매자 대시보드 최근 변경분 회귀 확인
5. 배포 후 기본 시나리오 점검표 최신화
