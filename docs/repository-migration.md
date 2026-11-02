# File Island 저장소 이관 기록

원본 저장소: `blockmonkey1992/hanq`

원본 SHA: `93190fae4656dad5a2337c9a1173c3a7107d339c`

방식: 새 저장소의 초기 README 커밋을 부모로 하는 소스 snapshot commit으로 이관합니다. 원본 Git history를 mirror하지 않습니다. 원본 저장소 이름·소유자·브랜치·remote·운영 배포는 변경하지 않습니다.

원격 `dev`에서 `RELEASE_VERSION=0.2.8-beta`를 확인했습니다. 공개 화면용 이미지·글꼴·JS·CSS와 `.vercelignore`가 명시적으로 허용한 `media/connector-summary.pdf`는 유지합니다. 원본 교재·음원·DB 덤프는 추가하지 않았습니다. `vercel.json`의 기존 API 주소는 소스 보존 목적으로 그대로 두었으며 새 Vercel 프로젝트를 연결하지 않았습니다.

## 제외 및 검증 경계

`.env`, 개인 접속 정보, 토큰·개인키, DB dump, 원본 교재·음원을 추가하지 않았습니다. `assets/home-server/hanq-db-connection.txt`는 이 SHA의 추적 목록에 없습니다. 기존 로컬 환경 파일·운영 호스트·Secrets 값은 읽거나 복사하지 않았습니다. 값 없는 경로/키 검사로 후보 문자열을 검토했고 테스트 fixture와 예제만 유지했습니다. 이는 전문 비밀 탐지 도구의 완전한 보증이 아닙니다.

## 자동화 보류

이관 push로 Actions가 실행되지 않도록 모든 원본 workflow를 실행 경로 밖에서 `.disabled` 확장자로 보존합니다. 원본은 GitHub-hosted `ubuntu-latest`를 사용하며 `secrets.*` 참조는 없었습니다. Actions/runner/보호 규칙/Secrets 권한 설정은 변경하지 않습니다.

- `.github/workflows/ci.yml` → `.github/workflows-held/ci.yml.disabled`
- `.github/workflows/header-refinement-pixels.yml` → `.github/workflows-held/header-refinement-pixels.yml.disabled`
- `.github/workflows/map-header-pixel-review.yml` → `.github/workflows-held/map-header-pixel-review.yml.disabled`

## 검사

- 버전 빌더 테스트, 프론트 collection capability guard 통과.
- 인증 session 33, API timeout 22, auth restoration 19, remember session 48 checks 통과. mock transport/fake clock 기반이며 실제 운영 API를 호출하지 않았습니다.
- 이 저장소는 정적 웹 소스이며 package.json 기반 frontend build는 없습니다. 실제 버전 빌더는 원본 index를 변형하므로 독립 임시 fixture 테스트로 검증했습니다.

이 기록은 snapshot commit과 함께 보존합니다. 원격 main SHA와 파일 checksum을 별도로 재조회하여 push 결과를 검증합니다. 기존 공백 문제는 원본 그대로 유지했으며 staged diff --check 경고를 이관 코드 수정과 섞지 않았습니다.

## Windows 전환 전 0.2.9 소스 준비 (2026-11-02)

로컬 branch: `prep/windows-fe-029`, 원격 기준: `e4f81da41b00376d5d96dc16c75716ffc7a23802`. 원본 `93190fae4656dad5a2337c9a1173c3a7107d339c` → `cfc9892a2a180a33b177a8689bcdfa8f0b5607f7`의 17개 파일 delta를 대조했습니다. 16개 일반 소스/QA/문서 파일은 patch로 반영했고, 나머지 원본 `.github/workflows/ci.yml`은 `.github/workflows-held/ci.yml.disabled`에만 반영했습니다. README의 새 저장소 이관 안내는 보존했습니다. 활성 workflow는 만들지 않았습니다.

기존 dev/Vercel 0.2.9 배포와 HTML/19개 자산 검증 완료는 FE 담당이 전달한 상태이며 이 작업이 다시 배포하거나 검증한 결과가 아닙니다. 사전 전체 CI 41423020199 SUCCESS 및 postpush 41425999577 추적도 FE 담당 범위입니다. 이 변경은 새 저장소의 소스 동기화이며 CI 실행·운영 반영은 별도입니다. 원본17파일의 내용 대조, 변경 JavaScript 구문, diff 검사는 통과했고 Windows에서 unit/브라우저 QA를 다시 실행하지 않았습니다. 새 저장소의 빌드 SHA는 원본 SHA와 달라지므로 전환 후 app-version과 자산 해시는 새 commit 기준으로 재검증해야 합니다.

## 새 저장소의 테스트 CI 활성화 (2026-11-02)

held `ci.yml.disabled`를 활성 `.github/workflows/ci.yml`로 그대로 복사합니다. 기존4개 job과68개 직접 호출 스크립트, Chromium/WebKit 회귀 범위를 유지합니다. push/PR/수동 trigger는 원본과 같아 main에 별도 branch 치환이 필요하지 않습니다. 리뷰 branch 전용 합성 artifact 조건도 유지합니다. 배포 단계·Secrets 참조·Vercel 연결·self-hosted runner가 없고 GitHub 권한은 `contents: read`입니다. 활성화 commit의 실제 run 성공은 별도로 확인해야 하며 이 문서가 성공을 선언하지 않습니다.

snapshot 이관에는 원본 history가 없어 기존 테스트3개가 참조하던 과거 commit을 새 CI에서 읽을 수 없었습니다. 공개 프런트 기준 파일5개만 `test/fixtures/regression-baselines/`에 원본 바이트 그대로 보존하고 Git blob ID와 SHA256을 manifest에 기록합니다. 공통 reader가 두 hash를 검증한 뒤 기존 assertion에 같은 bytes를 전달합니다. 원본 Git history·비공개 교재·인증 fixture는 추가하지 않았고 assertion·검사 범위를 줄이지 않았습니다. `.vercelignore`에 `test/`를 추가하여 baseline fixture를 웹 배포에서 제외합니다.

원본 baseline: header `ca0113e84ba0bcb7b1d223ec3d7636589592339c`의 index/device-shell JS·CSS, grammar `51c1c098a07c4c22a8cfc0694d978bdfb6a03830`의 grammar data, vocabulary `35b5ce95a2caae9cad321092ba26c8993dbd0937`의 supplement입니다. 사용자 화면 소스·API 계약·RELEASE_VERSION은 이번 CI 준비에서 변경하지 않습니다.
