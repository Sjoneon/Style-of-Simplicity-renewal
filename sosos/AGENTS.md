# Style of Simplicity - 리뉴얼 프로젝트

## 🤖 Codex 작업 지침

### 토큰 절약 규칙
- **Internal thinking:** English only (save tokens!)
- **User response:** Korean (친절하게 설명)
- **Code comments:** English or minimal Korean
- **File paths:** English as-is
- **No fluff:** 불필요한 미사여구 금지, 핵심/결론만 답변
- **Direct style:** "좋아요", "가능합니다" 같은 완충 문구 없이 바로 실행/결론 제시
- **Docs language:** `docs/`에 생성/수정하는 문서는 기본 한글로 작성 (사용자가 영어를 명시 요청한 경우만 영어)
- **No emoji/emoticon:** 응답/문서에서 이모지, 이모티콘 사용 금지
- **Decision prompt:** 의사결정 1줄(무엇/왜) 기록이 필요한데 사용자 질문에 없으면 Codex가 먼저 확인 질문
- **Beginner-first teaching mode (hard rule):** 구현 전 반드시 학습용 설명 파일부터 작성. 설명 순서는 `무엇/왜/언제/어떻게` 고정, 용어 쉬운 설명 포함.
- **Feedback loop (hard rule):** 사용자가 피드백하면 기존 설명의 오류/누락을 먼저 명시하고, 수정 코드 + 변경 이유 + 쉬운 설명 + 문서 업데이트를 같이 수행.
- **Preflight check (hard rule):** 작업 착수 전 `docs/daily/codex-preflight-checklist.md`의 항목을 기준으로 누락 여부를 먼저 점검.

### 📁 최종 확정 시 저장 규칙 (중요!)

**저장 트리거 - 사용자가 아래 말할 때만 저장:**
- "됐어", "이거야", "완료", "확정", "OK", "맞아"
- "저장해", "fix됐어", "해결됐어"

**저장 파일:** `docs/session-log.md` (기존 내용 유지, 위에 누적 추가)

**저장 형식:**
```
---
## [날짜 시간] - [기능명]

### 💻 최종 확정 코드/설정
(확정된 코드 또는 설정만)

### 🔧 설치/버전 정보
(관련 설치 명령어, 버전)

### 📝 핵심 요약
(뭘 왜 이렇게 했는지 한 줄 요약)
---
```

**⚠️ 중요:**
- 중간 시도들은 저장 X
- 최종 확정된 내용만 저장
- 저장 후 "📁 저장완료: [기능명]" 출력

---

## 프로젝트 개요
기존 Spring Boot + Thymeleaf 프로젝트를 React로 프론트엔드 전환
+ 기능 강화 + AWS 배포 + AI 추가

**목적:** 면접 포트폴리오

## 프로젝트 위치
D:\Projects\Style-of-Simplicity

## 현재 구조
```
Style-of-Simplicity/
├─ sosos/                  # Spring Boot (Java 17, port 8085)
│   ├─ src/main/java/com/prosos/sosos/
│   │   ├─ controller/     # Thymeleaf (유지)
│   │   ├─ service/
│   │   ├─ repository/
│   │   ├─ model/
│   │   └─ dto/
│   └─ pom.xml
└─ README.md
```

## 기술 스택

**Backend (유지):**
- Java 17
- Spring Boot 3.3.5
- Spring Data JPA
- MySQL 8.0 (로컬) → RDS (AWS)
- Maven

**Frontend (신규):**
- React 18
- Vite
- Material-UI (MUI)
- Axios

**AI:**
- OpenAI API (스타일 컨설팅)

**배포:**
- AWS EC2 (Spring Boot)
- AWS S3 (React 정적 호스팅)
- AWS RDS (MySQL)

## 리뉴얼 목표

### 1단계: React 프론트엔드 전환 ⚡ (최우선)
```
□ frontend/ 폴더에 React + Vite 프로젝트 생성
□ 기존 화면 → React 컴포넌트 전환:
  - 메인 페이지 (상품 목록)
  - 상품 상세 페이지
  - 장바구니
  - 로그인/회원가입
  - 판매자 대시보드
□ Material-UI로 UI 개선
□ 반응형 디자인 (모바일 대응)
```

### 2단계: REST API 추가
```
□ /api/v1/* REST API 컨트롤러 생성
□ 기존 Thymeleaf 컨트롤러 유지 (하위 호환성)
□ CORS 설정 (React 연동)
□ JSON 에러 응답 통일
```

### 3단계: 기능 개선
```
□ 상품 검색 강화
□ 결제 프로세스 (실제 결제 제외, UI만)
□ 반품/교환 신청
□ 주문 상태 추적
```

### 4단계: AI 스타일 컨설팅 ⚡
```
□ OpenAI API 연동
□ 사용자 키워드 → AI 추천
□ 챗봇 UI (우측 하단 플로팅 버튼)
□ "어떤 옷이 어울릴까요?" 대화형 추천
```

### 5단계: AWS 배포 ⚡
```
□ Docker 이미지 생성
  - backend Dockerfile
  - frontend 빌드 후 S3 업로드
□ EC2에 Spring Boot 배포
□ S3에 React 정적 호스팅
□ RDS MySQL 연결
□ 환경변수 프로파일 분리
```

### 6단계: 성능 최적화 (선택)
```
□ 이미지 S3 업로드
□ Redis 캐싱 (인기 상품)
□ 테스트 코드
```

## 목표 프로젝트 구조
```
Style-of-Simplicity/
├─ backend/                   # (sosos → backend 이름 변경)
│   ├─ src/main/java/com/prosos/sosos/
│   │   ├─ controller/        # 기존 Thymeleaf (유지)
│   │   ├─ api/v1/            # 신규 REST API
│   │   │   ├─ ProductApiController.java
│   │   │   ├─ UserApiController.java
│   │   │   └─ OrderApiController.java
│   │   ├─ service/
│   │   ├─ repository/
│   │   ├─ model/
│   │   ├─ dto/
│   │   └─ config/
│   │       ├─ WebConfig.java      # CORS
│   │       └─ OpenAIConfig.java   # AI API
│   ├─ pom.xml
│   └─ Dockerfile
├─ frontend/
│   ├─ src/
│   │   ├─ components/
│   │   │   ├─ ProductList.jsx
│   │   │   ├─ ProductDetail.jsx
│   │   │   ├─ Cart.jsx
│   │   │   └─ AIConsultant.jsx    # AI 챗봇
│   │   ├─ pages/
│   │   ├─ services/
│   │   │   └─ api.js              # Axios 설정
│   │   ├─ App.jsx
│   │   └─ main.jsx
│   ├─ package.json
│   └─ vite.config.js
├─ docker/
│   ├─ docker-compose.yml
│   └─ nginx.conf
├─ docs/
│   └─ session-log.md             # 확정 내용 자동 저장
└─ AGENTS.md
```

## 데이터베이스
- **로컬:** localhost:3306/mydb (계정/비밀번호는 환경변수로 주입)
- **AWS:** RDS MySQL 8.0
- **포트:** 8085 (backend), 3000 (frontend dev), 80/443 (production)

## 코딩 규칙

### Java
- 기존 코드 스타일 유지
- API: /api/v1/* 형식
- DTO 패턴 사용
- CORS: localhost:3000 (dev), domain (prod)

### React
- 함수형 컴포넌트 + Hooks
- Material-UI 컴포넌트
- Axios로 API 호출
- 모바일 우선 반응형 디자인

### API 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "성공"
}
```

## 작업 원칙
1. **단계별 진행** (한 번에 1-2개 작업만)
2. **기존 코드 보존** (최대한 유지)
3. **동작 확인 후 다음 단계**
4. **확정 시에만 session-log.md 저장**

## 변경 금지
- 기존 DB 스키마
- Thymeleaf 엔드포인트 (하위 호환성)
- pom.xml 의존성 (필요한 것만 추가)

## 블로그 정리 요청 템플릿
작업 종료 후 요청:
```
오늘 작업(시작~종료)을 티스토리 블로그 포스트로 정리해줘.
docs/session-log.md 기반으로:
- 완료한 작업
- 코드 변경사항
- 트러블슈팅
- 다음 계획
- 배운 점
형식: 개발 브이로그 스타일
제목: "[포트폴리오] SOS 쇼핑몰 리뉴얼 - Day X"
```
