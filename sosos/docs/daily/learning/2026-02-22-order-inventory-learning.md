# 학습 설명 (구현 전) - 2026-02-22 14:37 주문/재고 무결성 보강

## 무엇
- 주문 생성과 재고 차감을 한 트랜잭션 안에서 처리하도록 구조를 정리한다.
- 장바구니 결제와 즉시 구매에서 `Order.quantity`를 반드시 저장하도록 맞춘다.
- 주문 DTO가 현재 재고가 아니라 "주문 당시 수량"을 반환하도록 수정한다.

## 왜
- 재고 차감과 주문 저장이 분리되면, 중간 실패 시 데이터가 어긋날 수 있다.
- 동시 요청이 들어오면 같은 재고를 중복 차감해 음수 재고나 초과 판매가 발생할 수 있다.
- 주문 수량을 주문 엔티티에 저장하지 않으면, 나중에 조회할 때 과거 주문 정보가 왜곡된다.

## 언제
- P1-3(주문/재고 무결성 보강) 구현을 시작하기 직전에 수행한다.
- 결제/주문 관련 코드를 수정하기 전에 기준(트랜잭션 경계, 수량 정책)을 고정할 때 수행한다.

## 어떻게
- 1단계: 재고 차감이 있는 조회에 DB 잠금(`PESSIMISTIC_WRITE`)을 적용한다.
- 2단계: 서비스 계층에 `@Transactional`을 적용해 "재고 차감 + 주문 저장 + 장바구니 정리"를 원자적으로 처리한다.
- 3단계: `Order.quantity`, `Order.totalAmount`, `Order.status`를 주문 시점 기준으로 명시 저장한다.
- 4단계: 컨트롤러의 직접 DB 처리 코드를 서비스 호출로 바꿔 중복/불일치를 줄인다.
- 5단계: 빌드로 컴파일 검증 후, 실패 케이스(재고 부족) 메시지 흐름을 점검한다.

## 쉬운 용어 설명
- 트랜잭션: 여러 DB 작업을 "모두 성공" 또는 "모두 취소"로 묶는 안전장치.
- 원자성: 작업 중 일부만 반영되지 않게 하는 성질.
- 비관적 락(PESSIMISTIC_WRITE): 내가 수정 중인 행을 잠가서 동시에 다른 수정이 못 들어오게 하는 방식.
- 주문 당시 수량: 지금 남은 재고가 아니라, 그 주문에서 실제로 산 개수.

## 오늘 작업 대상 파일(예정)
- `sosos/src/main/java/com/prosos/sosos/repository/ProductRepository.java`
- `sosos/src/main/java/com/prosos/sosos/service/UserService.java`
- `sosos/src/main/java/com/prosos/sosos/service/SellerService.java`
- `sosos/src/main/java/com/prosos/sosos/controller/ProductController.java`
- `sosos/src/main/java/com/prosos/sosos/dto/OrderDto.java`

## 완료 기준(DoD)
- 주문/재고 처리 경로에서 트랜잭션과 수량 저장이 일관되게 적용되고, 주문 조회 시 `Order.quantity`가 정확히 반환된다.
