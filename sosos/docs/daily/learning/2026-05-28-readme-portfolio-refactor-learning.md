# README 전면 리팩토링 학습 메모

## 무엇
- `Day_Sync_README.md` 수준의 구조와 설명 밀도를 참고해 `SOS Renewal`용 포트폴리오 README를 새로 작성한다.
- 단순 기능 나열이 아니라, 리뉴얼 배경, SPA/API 분리 이유, AWS 운영 경험, 트러블슈팅과 회고까지 포함한 기술 문서형 README를 만든다.

## 왜
- 기존 README는 핵심 사실은 담고 있지만, 면접관 관점에서 "왜 이런 구조를 선택했는지"와 "실제 운영 경험이 무엇이었는지"가 충분히 드러나지 않는다.
- 포트폴리오 README는 기능 소개보다 설계 이유, 역할 분리, 운영 판단, 장애 대응 경험이 더 잘 보여야 기술면접 대응력이 올라간다.
- 참고용 README의 장점은 섹션 구조, 기술 설명 밀도, 설치/구조/회고의 연결성이므로, 그 형식을 빌리되 내용은 SOS Renewal 실제 구현 근거로 새로 써야 한다.

## 언제
- 프로젝트 1차 마감 이후 README를 포트폴리오 수준으로 끌어올릴 때
- GitHub 저장소 첫 화면에서 프로젝트 설명력을 강화하고 싶을 때
- 기술면접 전에 설계 배경과 운영 경험을 정리하고 싶을 때

## 어떻게
- 참고 README와 현재 README를 비교해 섹션 격차를 먼저 정리한다.
- 실제 코드/문서 기준으로 확인 가능한 내용만 추출한다.
- README는 "프로젝트 소개 → 설계 배경 → 아키텍처 → 핵심 기능 → 구현 구조 → 운영 경험 → 설치/실행 → 회고" 흐름으로 재구성한다.
- 추측이 필요한 기능은 제외하고, 불명확한 내용은 보수적으로 표현한다.

## 오늘 작업 대상 파일
- `C:\Users\song\Downloads\Day_Sync_README.md`
- `C:\Users\song\Downloads\NOW_SOS_Renewal_README.md`
- `README.md`
- `frontend/package.json`
- `sosos/pom.xml`
- `frontend/src/`
- `sosos/src/main/java/com/prosos/sosos/`
- `sosos/docs/troubleshooting/`
- `sosos/docs/deployment/`

## 완료 기준
- SOS Renewal 실제 구현 범위만 반영한 GitHub 포트폴리오용 README 전체 초안을 Markdown으로 완성한다.
