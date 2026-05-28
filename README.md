# SOS Renewal (Style of Simplicity Renewal)

> 기존 **Spring Boot + Thymeleaf 기반 쇼핑몰**을 **React SPA + Spring Boot REST API** 구조로 재설계하고,  
> **AWS 운영 환경(EC2 / RDS / S3 / CloudFront / WAF)** 까지 연결해 본 리뉴얼 프로젝트입니다.

![Java 21](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot 3.3.5](https://img.shields.io/badge/Spring_Boot_3.3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite 7](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MySQL 8](https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![WAF](https://img.shields.io/badge/AWS_WAF-8C4FFF?style=for-the-badge&logo=amazonaws&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TossPayments](https://img.shields.io/badge/TossPayments-Test-0064FF?style=for-the-badge&logoColor=white)

## 프로젝트 한눈에 보기

| 항목 | 내용 |
|---|---|
| 프로젝트명 | SOS Renewal |
| 유형 | 1인 개발 리뉴얼 프로젝트 |
| 성격 | 포트폴리오용 쇼핑몰 리뉴얼 + 운영 구조 확장 |
| 핵심 전환 | Spring Boot + Thymeleaf SSR → React SPA + REST API |
| 백엔드 | Java 21, Spring Boot 3.3.5, Spring Data JPA |
| 프론트엔드 | React 19, Vite 7, MUI 7, Axios |
| 데이터베이스 | MySQL 8 |
| 인프라 | AWS EC2, RDS, S3, CloudFront, WAF |
| 외부 연동 | Gemini AI, TossPayments, Cloudflare Turnstile |
| 현재 범위 | 사용자/판매자 핵심 흐름 + AWS 운영 경험 정리 |
| 비고 | 결제는 TossPayments 테스트 승인 구조, 배송은 택배사 연동 없이 판매자 상태 변경 중심 |

---

## 1. 프로젝트 소개

SOS Renewal은 기존 **SOS 쇼핑몰 프로젝트**를 단순한 화면 개편이 아니라 **아키텍처 전환 관점**에서 다시 만든 프로젝트입니다.

기존 프로젝트는 Spring Boot + Thymeleaf 기반의 서버 렌더링 구조였고, 기본적인 쇼핑몰 기능은 동작했지만 다음과 같은 한계가 있었습니다.

- 사용자 인터랙션이 많은 화면에서 상태 관리와 화면 확장이 불편함
- 사용자 흐름과 판매자 흐름이 같은 서버 렌더링 구조 안에서 강하게 결합됨
- 프론트엔드와 백엔드의 책임이 명확하게 나뉘지 않음
- 파일 저장, 배포, 보안, 운영 장애 대응 같은 실제 운영 관점의 경험이 부족함

이 리뉴얼에서는 React가 **UI/라우팅/상태 표현**을 담당하고, Spring Boot는 **도메인 규칙/세션 인증/데이터 처리/API 제공**을 담당하도록 분리했습니다.  
여기에 AWS 인프라를 붙여 **정적 프론트 배포, 이미지 저장, API 운영, WAF 보안 규칙, CloudFront 캐시/배포 이슈**까지 직접 다뤄 본 것이 이 프로젝트의 핵심입니다.

---

## 2. 왜 리뉴얼했는가

### 기존 구조의 한계

기존 SOS는 SSR 구조 특성상 페이지 단위 전환에는 강했지만, 다음과 같은 화면에서 점점 불편함이 커졌습니다.

- 상품 검색/정렬/탭 전환처럼 **상태 변화가 잦은 목록 화면**
- 장바구니, 마이페이지, 알림처럼 **비동기 데이터 갱신이 자주 발생하는 화면**
- 판매자 대시보드처럼 **관리 UI와 데이터 조작이 많은 화면**
- AI 스타일 추천처럼 **대화형 응답과 결과 갱신이 반복되는 기능**

### 리뉴얼 목표

이 프로젝트의 리뉴얼 목표는 다음과 같았습니다.

- UI를 SPA 구조로 전환해 사용자 경험과 화면 확장성을 높이기
- 백엔드를 REST API 중심으로 재정리해 프론트엔드와 책임 분리하기
- 사용자/판매자/운영자 관점의 흐름을 분리해서 구조를 명확히 하기
- 이미지 저장, 배포, 보안 규칙, 장애 복구까지 운영 경험을 프로젝트에 포함하기

### Before / After

| 구분 | 기존 SOS | SOS Renewal |
|---|---|---|
| 프론트 구조 | Thymeleaf 기반 SSR | React SPA |
| 백엔드 역할 | 화면 렌더링 + 비즈니스 로직 혼합 | REST API + 도메인 처리 중심 |
| 화면 상태 처리 | 페이지 단위 렌더링 중심 | 컴포넌트 단위 상태 갱신 |
| 판매자 관리 | 서버 렌더링 중심 | React 대시보드 기반 관리 화면 |
| 파일 저장 | 로컬 중심 | local / S3 전략 분리 |
| 운영 관점 | 구현 위주 | EC2 / RDS / S3 / CloudFront / WAF 운영 경험 포함 |

---

## 3. 시스템 아키텍처

```text
[사용자 브라우저]
        |
        v
[CloudFront + AWS WAF]
   |                \
   |                 \__ /api/* 요청
   v
[S3 정적 프론트]         [EC2 - Spring Boot REST API]
                               |
                               +-- [RDS - MySQL 8]
                               |
                               +-- [S3 - 상품/배너/문의 이미지]
                               |
                               +-- [Gemini API - AI 스타일 추천 설명]
                               |
                               +-- [TossPayments - 결제 승인]
                               |
                               +-- [Cloudflare Turnstile - 문의 봇 방지]
```

### 아키텍처 설명

- **React SPA**는 정적 빌드 결과물을 S3에 배포하고 CloudFront를 통해 제공했습니다.
- **Spring Boot API**는 EC2에서 동작하며 세션 인증, 주문 처리, 상품 관리, 문의 처리 등을 담당합니다.
- **MySQL 8 (RDS)** 는 사용자, 상품, 주문, 문의, 배너, 알림 등의 도메인 데이터를 분리 저장합니다.
- **S3** 는 상품 이미지, 상세 설명 이미지, 문의 이미지 등 업로드 자산 저장소로 사용합니다.
- **CloudFront + WAF** 는 정적 리소스 제공과 운영 보안 계층을 담당합니다.
- **Gemini API** 는 AI 스타일 추천 응답 설명을 보강하는 데 사용합니다.
- **TossPayments** 는 테스트 환경 기준 결제 승인 흐름을 검증하는 용도로 사용했습니다.
- **Turnstile** 은 문의 등록 시 서버 측 봇 검증에 사용했습니다.

---

## 4. 기술 스택

### 4-1. Frontend

- **React 19.2.0**
- **React Router DOM 7.13.1**
- **Vite 7.3.1**
- **MUI 7.3.8**
- **Axios 1.13.6**
- **ESLint**

### 선택 이유

- SSR에서 불편했던 상태 기반 UI를 클라이언트 중심으로 다루기 위해 React를 사용했습니다.
- 상품 목록, 검색, 정렬, 탭, 알림, 마이페이지, 판매자 대시보드처럼 **비동기 상호작용이 많은 화면**에 SPA 구조가 적합하다고 판단했습니다.
- Axios + 공통 응답 형식을 통해 백엔드와의 통신 규칙을 일관되게 유지했습니다.

### 4-2. Backend

- **Java 21**
- **Spring Boot 3.3.5**
- **Spring Data JPA**
- **MySQL Connector**
- **Spring Boot Actuator**
- **Spring Security Crypto (BCrypt)**
- **Jackson**
- **AWS S3 SDK**

### 선택 이유

- 기존 SOS가 Spring Boot 기반이었기 때문에, 도메인 구조를 유지하면서도 **API 중심으로 역할을 재정의**하기 좋았습니다.
- JPA를 통해 주문, 상품, 문의, 배너, 알림 등 관계형 도메인을 빠르게 정리했습니다.
- BCrypt 해시, 입력 검증, Turnstile 검증 등으로 보안 기초를 강화했습니다.

### 4-3. Infra / Ops

- **AWS EC2**
- **AWS RDS**
- **AWS S3**
- **AWS CloudFront**
- **AWS WAF**
- **IAM Role / 환경 변수 기반 설정**
- **systemd 기반 백엔드 기동 관리**

### 4-4. External Services

- **Google Gemini 2.5 Flash**
- **TossPayments 테스트 결제**
- **Cloudflare Turnstile**
- **카카오 우편번호 서비스**

---

## 5. 핵심 기능

### 5-1. 사용자 관점 기능

- 회원가입 / 로그인 / 로그아웃
- 이메일 사용자 로그인과 세션 기반 인증 유지
- 상품 목록 조회
- 상품 검색 / 카테고리 조회 / 정렬
- 상품 상세 조회
- 사이즈 옵션 선택 및 품절 상태 표시
- 찜(위시리스트) 추가 / 제거 / 상태 조회
- 최근 본 상품 기록 및 조회
- 장바구니 추가 / 수량 변경 / 삭제
- 바로 구매 / 장바구니 전체 구매
- TossPayments 테스트 결제 승인 흐름
- 주문 조회
- 마이페이지 프로필 / 주소 / 비밀번호 변경
- 내가 작성한 문의 / 리뷰 / 최근 본 상품 / 찜 목록 조회
- 알림 조회 / 읽음 처리 / 전체 읽음 처리
- AI 스타일 추천 대화형 기능
- 고객센터 문의 등록
- 문의 이미지 업로드 및 서버 검증

### 5-2. 판매자 관점 기능

- 사업자번호 기반 판매자 로그인
- 판매자 전용 대시보드 진입
- 운영 요약 화면
- 홈 메인 배너 관리
- Discovery 탭 관리
- 상품 등록 / 수정 / 삭제
- 상품 대표 이미지 / 상세 설명 이미지 업로드
- 상품 키워드 / 사이즈 옵션 / 노출 탭 설정
- 판매자 주문 목록 조회
- 주문 상태 처리
- 주문 취소 / 반품 / 교환 처리
- 문의 답변 등록 / 수정 / 삭제

### 5-3. 운영 / 보안 관점 기능

- `local` / `s3` 저장 전략 분리
- 환경 변수 기반 dev / prod 설정 분리
- 공개 상품 API와 판매자 관리 API 분리
- 공개 응답에서 내부 재고/판매자 식별자 노출 최소화
- 검색어 / 카테고리 입력에 대한 SQL Injection 방어 가드
- Turnstile 기반 문의 봇 방지
- CloudFront / WAF 운영 및 정책 조정 경험
- Actuator health 기반 기동 확인
- 필수 환경 변수 누락 시 애플리케이션 fail-fast 처리

---

## 6. 프론트엔드 / 백엔드 역할 분리

| 구분 | 역할 | 실제 구현 포인트 |
|---|---|---|
| React SPA | 라우팅, 화면 상태, 사용자 상호작용, API 호출 | 상품 목록/상세, 장바구니, 마이페이지, 알림, 판매자 대시보드 |
| Spring Boot REST API | 세션 인증, 도메인 규칙, 데이터 검증, 외부 연동 | 상품/주문/문의/알림/API 응답 처리 |
| AWS 인프라 | 정적 리소스 배포, 이미지 저장, 운영 보안 계층 | S3, CloudFront, WAF, EC2, RDS |

### 역할 분리의 핵심

- 프론트엔드는 **화면 상태와 UX**
- 백엔드는 **비즈니스 로직과 데이터 무결성**
- 인프라는 **배포/저장/보안/운영 복구**

이 세 레이어를 분리하면서, 단순한 CRUD 구현이 아니라 **왜 이 책임을 나눴는가**를 프로젝트 안에서 설명할 수 있게 되었습니다.

---

## 7. 설계 원칙 및 아키텍처 설명

### 7-1. API First 전환

이 리뉴얼의 핵심은 화면을 다시 그리는 것이 아니라 **백엔드를 API 서버로 재정의**한 것입니다.

프론트엔드와 백엔드 간 통신은 공통 응답 형식을 사용합니다.

```json
{
  "success": true,
  "data": {},
  "message": "처리 성공"
}
```

이 형식 덕분에 프론트엔드에서는 성공/실패 처리 패턴을 일관되게 가져갈 수 있고, 예외 메시지도 API 레벨에서 통일할 수 있었습니다.

### 7-2. 세션 기반 인증 유지

이 프로젝트는 JWT가 아니라 **서버 세션 기반 인증**을 사용합니다.

- 프론트엔드는 `withCredentials: true` 로 세션 쿠키를 포함해 요청합니다.
- 백엔드는 세션의 `loggedInUser`, `userType` 값을 기준으로 권한을 분기합니다.
- `/api/v1/users/me` 를 통해 현재 로그인 사용자 세션을 복원합니다.

이 방식은 현재 구조에서 사용자/판매자 권한을 빠르게 분리하고, 프론트엔드와 백엔드의 인증 책임을 단순하게 맞추는 데 적합했습니다.

### 7-3. 공개용 DTO와 관리용 DTO 분리

상품 API는 소비자에게 보여줄 정보와 판매자가 관리에 필요한 정보를 분리했습니다.

- 공개 API: `PublicProductDto`
- 관리 API: `ProductDto`

공개 응답에서는 다음 정보를 의도적으로 제외했습니다.

- `sellerId`
- 전체 재고 수량
- 옵션별 상세 수량
- 내부 키워드 목록
- 내부 노출 플래그

대신 소비자 화면에는 `hasStock`, `soldOut` 같은 **표현에 필요한 최소 정보만 전달**하도록 바꿨습니다.  
이 변경은 단순 DTO 수정이 아니라, **공개 API 경계와 내부 운영 데이터 경계를 분리한 설계 결정**이었습니다.

### 7-4. 저장소 전략 추상화

파일 저장은 `FileStorageService` 추상화를 기준으로 분리했습니다.

- 개발 환경: `local`
- 운영 환경: `s3`

이 구조를 둔 이유는 다음과 같습니다.

- 로컬 개발 중에는 빠르게 테스트 가능
- 운영에서는 서버 디스크 의존성을 줄이고 S3 중심으로 확장 가능
- 동일한 업로드 로직을 유지하면서 저장 구현체만 교체 가능

### 7-5. AI 기능은 백엔드 뒤에 둠

AI 스타일 추천은 프론트엔드가 Gemini를 직접 호출하지 않고, **백엔드가 중간 계층**이 됩니다.

이렇게 한 이유는 다음과 같습니다.

- API Key를 프론트에 노출하지 않기 위함
- 사용자 메시지 필터링, 길이 제한, 예외 처리, fallback 로직을 서버에서 통제하기 위함
- 단순 LLM 응답이 아니라 **로컬 상품 데이터 기반 후보 선별 + 설명 보강** 구조를 만들기 위함

---

## 8. AWS 인프라 구성과 운영 경험

### 8-1. 구성

- **EC2**: Spring Boot API 서버 운영
- **RDS**: MySQL 운영 데이터베이스
- **S3**: 프론트 정적 파일 및 업로드 자산 저장
- **CloudFront**: 정적 프론트 배포와 캐시 계층
- **WAF**: 운영 보안 규칙 적용

### 8-2. 운영 관점에서 직접 다뤄 본 것

- 정적 프론트 빌드 결과물 S3 배포
- 이미지 업로드 자산 S3 저장
- CloudFront 캐시 무효화
- `/api/*` 와 정적 리소스 경로를 분리한 운영 구조
- WAF 관리형 규칙 적용 후 정상 요청 차단 이슈 분석
- EC2 재기동 후 백엔드 health 체크
- IAM Role 기반 S3 업로드 검증
- `prod + s3` 조합에서 필수 환경 변수 누락 시 즉시 실패 처리

### 8-3. 운영에서 중요했던 포인트

이 프로젝트에서 AWS는 “써봤다” 수준이 아니라, 실제로 다음 질문에 답하는 경험이었습니다.

- 정적 프론트와 API는 어디에 두는가
- 업로드 파일은 서버 디스크에 둘 것인가 S3에 둘 것인가
- 캐시가 남아 있을 때 배포가 왜 꼬이는가
- WAF가 정상 요청까지 막으면 어떻게 원인을 좁힐 것인가
- 운영 환경 변수 누락을 어떻게 배포 전에 드러낼 것인가

---

## 9. AI 스타일 추천 기능 설명

AI 스타일 추천은 단순히 “LLM에게 상품 추천을 맡긴 기능”이 아닙니다.

현재 구조는 다음과 같습니다.

1. 로그인 사용자만 AI 추천 기능을 사용합니다.
2. 사용자 메시지를 서버에서 길이/문맥 기준으로 검증합니다.
3. 카테고리, 계절, 스타일, 색상 등의 단서를 먼저 파싱합니다.
4. 로컬 상품 데이터에서 1차 후보를 고릅니다.
5. Gemini는 설명 보강과 추천 문장 생성 역할을 담당합니다.
6. 원격 AI를 사용할 수 없거나 실패하면 로컬 fallback 로직으로 응답합니다.

### 이 구조를 택한 이유

- LLM 단독 추천은 데이터 통제력이 약함
- 로컬 상품 데이터와 직접 연결된 추천 근거가 필요함
- 외부 응답 실패 시 기능 전체가 죽지 않도록 해야 함
- 유해 문맥이나 외부 쇼핑 유도 문장을 서버에서 차단할 필요가 있음

즉, 이 기능은 “AI를 붙였다”보다 **기존 상품 데이터와 AI 설명을 어떻게 결합할 것인가**에 더 가깝습니다.

---

## 10. SQL Injection 방어 구조

이 프로젝트에는 `SqlInputGuardService` 를 두고 검색/카테고리 입력에 대한 방어 흐름을 추가했습니다.

### 방어 방식

- 제어 문자 차단
- 의심스러운 SQLi 패턴 탐지
- 카테고리 허용 패턴 제한
- LIKE 검색 시 특수문자 escape 처리

### 적용 대상

- 상품 검색어
- 카테고리 조회
- 판매자 상품 관리 내부 검색/검증 경로

### 왜 별도 서비스로 뺐는가

- 컨트롤러마다 문자열 검사를 흩뿌리지 않기 위해
- 입력 검증 정책을 한 곳에서 일관되게 관리하기 위해
- “검색 기능이 있으니 나중에 보안 붙이면 된다”가 아니라, **검색 단계부터 방어를 설계에 포함**시키기 위해

---

## 11. 디렉토리 구조

```text
.
├─ frontend/
│  ├─ src/
│  │  ├─ assets/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ pages/
│  │  │  ├─ home/
│  │  │  ├─ mypage/
│  │  │  ├─ seller-dashboard/
│  │  │  ├─ HomePage.jsx
│  │  │  ├─ ProductDetailPage.jsx
│  │  │  ├─ CartPage.jsx
│  │  │  ├─ CheckoutPage.jsx
│  │  │  ├─ MyPagePage.jsx
│  │  │  ├─ NotificationsPage.jsx
│  │  │  ├─ AdminLoginPage.jsx
│  │  │  └─ SellerDashboardPage.jsx
│  │  ├─ services/
│  │  └─ utils/
│  ├─ .env.example
│  └─ package.json
│
├─ sosos/
│  ├─ src/
│  │  ├─ main/
│  │  │  ├─ java/com/prosos/sosos/
│  │  │  │  ├─ config/
│  │  │  │  ├─ controller/
│  │  │  │  │  └─ api/v1/
│  │  │  │  ├─ dto/
│  │  │  │  ├─ model/
│  │  │  │  ├─ repository/
│  │  │  │  └─ service/
│  │  │  │     ├─ security/
│  │  │  │     └─ storage/
│  │  │  └─ resources/
│  │  └─ test/
│  ├─ docs/
│  ├─ .env.example
│  ├─ Dockerfile
│  └─ pom.xml
│
├─ scripts/
└─ README.md
```

---

## 12. 프로젝트 회고

이 프로젝트를 하면서 가장 크게 느낀 점은, **쇼핑몰 프로젝트의 난도는 CRUD보다 운영 경계에서 올라간다**는 것이었습니다.

상품 등록, 장바구니, 주문 조회 자체보다 더 어려웠던 것은 다음과 같았습니다.

- 사용자/판매자 역할을 어디서 분리할 것인가
- 공개 데이터와 내부 데이터의 경계를 어떻게 정할 것인가
- 파일 저장 전략을 어떻게 환경에 따라 바꿀 것인가
- 외부 AI / 결제 / 보안 검증을 기존 도메인 흐름에 어떻게 붙일 것인가
- AWS 배포 이후 생기는 WAF / CloudFront / 캐시 문제를 어떻게 복구할 것인가

이 프로젝트를 통해 단순 기능 구현을 넘어서, **설계 이유를 설명할 수 있는 코드와 문서**를 만들려고 노력했습니다.

---

## 13. 학습 성과

- Spring Boot SSR 프로젝트를 React SPA + REST API 구조로 전환하는 경험
- 세션 기반 인증과 권한 분기 설계 경험
- JPA 기반 쇼핑몰 도메인 모델 확장 경험
- public / managed DTO 분리 경험
- 로컬 저장과 S3 저장 전략 분리 경험
- CloudFront / WAF / S3 / EC2 / RDS 운영 흐름 경험
- AI 기능을 기존 서비스 구조 안에 안전하게 통합하는 경험
- 운영 장애를 문서화하고 복구 절차를 정리하는 습관 형성

---

## 14. 향후 개선 계획

현재 구현 범위를 기준으로, 다음 항목들은 추후 개선이 필요한 영역입니다.

- 이메일 실소유 인증 기반 회원가입 검증
- 비밀번호 재설정(이메일 링크 기반) 기능
- 판매자 회원가입 + 관리자 승인 워크플로우
- 택배사 / 송장 연동 기반 배송 상태 자동화
- 주문 / 결제 예외 처리 테스트 확대
- AI 스타일 추천 기준 고도화
- CI/CD 자동화
- 모니터링 및 로그 알림 체계 강화
- 판매자 대시보드 통계 고도화

---

### 본 프로젝트는 1인 개발로 저작권은 해당 계정의 주인에게 있음을 사전 공지 드립니다.
