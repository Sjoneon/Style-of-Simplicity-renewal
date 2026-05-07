# AI 멀티턴 자연 추천 품질 패치 학습 (2026-04-30)

## 무엇
- AI 스타일 추천에서 `2~3턴째 답변이 짧아지거나 문맥이 끊기는 문제`를 줄이기 위한 패치다.
- 핵심은 세 가지다.
  - 프론트에서 최근 대화 히스토리를 함께 전송
  - 백엔드에서 히스토리를 반영해 의도(예: 상하의 조합)를 더 정확히 파악
  - AI 답변 품질이 기준 미달이면 로컬 fallback(안전한 추천 문장)으로 자동 교체

## 왜
- 기존 구조는 매 요청마다 `현재 문장 1개`만 모델에 전달한다.
- 그래서 사용자가 2~3턴째에서 조건을 보강해도, 모델이 이전 맥락을 잃고 짧은 답을 낼 수 있다.
- “응답이 오긴 오는데 품질이 흔들리는 문제”는 실사용에서 체감이 크기 때문에 안정 장치가 필요하다.

## 언제
- AI 추천이 다음 패턴을 보일 때 적용한다.
  - 첫 턴은 정상인데 후속 턴에서 답변이 한 줄로 급격히 짧아짐
  - `상의+하의`처럼 조합 요청인데 한쪽만 반복 추천
  - 사용자가 같은 요구를 다시 말해도 맥락을 이어받지 못함

## 어떻게
- 작업 대상 파일:
  - `frontend/src/components/AiStylistWidget.jsx`
  - `frontend/src/services/aiStylistApi.js`
  - `sosos/src/main/java/com/prosos/sosos/dto/AiStylistChatRequest.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/AiStylistApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/service/AiStylistService.java`
  - `sosos/src/test/java/com/prosos/sosos/service/AiStylistServiceTest.java`
- 적용 순서:
  1. 요청 DTO에 `history` 필드 추가
  2. 위젯에서 최근 대화(최대 N턴) 전송
  3. 서비스에서 `현재 문장 + 최근 문맥`을 합쳐 의도 분석
  4. AI 응답 품질 검사(너무 짧음/형식 미달) 후 fallback 전환
  5. 조합 요청(예: TOP+BOTTOM)일 때 추천 카드 구성 강제 보정

## 쉬운 용어 설명
- 멀티턴: 대화를 한 번이 아니라 여러 번 이어가는 방식
- 히스토리: 이전 대화 내용 묶음
- fallback: AI 답이 불안정할 때 대신 쓰는 안전한 기본 응답
- 품질 게이트: “이 답변을 그대로 보여줄지” 검사하는 문턱 규칙

## 완료 기준 (DoD)
- 2~3턴 연속 질의에서 이전 요구(계절/품목/조합)가 유지된 추천 문장이 나온다.
- 응답이 비정상적으로 짧을 때 자동으로 fallback 문장으로 교체된다.
- `상의+하의` 요청에서 가능하면 두 카테고리가 함께 추천된다.

## 피드백 반영 결과
1. 프론트
- `AiStylistWidget`에서 최근 8개 메시지를 `history`로 서버에 함께 전송하도록 수정했다.
- `requestAiStyling(message, history)` 형태로 API 요청 확장했다.

2. 백엔드
- `AiStylistChatRequest`에 `history` 필드를 추가했다.
- `AiStylistService`가 `현재 메시지 + 최근 사용자 대화`를 합쳐 의도/토큰을 파싱하도록 변경했다.
- 요청 카테고리가 비어지는 경우를 줄이기 위해, 누락 카테고리 fallback 후보를 보강했다.
- Gemini 응답이 너무 짧거나(길이/형식 미달), 추천 상품명을 언급하지 않으면 로컬 fallback으로 교체하는 품질 게이트를 추가했다.

3. 테스트
- `AiStylistApiControllerTest`를 새 시그니처(`chat(message, history)`)에 맞게 갱신했다.
- `AiStylistServiceTest`에 멀티턴 문맥 기반 후속 질의 시나리오를 추가했다.

## 검증 결과
- 백엔드 테스트: `cd sosos && .\\mvnw.cmd -q "-Dtest=AiStylistServiceTest,AiStylistApiControllerTest" test` 성공
- 프론트 린트: `cd frontend && npm run lint` 성공(경고만 존재, 에러 0)
- 프론트 빌드: `cd frontend && npm run build` 성공
- 깨진 한글 점검: `powershell -ExecutionPolicy Bypass -File scripts/check-korean-garbled.ps1` 성공
