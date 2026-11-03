# File Island · 개발·디자인 ChatGPT 작업 인계

이 파일은 새 에이전트가 맡은 작업을 바로 시작하기 위한 실행 입구다. 상세 화면/파일 표·현재 운영·VERSION/RELEASE_VERSION·콘텐츠 추가·147쪽 원문 기준은 [README](README.md), 공통 규칙 원본은 [COLLABORATION](docs/COLLABORATION.md)(hanq-collaboration-2026-11-01-v5)이다. 공통 규칙의 옛 호스트/dev 배포 설명은 README의 현재 홈서버/main 상태와 구분한다.

## 빠른 실행과 버전 확인

Node24를 사용한다. 루트 package.json은 없고 정적 서버는 기존 README의 `python3 -m http.server 8000` 예시를 따른다. 로컬 정적 서버는 API 프록시·로그인/권한을 재현하지 않는다. 아래 명령은 저장소에서 확인한 실행 진입점이며 전체 성공 또는 실기기 검수를 보장하지 않는다.

```sh
npm ci --prefix .ci-tools --no-fund
node scripts/test-app-version-build.cjs
node scripts/test-static-site-build.cjs
node scripts/test-auth-session.cjs
node scripts/test-header-parent-navigation.cjs
```

브라우저 QA는 설치된 Playwright/Chromium/WebKit과 각 harness의 `.test-tools`/NODE_PATH 참조를 먼저 확인한다. [활성 CI](.github/workflows/ci.yml)의 명령·의존성/설치 방법을 기준으로 한다. 검사 선택과 개인 자료 경계는 [scripts README](scripts/README.md)를 따른다. 새 static 출력은 `node scripts/build-static-site.cjs <새 출력 경로>`이며 기존 폴더를 덮어쓰지 않는다. `build-app-version.cjs` 직접 실행은 소스 index를 바꾸므로 격리 빌드에서만 사용한다.

앱 버전 입력은 `RELEASE_VERSION`이고 독립 `VERSION` 파일은 없다. 문서 전용 변경에서는 버전을 올리지 않는다. 릴리스 담당은 CHANGELOG·버전 기록·검증된 태그/전체 SHA를 맞춘다. 실제 운영은 [app-version.json](https://file-island.duckdns.org/app-version.json)의 buildId/release, HTML meta, 배포 artifact와 변경 자산 hash로 확인한다. API987/schema54,056 미적용, 새147 기본 OFF와 API 후보 준비 상태를 FE0.2.10 운영과 혼동하지 않는다.

## 작업 시작과 파일 소유권

1. [README](README.md), [AGENTS](AGENTS.md), [CLAUDE](CLAUDE.md), 해당 설계/버전 기록을 읽는다. 사용자 후속 지시와 실제 코드·검사·운영 상태를 대조한다. 이 파일은 기존 지침을 대체하거나 새 권한을 부여하지 않는다.
2. 저장소 루트에서 아래 명령으로 branch/기준 SHA/작업 흔적을 확인한다. 다른 담당자의 변경·미추적 파일을 보존한다. 별도 feature branch/worktree에서 맡은 파일만 수정한다.

```sh
git status --short
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
```

3. 수정 파일·의존 계약·검사 범위를 통합 담당과 정한다. 같은 화면의 CSS/JS가 다른 파일이어도 host·라우트·공통 선택자를 공유하면 조율한다. 담당자 대화 ID 대신 아래 파일 경계를 지속 기준으로 사용한다.

| 작업 영역 | 우선 소유하는 파일/결정 | 조율이 필요한 경계 |
|---|---|---|
| 한국사 원문·독서 | FE `media/textbook-*`, `media/private-textbook.js`, `scripts/*history*`; API `src/textbook/`과 관련 검사 | 원문 자료 담당과 reader 담당의 세부 파일 분리, source SHA·digest·구판 복구 |
| 영어 | FE `media/toeic-*`, `media/lc-*`, `media/audio-player-ui.*`, 단어/문법 자료와 관련 검사 | API TOEIC 계약·공유 자료/개인 답안, 기출/정답/음원 추가 |
| ADMIN·기록 | FE `media/admin-*`, `media/my-records.js`, `media/hall-of-fame.*`; API 관련 도메인/검사 | 권한·감사·개체 XP·056 release gate; 실제 회원 정보 |
| 장면·디자인 | FE `media/world-*`, `media/island-harbors.*`, `media/*scene*`와 승인된 에셋/검사 | 지도 hit 영역·원화·다른 영역의 공통 header/route/스타일 |
| 인프라·릴리스 | workflow·빌더·승인된 release 설정과 검증 | 실제 runner/배포·DB·자료 mount는 승인 범위와 통합 순서 확인 |
| 문서 인계 | 두 저장소의 `README.md`, `CHATGPT.md` | API 계약/semantic 문서 변경은 해당 담당과 별도 조율 |
| 공통 통합 | `index.html`, `ops/index.html`, `inquiries/index.html`, API client, 공통 CSS, manifest, RELEASE_VERSION, CHANGELOG | 통합 담당 한 명이 변경·main 반영·배포 순서를 조율 |

이 표는 영역별 출발점이며 디렉터리 전체에 대한 독점 권한이 아니다. 실제 착수 시 정확 파일 목록을 나눈다. 디자이너는 한국사 모바일·데스크톱 시안, 디자인 명세, 적용 파일 목록을 먼저 준비하고 구현 담당과 조율한다. 별도 시안 단계가 실제 코드 적용·main 배포를 뜻하지 않는다. 외부 상대에게 메시지를 보내거나 저장소·서비스 권한을 설정하는 행동은 이 문서 작성 범위에 포함되지 않는다.

## 데이터·기능 보존

기존 route·안정 ID·보기/정답·content version·읽음/체크·attempt·중단 workspace·개인 저장 키를 보존한다. 로그인 전환/화면 이탈/늦은 응답·재시도/CAS/멱등 키를 검수한다. XP·HP·부화·장착·정답은 서버가 확정한 계약만 표시하고, 미확인/null을 0이나 성공으로 채우지 않는다. 새 API가 필요하면 요청/응답·권한·오류·fallback·배포 순서를 API 담당과 먼저 맞춘다. 현재056와 새147 판본의 기본 OFF 경계를 디자인 정리로 해제하지 않는다.

비밀번호·토큰·쿠키·DB 접속값·개인정보·회원 답안·교재 원문·비공개 추출물·내부 비공개 지침이나 개인 메모 경로를 공개 문서/로그/프런트에 추가하지 않는다. 합성 fixture와 실제 원본/운영 검증을 구분한다. 콘텐츠 추가·원문 재현은 README의 기존 매뉴얼 링크를 따른다.

## 디자인·모바일·접근성

- 사용자에게 필요 없는 반복 안내/TIP·중복 제목·상시 성공 문구는 화면에서 줄인다. 실제 오류·자료 없음·접근 제한·저장 복구, 출처/권리 고지와 원문 내용은 보존한다. 구현 내부 설명을 제품 화면 안내로 추가하지 않는다.
- 물·파도·구름·안개·배 내부 움직임은 원화·고정 지형·메뉴 hit 영역을 보존하는 독립 레이어/국소 마스크로 자연스럽게 만든다. **전체 배경 이미지나 페이지를 흔들거나 확대/축소하는 것으로 내부 움직임을 대체하지 않는다.** 전체 루프의 이음새·위상·화면 이탈·숨김·로드 실패·축소 모션을 검수한다. 이 항목은 다음 디자인 작업 기준이며 모든 배 장면 구현 완료를 뜻하지 않는다.
- 원본 alpha·실루엣·비율·registration을 먼저 확인한다. 별도 후보로 작업하고 포요몬 머리를 가로로 잘라 회전하는 rig를 재도입하지 않는다. 학습 본문 복사·세로 스크롤·pinch 확대를 보존한다.
- 320/390/1440px와 낮은 가로 화면, 긴 이름/문장/표, safe-area·footer·실제 44px hit를 확인한다. semantic control·label·focus-visible·dialog 닫기/Escape/초점 복귀·뒤로/새로고침·색 외 단서·reduced-motion을 검사한다. 합성 Chromium/WebKit 결과를 실제 iPhone/Safari 확인으로 표시하지 않는다.

## 검수·main 통합·인계 완료

기능 → 회귀 → 모바일/시각의 순서로 변경에 맞는 검사를 수행한다. 문서 전용 변경은 내용·명령·링크·파일 경로 검사로 검증한다. 다른 담당자 코드를 덮어쓰거나 검사를 약화해 통과시키지 않는다. feature push 후 정확 SHA CI 상태를 확인하고 main 병합/배포는 통합 담당과 조율한다. 이 작업자가 독립적으로 main을 바꾸지 않는다. 새 main에 다른 작업이 들어왔으면 재통합·필요 검사 후 진행한다. force push를 사용하지 않는다.

인계에는 목표, 기준/결과 branch·전체 SHA, 실제 변경 파일, 보존 계약, 실행한 명령·결과·자료/브라우저 한계, 정확 SHA CI URL/상태, 운영 domain/version/build SHA/자산 대조, 남은 의존성과 다음 한 단계를 적는다. 구현·검사·push·CI·image 빌드·운영 배포를 구분한다. 실행하지 않은 검사나 미배포 후보를 완료로 쓰지 않는다. 자동 승인/접근 제한으로 차단되면 행동·대상·이유·완료 범위·denied/pending/uncertain을 그대로 전달한다.
