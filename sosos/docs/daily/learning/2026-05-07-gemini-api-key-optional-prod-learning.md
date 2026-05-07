# 2026-05-07 GEMINI_API_KEY 선택적 처리 학습

## 무엇
- 운영 프로필(`prod`)에서 `GEMINI_API_KEY`가 없어도 백엔드가 기동되도록 설정을 변경한다.
- 대상 파일:
  - `sosos/src/main/resources/application-prod.properties`

## 왜
- 기존 설정 `app.ai.gemini.api-key=${GEMINI_API_KEY}`는 환경변수가 비어 있으면 플레이스홀더 해석 단계에서 서버가 즉시 종료된다.
- 운영 초기에 AI 키를 아직 넣지 않은 상태에서도 주문/상품/회원 기능 점검이 가능해야 한다.

## 언제
- EC2 배포 첫 기동 시점에 `Could not resolve placeholder 'GEMINI_API_KEY'` 오류가 발생했을 때 적용한다.
- AI 기능을 나중에 단계적으로 켤 계획일 때 선반영한다.

## 어떻게
1. `application-prod.properties`의 AI 키 항목을 기본값 포함 형태로 바꾼다.
   - 변경 전: `app.ai.gemini.api-key=${GEMINI_API_KEY}`
   - 변경 후: `app.ai.gemini.api-key=${GEMINI_API_KEY:}`
2. 백엔드를 재기동한다.
3. `/actuator/health`로 기동 확인 후, AI 기능은 키를 넣은 뒤 별도 검증한다.

## 완료 기준 (DoD)
- `GEMINI_API_KEY` 미설정 상태에서도 백엔드가 정상 기동한다.
