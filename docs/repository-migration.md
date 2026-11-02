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
