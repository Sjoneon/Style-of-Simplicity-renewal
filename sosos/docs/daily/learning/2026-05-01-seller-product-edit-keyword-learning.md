# 상품 수정 키워드 노출/수정 기능 학습 (2026-05-01)

## 무엇
- 판매자 상품 **수정 모달**에서도 현재 키워드를 확인하고 수정 저장할 수 있게 만든다.
- 대상 파일:
  - `frontend/src/components/seller-dashboard/ProductDialog.jsx`
  - `frontend/src/pages/seller-dashboard/useSellerDashboardController.js`
  - `frontend/src/services/productApi.js`
  - `sosos/src/main/java/com/prosos/sosos/dto/ProductDto.java`
  - `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
  - `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`

## 왜
- 현재는 상품 등록 때만 키워드를 입력할 수 있고, 수정할 때는 기존 키워드가 보이지 않아 운영자가 관리하기 어렵다.
- 프론트/백엔드 둘 다 수정 경로에서 키워드 전달 로직이 빠져 있어 저장이 반영되지 않는다.

## 언제
- 판매자가 기존 상품의 시즌/스타일 키워드를 바꾸거나 보강할 때 바로 필요하다.
- AI 추천 정확도를 운영 중에 개선하려면 상품 키워드의 수정 가능성이 필수다.

## 어떻게
1. 수정 모달에 키워드 입력칸을 노출한다.
2. 수정 모달을 열 때 기존 키워드를 문자열로 채워 넣는다.
3. 수정 API 요청(FormData)에 `keywords` JSON을 포함한다.
4. 백엔드 수정 엔드포인트에서 `keywords`를 파싱한다.
5. 서비스 레이어에서 기존 키워드를 교체 저장(클리어 후 재저장)한다.
6. 컴파일/빌드로 회귀를 확인한다.

## 쉬운 용어 설명
- FormData: 파일 업로드와 텍스트를 같이 보내는 요청 포맷.
- DTO: 화면/요청으로 주고받는 데이터 묶음 객체.
- 교체 저장: 기존 값을 지우고 새 값으로 다시 넣는 방식.

## 완료 기준 (DoD)
- 판매자 상품 수정 모달에서 키워드가 보이고, 수정 후 재열기 시 변경 키워드가 그대로 보인다.
