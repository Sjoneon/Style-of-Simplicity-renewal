# 문의 카테고리/이미지 업로드 확장 학습 (2026-04-29)

## 무엇
- 고객센터 문의를 카테고리별로 분류하고, 판매자 화면에서도 카테고리 기준으로 빠르게 필터링/답변할 수 있게 확장한다.
- 소비자 문의 등록 시 이미지 1장을 첨부할 수 있게 하고(크기/용량 제한), 접수 전 교환/환불 주의 문구를 고정 노출한다.

### 오늘 작업 대상 파일 경로
- `sosos/src/main/java/com/prosos/sosos/model/Inquiry.java`
- `sosos/src/main/java/com/prosos/sosos/dto/InquiryDto.java`
- `sosos/src/main/java/com/prosos/sosos/controller/InquiryController.java`
- `frontend/src/services/inquiryApi.js`
- `frontend/src/pages/CustomerCenterPage.jsx`
- `frontend/src/pages/SellerDashboardPage.jsx`
- `sosos/docs/daily/2026-04-29.md`

### 완료 기준(DoD)
- 소비자가 문의 등록 시 카테고리 선택 + 이미지 첨부(제한 검증 포함) + 주의 문구 확인이 가능하다.
- 판매자가 Q&A 탭에서 카테고리 필터로 문의를 좁혀 보고 답변 저장이 가능하다.
- 기존 문의 데이터(카테고리/이미지 미보유)도 오류 없이 조회된다.

## 왜
- 기존에는 문의가 한 덩어리로만 보여 판매자 응답 우선순위를 잡기 어렵다.
- 상품 하자/오배송 문의는 사진이 있어야 판단 속도가 올라간다.
- 교환/환불 주의사항을 선노출하면 분쟁 가능성을 줄일 수 있다.

## 언제
- 소비자/판매자 문의 흐름 고도화 피드백을 받은 즉시 반영한다.

## 어떻게
1. 백엔드 문의 모델에 `category`, `imageUrl` 필드를 추가하고 기본 카테고리 보정 로직을 넣는다.
2. 문의 등록 API를 `multipart/form-data`로 확장해 이미지 업로드를 처리하고, 파일 용량/픽셀 제한을 서버에서 검증한다.
3. 소비자 고객센터에 카테고리 선택 UI, 주의 문구, 이미지 첨부 UI를 추가한다.
4. 판매자 Q&A 탭에 카테고리 필터/카테고리 표기를 추가한다.
5. 핵심 분기(기본 카테고리 보정, 이미지 검증, 카테고리 필터)에 한국어 주석을 최소한으로 남긴다.

## 쉬운 용어 설명
- 카테고리 필터: 문의를 주제별로 좁혀서 보는 기능
- multipart 업로드: 글자 데이터와 파일을 한 요청으로 같이 보내는 방식
- 서버 검증: 프론트 우회 요청도 막기 위해 백엔드에서 최종 검사하는 단계
