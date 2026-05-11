# LIKE ESCAPE 문자 핫픽스

## 무엇
- `ProductRepository.searchByNameEscaped` 쿼리의 `escape` 문자를 백슬래시(`\`)에서 느낌표(`!`)로 변경했다.
- `SqlInputGuardService.escapeForLike`도 동일 규칙(`!%`, `!_`, `!!`)으로 맞췄다.

## 왜
- Hibernate 6에서 JPQL `escape '\\'` 구문이 2글자로 해석되어 쿼리 검증 단계에서 예외가 발생했다.
- 이 예외로 `productRepository` 빈 생성이 실패하면서 백엔드가 기동하지 못했다.

## 언제
- 2026-05-11 운영 서버 `systemd` 재기동 시 `HTTP 000`이 반복되고,
- `journalctl`에 `Escape character literals must have exactly a single character`가 확인된 시점.

## 어떻게
1. 쿼리 escape 문자를 `'!'`로 고정했다.
2. 검색어 이스케이프 로직을 `!` 기반으로 변경했다.
3. `compile` / `test-compile` 성공으로 기동 전 정적 검증을 완료했다.

## 완료 기준 (Definition of Done)
- Hibernate 쿼리 검증 예외 없이 애플리케이션이 정상 기동된다.
