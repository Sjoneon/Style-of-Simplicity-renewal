# SOS Renewal (Style of Simplicity Renewal)

Spring Boot + Thymeleaf 기반 쇼핑몰을 React SPA + Spring Boot REST API 구조로 전환한 리뉴얼 프로젝트입니다.  
AWS 배포와 운영 과정에서 다룬 EC2, RDS, S3, CloudFront, WAF 기록도 함께 정리했습니다.

## 프로젝트 한눈에 보기

| 항목 | 내용 |
|---|---|
| 프로젝트명 | SOS Renewal |
| 유형 | 1인 개발 쇼핑몰 리뉴얼 |
| 목적 | 기존 SSR 쇼핑몰을 SPA + REST API 구조로 분리하고 운영 경험까지 정리 |
| 백엔드 | Java 21, Spring Boot 3.3.5, Spring Data JPA, MySQL 8 |
| 프론트엔드 | React 19, Vite 7, MUI 7, Axios |
| 인프라 | AWS EC2, RDS, S3, CloudFront, WAF |
| 외부 연동 | Gemini API, TossPayments 테스트 결제, Cloudflare Turnstile |
| 현재 범위 | 사용자/판매자 핵심 흐름, 이미지 저장 전략, 배포/운영 문서화 |

## 왜 리뉴얼했는가

기존 프로젝트는 Spring Boot와 Thymeleaf 중심의 서버 렌더링 구조였습니다. 기본 쇼핑몰 기능은 구현되어 있었지만, 상품 검색/정렬, 장바구니, 마이페이지, 판매자 대시보드처럼 화면 상태가 자주 바뀌는 영역을 확장하기에는 불편했습니다.

이번 리뉴얼에서는 프론트엔드가 화면 상태와 라우팅을 맡고, 백엔드는 세션 인증과 도메인 규칙, 데이터 검증, 외부 연동을 맡도록 나눴습니다. 배포 이후에 필요한 환경변수, 파일 저장, CORS, WAF, 캐시 문제도 프로젝트 범위에 포함했습니다.

## Before / After

| 구분 | 기존 구조 | 리뉴얼 구조 |
|---|---|---|
| 화면 | Thymeleaf 서버 렌더링 | React SPA |
| 백엔드 | 화면 렌더링과 도메인 처리 혼합 | `/api/v1/*` REST API 중심 |
| 상태 처리 | 페이지 단위 이동 중심 | 컴포넌트 단위 갱신 |
| 파일 저장 | 로컬 저장 중심 | local / S3 전략 분리 |
| 배포 | 로컬 실행 중심 | EC2, RDS, S3, CloudFront 기준 정리 |

## 아키텍처

```text
Browser
  |
CloudFront + WAF
  |------------------ /api/* ------------------|
  v                                            v
S3 Static Frontend                    EC2 Spring Boot API
                                             |
                                             +-- RDS MySQL
                                             +-- S3 upload storage
                                             +-- Gemini API
                                             +-- TossPayments test API
                                             +-- Cloudflare Turnstile
```

## 기술 스택

- Backend: Java 21, Spring Boot 3.3.5, Spring Data JPA, MySQL Connector, Spring Security Crypto, AWS S3 SDK
- Frontend: React 19, React Router DOM 7, Vite 7, MUI 7, Axios, ESLint
- Infra: AWS EC2, RDS, S3, CloudFront, WAF, IAM Role
- External: Gemini API, TossPayments 테스트 결제, Cloudflare Turnstile, 카카오 우편번호 서비스

## 핵심 기능

### 사용자
- 상품 목록/상세 조회, 검색, 카테고리 필터, 정렬
- 장바구니, 바로 구매, 주문 조회, TossPayments 테스트 결제 흐름
- 로그인/회원가입, 마이페이지 주소/비밀번호/프로필 관리
- 최근 본 상품, 찜 목록, 알림 조회/읽음 처리
- 고객센터 문의 등록/조회, 문의 이미지 업로드
- AI 스타일 추천 기능

### 판매자
- 판매자 로그인과 전용 대시보드
- 상단 탭 기반 판매자 UI를 좌측 드롭다운 사이드 메뉴로 개편
- 상품 등록/수정/삭제, 이미지 업로드, 사이즈 옵션 관리
- 홈 메인 배너와 탐색 탭 관리
- 주문 상태 처리, 취소/반품/교환 관리
- 문의 답변 등록/수정/삭제
- 기간별 매출 요약과 상품 관리 필터/정렬

### 운영/보안
- dev/prod 설정 분리와 환경변수 기반 실행
- `local` / `s3` 파일 저장 전략 분리
- 공개 상품 API와 판매자 관리 API 응답 범위 분리
- 검색어/카테고리 입력에 대한 SQL Injection 방어 가드
- Turnstile 서버 검증
- CloudFront/WAF 운영 이슈와 복구 기준 문서화

## 구현 메모

- API 응답은 `success`, `data`, `message` 형식으로 맞췄습니다.
- 인증은 JWT 대신 서버 세션을 유지했습니다. 기존 도메인 구조와 사용자/판매자 권한 분리에 맞는 방식이라 판단했습니다.
- 상품 공개 응답은 `PublicProductDto`를 사용해 내부 재고 수량, 판매자 식별자, 운영용 키워드가 그대로 노출되지 않도록 분리했습니다.
- AI 스타일 추천은 프론트에서 Gemini를 직접 호출하지 않습니다. 백엔드가 상품 후보를 먼저 고르고, Gemini는 추천 설명을 보강하는 역할로 연결했습니다.
- Gemini 키는 `GEMINI_API_KEY` 환경변수로만 주입하고, 프론트엔드 코드에는 넣지 않습니다.

## 현재 상태와 제한사항

- 2026-05-11 기준 1차 마감 후, 2026-06-16에 판매자 대시보드 좌측 메뉴 UI, 매출, 상품 관리 개선을 추가했습니다.
- 결제는 TossPayments 테스트 승인 흐름 기준입니다.
- 배송은 택배사 송장 연동 없이 판매자 상태 변경 중심입니다.
- 판매자 회원가입/승인, 이메일 인증, CI/CD 자동화, 운영 알림은 후속 개선 항목입니다.
- AI 스타일 추천은 실제 상품 데이터와 연결되어 있으나, 추천 품질은 상품 키워드와 데이터 정리에 영향을 받습니다.

## 저장소 구조

```text
.
├─ frontend/                  # React 앱
├─ sosos/                     # Spring Boot 앱
│  ├─ src/
│  ├─ docs/
│  ├─ Dockerfile
│  └─ pom.xml
├─ scripts/                   # 점검/보조 스크립트
└─ README.md
```

## 회고

이번 리뉴얼에서 가장 오래 걸린 부분은 화면을 React로 옮기는 일보다, 프론트/백엔드/운영 경계를 정하는 일이었습니다. 공개 API와 관리 API를 나누고, 업로드 파일 저장 위치를 환경별로 바꾸고, 배포 후 WAF나 CloudFront 문제를 확인하면서 쇼핑몰 프로젝트가 단순 CRUD보다 넓은 범위를 가진다는 점을 정리할 수 있었습니다.

## 라이선스

별도 LICENSE 파일 정책을 따릅니다. 파일이 없으면 추후 명시 예정입니다.
