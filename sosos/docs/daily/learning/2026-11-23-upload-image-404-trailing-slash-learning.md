# 2026-11-23 업로드 이미지 404 (리소스 위치 끝 '/' 누락) 학습

## 무엇
로컬 저장소(`app.storage.type=local`)에서 상품 이미지 업로드는 성공하는데 `/images/...` 조회가 404가 되는 문제를 고쳤다.
서버를 재시작하면 정상으로 돌아와서 재현이 들쭉날쭉해 보였던 버그다.

작업 대상 파일
- `sosos/src/main/java/com/prosos/sosos/config/WebConfig.java` (`toDirectoryLocation`)
- `sosos/src/test/java/com/prosos/sosos/config/WebConfigUploadLocationTest.java`

완료 기준(DoD)
- 업로드 폴더가 없는 상태로 서버를 시작해도, 첫 업로드 직후 재시작 없이 `/images/...`가 200이다.

## 왜
원인은 두 가지 동작이 겹친 것이다.

1. `Path.toUri()`는 **그 경로에 폴더가 실제로 있을 때만** 끝에 `/`를 붙인다.
   - 폴더 있음: `file:///C:/.../uploads/`
   - 폴더 없음: `file:///C:/.../uploads` (파일로 간주)
2. Spring은 리소스 위치 기준으로 요청 파일을 `createRelative`로 찾는다. 이건 URL 상대경로 규칙이라
   위치가 `/`로 끝나지 않으면 **마지막 조각(`uploads`)을 파일명으로 보고 버린다.**
   - `.../uploads/` + `a.png` → `.../uploads/a.png` (정상)
   - `.../uploads` + `a.png` → `.../a.png` (상위 폴더를 찾음 → 404)

`WebConfig.addResourceHandlers`는 **서버 시작 시 한 번만** 위치를 계산한다.
그 순간 폴더가 없으면 `/` 없는 위치가 고정되고, 이후 `LocalFileStorageService`가 첫 업로드 때
폴더를 만들어도 이미 등록된 위치는 바뀌지 않는다. 그래서 재시작 전까지 모든 이미지가 404다.

참고: 상위 폴더 파일이 대신 노출될 수 있는지는 직접 검증하지 않았다. Spring `PathResourceResolver`가
찾은 파일이 위치 경로 아래에 있는지 한 번 더 검사하는 코드가 있어 막힐 것으로 보이지만, 이번 수정으로
위치가 항상 업로드 폴더를 가리키게 되어 이 경우 자체가 생기지 않는다.

실제 확인(jshell, Spring `UrlResource`):
```
missing  toUri  = file:///.../uritest/missing
existing toUri  = file:///.../uritest/existing/
missing  relative(a.png) = file:/.../uritest/a.png            <- 상위 폴더
existing relative(a.png) = file:/.../uritest/existing/a.png
```

## 언제 되고 언제 안 되나
| 상황 | 결과 | 이유 |
|---|---|---|
| 업로드 폴더가 이미 있는 상태로 서버 시작 | 정상 | 시작 시 `toUri()`가 `/`를 붙임 |
| **새로 clone한 뒤 첫 실행** | 404 | `uploads/`는 `.gitignore` 대상이라 폴더가 없음 |
| `uploads` 폴더를 지우고 서버 재시작 | 404 | 시작 시점에 폴더 없음 |
| `APP_UPLOAD_BASE_DIR`를 새 경로로 바꾸고 시작 | 404 | 새 경로에 폴더 없음 |
| 실행 위치(cwd)가 달라짐 (예: 루트에서 jar 실행) | 404일 수 있음 | 기본값 `uploads`가 상대경로라 cwd 기준으로 다른 폴더를 가리킴 |
| 404 상태에서 서버 재시작 | 정상 | 첫 업로드 때 폴더가 생겨서 다음 시작 땐 `/`가 붙음 |
| 실행 중에 폴더를 지웠다가 다시 생김 | 정상 | 위치는 시작 때 `/` 포함으로 이미 고정됨 |
| 운영(`app.storage.type=s3`) | 해당 없음 | `/images/**` 핸들러를 등록하지 않음 (S3 URL 사용) |

증상으로 구분하는 법: "업로드 API는 201/200인데 이미지 URL만 404, 재시작하면 해결" → 이 문제다.

## 어떻게
1. `WebConfig.toDirectoryLocation()`에서 위치 문자열이 `/`로 끝나지 않으면 붙인다.
   폴더 존재 여부와 상관없이 항상 디렉터리 위치가 된다.
2. 회귀 테스트 `WebConfigUploadLocationTest`
   - 폴더가 없을 때도 위치가 `/`로 끝나고, Spring 방식(`createRelative`)으로 찾은 파일이 업로드 폴더 안을 가리키는지
   - 폴더가 있을 때는 기존 값과 같은지
3. 실서버 확인: 존재하지 않는 `APP_UPLOAD_BASE_DIR`로 서버 시작 → 시드 스크립트로 상품 1개 등록 →
   재시작 없이 이미지 URL 200 확인 (수정 전에는 같은 절차에서 404, 재시작 후 200).

## 비슷한 곳에서 다시 써먹을 점
- Spring `addResourceLocations`에 파일시스템 경로를 넣을 때는 **항상 `/`로 끝나게** 만든다
  (`file:` 문자열을 직접 만들 때도 마찬가지).
- `Path.toUri()` 결과의 끝 `/`는 디스크 상태에 따라 달라진다. 설정값 계산에 쓰면 실행 환경마다 결과가 달라진다.
- "재시작하면 고쳐지는" 버그는 시작 시점에 한 번만 계산되는 값(빈 등록, 핸들러 위치, 캐시)을 먼저 의심한다.
