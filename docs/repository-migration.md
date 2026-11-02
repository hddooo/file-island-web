# File Island 저장소 이관 기록

## 새 저장소의 배포 산출물과 호스팅 후보 (2026-11-02)

새 저장소는 `hddooo/file-island-web`, 기준 소스는 `main`의 `4e51eb7425bb3cad7a71ab9735a9f9e1b96dd242` / `0.2.9-beta`입니다. 기존 `hanq.vercel.app`의 Git 연결, 운영 API, DNS, 인증 및 Secrets는 이번 준비에서 변경하지 않습니다. 시험용 파일 호스트 `digimon-world.duckdns.org`도 그대로 유지합니다.

활성 CI의 기존 4개 job/68개 직접 호출 스크립트/Chromium·WebKit 검사는 보존합니다. 새 `static-build` job은 네 job 모두 성공한 뒤 아래 명령을 실행하고 `frontend-static-<전체 SHA>` artifact를 7일 보관합니다. runner는 GitHub-hosted, 권한은 기존 `contents: read`이며 배포 credential은 사용하지 않습니다. **artifact 생성은 운영 배포가 아닙니다.**

Windows 로컬 검증에서 발견한 테스트 환경 문제도 수정합니다. `qa-vocabulary-redesign.cjs`의 합성 스크린샷은 고정 `/tmp` 대신 OS 임시 경로로 저장합니다. `test-device-place.cjs`의 history back/go 검사는 임의의 15ms 지연 대신 실제 popstate 완료를 기다립니다. `qa-collection-life.cjs`의 합성 자산 경로 경계는 `root + path.sep`으로 검사하여 Windows에서도 같은 디렉터리 제한을 유지합니다. 기존 화면·경로·기대값·assertion은 유지하고, 제품 UI/API 코드는 바꾸지 않습니다.

```sh
node scripts/test-static-site-build.cjs
node scripts/build-static-site.cjs
```

기본 출력은 `.artifacts/site/`입니다. 재실행은 `node scripts/build-static-site.cjs /새/출력/경로`처럼 존재하지 않는 경로를 지정합니다. 기존 출력은 덮어쓰거나 삭제하지 않습니다. 빌드는 tracked 공개 실행 파일만 복사하고, source의 수정 여부를 검사합니다. `index.html`, 앱 아이콘·manifest·RELEASE_VERSION, `media/`, `inquiries/`, `ops/`가 대상이며 docs/scripts/test/워크플로/숨김 파일·비공개 자료 디렉터리·렌더 결과는 포함하지 않습니다. PDF는 기존 배포 허용 파일 `media/connector-summary.pdf` 하나만 보존합니다. 개인 교재나 사용자 데이터를 추가하지 않습니다. 원본 checkout은 수정하지 않습니다.

공개 파일은 clean Git index에서 LF 기준으로 추출하여 Windows autocrlf에 따른 바이트 차이를 방지합니다. 기존 `build-app-version.cjs`가 복사본에 전체 Git SHA/릴리스/JS·CSS cache key를 기록합니다. `build-manifest.json`은 자기 자신을 제외한 각 공개 파일의 SHA256·바이트 수를 정렬해 담으며 시간값이 없어 같은 commit의 출력 바이트를 재현할 수 있습니다. `app-version.json`·HTML meta·자산의 build query·checksum을 운영 반영 후 함께 대조해야 합니다. artifact에는 호스팅별 API 프록시 설정이 포함되지 않습니다.

| 후보 | 구체적인 다음 조치 | 승인·선행조건 |
|---|---|---|
| 기존 Vercel 유지 | 기존 프로젝트에서 Git 저장소를 새 repo로 변경하고 기존 `vercel.json` build/rewrite/header 사용. 기존 도메인·API 계약 유지 | 프로젝트의 현재 연결·preview/production branch·GitHub app 접근 범위를 먼저 확인하고 저장소 연결 변경을 승인받음. 기존 프로젝트 disconnect/delete 금지 |
| 별도 홈호스팅 | 검증한 artifact를 새 전용 release 디렉터리에 올리고 원자적으로 current 링크 변경. HTTPS 도메인에서 같은 origin의 `/api/v1/` 프록시 제공 | 호스트·별도 경로·공개 도메인·TLS·DNS·API 허용 origin·cookie 정책을 확정하고 변경 승인. 파일 호스트 루트 재사용 금지 |

홈호스팅은 정적 파일만 복사해서 완료되지 않습니다. API 경로는 현재 `https://file-island.duckdns.org/api/v1/`이고 클라이언트는 credentials/cookie, `Authorization`, `X-HanQ-CSRF`, `/api/v1/battle/events` SSE를 사용합니다. 새 프록시는 요청 Origin·인증·CSRF header와 Set-Cookie를 보존하고 upstream 경로를 제거하거나 중복하지 않아야 합니다. 쿠키 Domain/SameSite/Secure 및 API origin 허용 변경이 필요하면 API 담당과 승인 후 진행하며 우회·완화하지 않습니다.

아래는 **미적용 Nginx location 후보**입니다. 별도 HTTPS server의 `root`를 승인한 release 경로로 정하고 기존 운영 설정에 합치기 전 `nginx -t`와 정상/오류 응답 검증이 필요합니다. DNS resolver·TLS 인증서·server_name·방화벽·업스트림 인증 정책과 CA bundle의 실제 경로는 호스트별로 별도 확정합니다. DuckDNS 주소 변경 시 upstream DNS 재해석/재로드 정책도 정합니다.

```nginx
location ^~ /api/v1/ {
    proxy_pass https://file-island.duckdns.org;
    proxy_ssl_server_name on;
    proxy_ssl_name file-island.duckdns.org;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_set_header Host file-island.duckdns.org;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
    proxy_hide_header Cache-Control;
    add_header Cache-Control "private, no-store" always;
}
location = / { add_header Cache-Control "no-store" always; try_files /index.html =404; }
location = /index.html { add_header Cache-Control "no-store" always; }
location = /app-version.json { add_header Cache-Control "no-store" always; }
location = /manifest.webmanifest { add_header Cache-Control "public, max-age=0, must-revalidate" always; }
location = /apple-touch-icon.png { add_header Cache-Control "public, max-age=0, must-revalidate" always; }
location = /favicon.ico { add_header Cache-Control "public, max-age=0, must-revalidate" always; }
location / { add_header Cache-Control "public, max-age=0, must-revalidate" always; try_files $uri $uri/ =404; }
```

전환 검증은 먼저 비로그인 정적 응답/버전/SHA/대표 자산 checksum 및 cache header를 확인한 다음 승인된 테스트 계정으로 login·refresh·logout·CSRF 실패·SSE 연결/중단을 확인합니다. 실사용자 기록이나 교재를 공개 검사 자료로 복사하지 않습니다. 실패 시 이전 release 경로 또는 기존 Vercel 연결로 복귀할 수 있도록 현재 설정과 release를 보존합니다.

이전 CI `https://github.com/hddooo/file-island-web/actions/runs/41431871004`의 최종 결과는 이번 환경의 GitHub connector가 workflow jobs 조회에 HTTP 404를 반환하여 미확인입니다. git clone/fetch/push와 CI 상태 조회의 접근 경계는 다릅니다. 토큰·쿠키 추출이나 권한 확장 없이 별도 승인된 Actions 읽기 경로에서 정확 SHA 결과를 확인해야 합니다. 로컬 검사를 GitHub CI 성공으로 표기하지 않습니다.

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
