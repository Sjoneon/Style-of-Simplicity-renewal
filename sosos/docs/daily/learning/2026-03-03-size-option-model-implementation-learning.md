# 2026-03-03 사이즈 옵션 모델 구현 학습 노트

## 무엇
- 상품에 사이즈 옵션(S/M/L 등)을 붙일 수 있는 구조를 만든다.
- 판매자는 상품 등록/수정 시 사이즈별 재고를 입력한다.
- 사용자는 상품 상세에서 사이즈를 선택한 뒤 장바구니/주문을 진행한다.
- 주문 기록에 선택한 사이즈가 남도록 처리한다.

## 왜
- 현재는 상품당 재고 숫자 1개(one-stock)라 사이즈 선택이 불가능하다.
- 의류 쇼핑몰에서 사이즈 미지원은 실제 구매 흐름과 맞지 않는다.
- 재고도 상품 전체가 아니라 사이즈별로 소진되어야 품절 처리 정확도가 올라간다.

## 언제
- 핵심 화면 마이그레이션(로드맵 5번)에서 주문 UX를 실사용 형태로 고도화하는 단계에서 적용한다.
- 완료 기준(DoD):
  - 관리자 상품 등록/수정에서 사이즈별 재고 입력 가능
  - 상품 상세에서 사이즈 선택 UI 노출
  - 사이즈 미선택 시 담기/주문 차단
  - 장바구니/주문 내역에 선택 사이즈 표시
  - 서버에서 사이즈 재고 검증 및 차감 동작

## 어떻게
1. 백엔드 모델 확장
- `ProductOption` 엔티티(`product_id`, `size_label`, `quantity`, `display_order`) 추가
- `Product`에 옵션 목록 연관관계 추가
- `Cart`에 선택 옵션(`product_option_id`) 연결 필드 추가
- `Order`에 주문 당시 사이즈 라벨 저장 필드(`size_label`) 추가

2. DTO/API 확장
- `ProductDto`에 옵션 리스트(`options`)와 장바구니 선택 정보(`selectedOptionId`, `selectedSizeLabel`) 추가
- 상품 등록/수정 API에서 `options` JSON 수신 처리 추가
- 장바구니 담기/바로주문 API에 `optionId` 파라미터 지원

3. 서비스 로직 확장
- 상품 등록/수정 시 옵션 목록을 저장하고 총 재고는 옵션 합계로 계산
- 장바구니 담기/주문 시 옵션 재고 검증
- 주문 생성 시 선택한 사이즈 라벨 저장

4. 프론트 연동
- 관리자 대시보드: `사이즈별 재고` 입력란 추가
- 상품 상세: 옵션 버튼/선택 상태/재고 안내 추가
- 장바구니/주문내역: 선택 사이즈 텍스트 표시

## 쉬운 용어 설명
- 옵션 모델: 같은 상품을 사이즈별로 나눠 관리하는 구조
- one-stock: 상품당 재고 숫자 1개만 두는 단순 구조
- optionId: 선택한 사이즈 항목의 고유 번호
- size_label: 주문 당시 기록되는 사이즈명(S, M, L 등)

## 오늘 작업 대상 파일(예정)
- `sosos/src/main/java/com/prosos/sosos/model/Product.java`
- `sosos/src/main/java/com/prosos/sosos/model/ProductOption.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/model/Cart.java`
- `sosos/src/main/java/com/prosos/sosos/model/Order.java`
- `sosos/src/main/java/com/prosos/sosos/dto/ProductDto.java`
- `sosos/src/main/java/com/prosos/sosos/dto/ProductOptionDto.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/dto/OrderDto.java`
- `sosos/src/main/java/com/prosos/sosos/repository/ProductOptionRepository.java` (신규)
- `sosos/src/main/java/com/prosos/sosos/repository/CartRepository.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/ProductApiController.java`
- `sosos/src/main/java/com/prosos/sosos/controller/api/v1/OrderApiController.java`
- `frontend/src/services/productApi.js`
- `frontend/src/services/orderApi.js`
- `frontend/src/pages/SellerDashboardPage.jsx`
- `frontend/src/pages/ProductDetailPage.jsx`
- `frontend/src/pages/CartPage.jsx`
- `frontend/src/components/ProductList.jsx`
- `sosos/docs/daily/2026-03-03.md`
