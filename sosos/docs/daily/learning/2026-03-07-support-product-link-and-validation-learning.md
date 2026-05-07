# 2026-03-07 상품 문의 자동연결 + 문의 productId 검증 학습

## 무엇
- 고객센터 문의 작성에서 `관련 상품 ID` 수기 입력을 제거한다.
- 상품 상세에서 `문의하기` 버튼을 눌러 `/support?productId=...`로 자동 연결한다.
- 백엔드 문의 생성 시 `productId`가 존재하지 않으면 DB 예외(500) 대신 `400`으로 처리한다.

### 오늘 작업 대상 파일 경로
- `frontend/src/pages/ProductDetailPage.jsx`
- `frontend/src/pages/CustomerCenterPage.jsx`
- `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java`
- `sosos/docs/daily/2026-03-07.md`

### 완료 기준(DoD)
- 고객센터에서 상품 ID 수기 입력 없이 일반 문의 등록이 가능하고, 상품 상세에서 이동한 문의는 자동으로 해당 상품 ID가 연결되며, 없는 상품 ID 요청은 400으로 응답하면 완료.

## 왜
- 수기 입력은 오타/없는 ID 입력으로 DB FK 에러를 만들기 쉽다.
- 상품 상세 맥락에서 자동 연결하면 사용자 실수가 줄고 문의 품질이 높아진다.
- 서버에서 사전 검증하면 운영 중 500 로그를 줄이고 원인을 사용자에게 명확히 안내할 수 있다.

## 언제
- 고객센터 MVP를 이미 사용 테스트 중인 지금 바로 반영하는 것이 맞다.
- 오류 재현이 확인된 상태라 우선순위를 높게 처리한다.

## 어떻게
1. 프론트(상품 상세)
- `문의하기` 버튼 추가
- 클릭 시 `/support?productId=<현재상품ID>`로 이동

2. 프론트(고객센터)
- 문의 작성 폼에서 `관련 상품 ID` 입력칸 제거
- URL 쿼리의 `productId`를 읽어 문의 payload에 자동 포함
- 화면에는 `상품 문의 모드` 안내만 보여주고 수기 입력은 막는다

3. 백엔드(문의 생성)
- `productId`가 있으면 `ProductRepository.existsById`로 존재 검증
- 없으면 `400 Bad Request` + 메시지 반환
- 있거나 null이면 기존처럼 저장

4. 검증
- 프론트 린트/빌드
- 백엔드 컴파일

## 쉬운 용어 설명
- FK(외래키): 다른 테이블에 실제로 존재해야만 저장 가능한 연결 규칙
- 자동연결: 사용자가 숫자를 직접 치지 않고, 화면 이동 시 값이 자동 전달되는 방식
