# file-island-web

파일섬(File Island) 프론트엔드 저장소입니다.

기준 소스 스냅샷을 이 저장소로 이관했습니다. 배포 연결과 Secrets 등록은 아직 진행하지 않았습니다.

## 코드 이관

원본: `blockmonkey1992/hanq` / `93190fae4656dad5a2337c9a1173c3a7107d339c`. Git 과거 이력 대신 검증한 소스 스냅샷으로 이관했습니다.

초기 snapshot은 0.2.8-beta입니다. `prep/windows-fe-029`에서 원본 `cfc9892a2a180a33b177a8689bcdfa8f0b5607f7`의 0.2.9-beta delta를 새 저장소에 동기화합니다. 운영 연결은 아직 변경하지 않았습니다.

운영 전환·배포 연결·Secrets 등록은 진행하지 않았습니다. 테스트 전용 CI는 `.github/workflows/ci.yml`에서 GitHub-hosted runner와 `contents: read`만 사용합니다. 원본 workflow는 `.github/workflows-held/*.disabled`에 보존하고 나머지 두 시각 검토 workflow는 계속 비활성입니다.

검증 범위는 [이관 기록](docs/repository-migration.md), 서버 비밀값과 전환 순서는 [API 설정 계획](https://github.com/hddooo/file-island-api/blob/main/docs/secrets-plan.md)을 확인하세요.

## 원본 프로젝트 안내

# HanQ · 파일섬 스터디

한국사·TOEIC 학습과 얼음섬 퀴즈 대결을 제공하는 정적 프런트 저장소다. 현재 전체 기획과 화면 흐름은 이 저장소, 서버 판정·저장·접근 계약은 [hanq_api](https://github.com/blockmonkey1992/hanq_api/tree/dev)가 담당한다.

## 문서

- **두 GPT 공동 작업 기준:** [공통 협업 규칙](docs/COLLABORATION.md) · [실행 에이전트 지침](AGENTS.md) · 규칙 버전 `hanq-collaboration-2026-11-01-v2`

- [전체 기획](docs/design-outline.md)
- [개발 설계](docs/design-development.md)
- [사용자 흐름](docs/design-userflow.md)
- 문서 기준선 v0.1.0: [계획](docs/versions/v0.1.0/plan.md) · [진행](docs/versions/v0.1.0/progress.md) · [결과·통합 대응표](docs/versions/v0.1.0/report.md)

이 문서 표의 v0.1.0은 과거 API 패키지 기준의 문서 묶음이다. 이후 실제 사용자 릴리스는 RELEASE_VERSION·CHANGELOG·Git 태그로 별도 기록하며, 이 checkout의 사용자 표시 버전은 RELEASE_VERSION에 기록하며 실제 운영 반영은 /app-version.json의 전체 SHA로 확인한다. 중복 설명 파일은 현재 문서에 통합했으며 원문은 Git 이력에서 복원할 수 있다. 코드가 읽는 JSON/출처 자료·실행 계약·법적 고지는 제자리에 둔다.

### 버전별 한눈에 보기

| 문서 기준선 | 날짜 | 핵심 변경 | 실제 상태·검증/배포 | 남은 일 |
|---|---|---|---|---|
| v0.1.0 | 2026-10-08~27 | 한국사/TOEIC 학습 → LC·미니모의 → 얼음섬·6섬 지도 | 10/27 기능 배포 검증 완료; 이번 통합은 문서 전용 | 실기기·과거 콘텐츠 감사 후보·다중 인스턴스 검토 |

[계획](docs/versions/v0.1.0/plan.md) · [진행](docs/versions/v0.1.0/progress.md) · [날짜별 이력·결과](docs/versions/v0.1.0/report.md#timeline). 별도 과거 릴리스 태그가 없어 가상의 v0.0.x 폴더를 만들지 않았다. 같은 기준선의 작업은 아래 결과 문서에서 날짜·실제 커밋으로 구분한다.

## 실행과 배포

루트 `index.html`과 `media/`를 Vercel의 Other 프리셋으로 제공한다. 빌드 명령은 `node scripts/build-app-version.cjs`이고 출력은 루트다. RELEASE_VERSION과 전체 Git SHA를 빌드 정보에 연결한다. 기존 `vercel.json`은 `/api/v1`을 API로 전달한다. docs와 로컬 도구는 기존 `.vercelignore` 정책에 따라 배포에서 제외한다. 이번 문서 정리에서 설정은 변경하지 않았다.

로컬 정적 HTTP 서버에서 화면을 열어 검사한다. 관련 기능 검사는 `scripts/test-*.cjs`와 `scripts/qa-*.cjs`를 선택해 실행하며 API 연계 검사는 격리 계정·DB를 사용한다. [스크립트/비공개 자료 경계](scripts/README.md)를 따른다. 단위 검사나 합성 브라우저 검사를 실제 iPhone 성공으로 표시하지 않는다.

## 유지하는 상세 계약과 근거

- [학습 진행](docs/learning-progress-contract.md), [읽음](docs/read-progress-contract.md), [모의회차](docs/run-controller-contract.md), [활동 집계](docs/activity-rank-contract.md)
- [계정 연결](docs/account-backend.md), [인증 CBT](docs/authenticated-cbt.md), [TOEIC 학습](docs/toeic-practice.md), [단어장](docs/toeic-notebook.md)
- [교재 읽기](docs/semantic-textbook.md), [원본 자료 경계](docs/private-textbook-implementation.md), [퀴즈 출처](docs/quiz-catalog-sources.md), [기출 출처](docs/exam-pool-sources.md)
- [캐릭터 에셋 출처](media/characters/README.md), `media/fonts/LICENSE.txt`, [프로젝트 라이선스](LICENSE)

기존 IDs·정답·풀이/체크·개인 기록은 문서 정리로 변경하지 않는다. 자세한 현재 상태와 과거 감사의 미확인 항목은 버전 결과/계획을 확인한다.


## 디자이너 ChatGPT 협업 안내

### 제품과 작업 기준

FILE ISLAND는 로그인한 사용자가 섬을 오가며 한국사와 TOEIC를 공부하고, 학습 기록과 XP로 파트너의 성장을 확인하는 HanQ의 화면 이름이다. 디지바이스 모양의 외곽과 지도·캐릭터는 탐험 분위기를 만들고, 실제 읽기·문제풀이 영역은 어두운 배경과 명확한 정보 계층을 사용한다. 이 저장소는 프레임워크 번들 앱이 아니라 `index.html`과 전역 `window.Hanq…` 모듈을 연결한 HTML/CSS/JavaScript 프런트다. 화면 재설계 시 기존 라우트·문항 ID·저장 계약을 먼저 보존한다.

두 GPT는 먼저 [공통 협업 규칙](docs/COLLABORATION.md)을 따른다. 디자이너는 이 README와 [전체 기획](docs/design-outline.md)을 읽은 뒤, 해당 화면의 JS/CSS와 최신 배포 SHA를 확인한다. 오래된 설계 문서의 날짜별 설명은 현재 운영의 증거가 아니다. 조직(Organization) 이전은 예정이며 현재 저장소·운영 URL을 유지한다. 이 설명서는 협업 자료이며 다른 ChatGPT에 코드·개인 자료를 자동 전송하는 기능이나 권한을 포함하지 않는다.

### 사용자 여정과 라우트

일반 흐름은 계정 진입 → 파일섬 지도 → 지역 선택 → 학습/문제풀이 → 서버 저장 결과 확인 → MyPage/기록으로 이어진다. 브라우저 뒤로 가기·새로고침·직접 링크도 같은 화면으로 복원되어야 한다. URL hash를 읽고 화면을 여는 코드는 `index.html`의 `openToeic`, `openAccount`, `openRainbow`, `openBattle`, `openHall`, `popstate` 처리에 모여 있다.

| 지역·화면 | 현재 진입 경로 | 주요 역할과 코드 |
|---|---|---|
| 파일섬 지도 | `#subjects` | 6개 목적지, `media/world-map.js`, `world-map.css`, `world-scene.js` |
| 역사숲 | `#history` | 시대/챕터 학습 진입, `index.html`, `media/island-harbors.js` |
| 한국사 챕터 | `#chapter/<id>/<step>` | 안정 ID 기반 학습 단계. 실제 step 값은 `index.html`의 `stepSlugs` 확인 |
| 복습·시험·오답 | `#formal-exams`, `#past-exams`, `#wrongnotes`, `#run/<id>` | 기존 경로·답안·회차 보존. `formal-exams.js`, `cbt-wrong-notebook.js` 등 |
| 영어섬 | `#toeic` / `#toeic/map` | Vocabulary / Grammar / Listening / Practice 네 정박지 |
| Vocabulary | `#toeic/notebook` | 행 목록 단어장, 계정별 체크, 체크 PDF, 최근 단어 ticker |
| Grammar | `#toeic/grammar` | 현재 3개 집중 노트. 예전 챕터 링크는 resolver/alias를 거침 |
| 문법 연습 | `#toeic/grammar-practice/<bank>/<number>` | 문항별 이동, 노트/문제로 복귀. 임의 bank·번호 생성 금지 |
| Listening | `#toeic/player` | 재생목록·음원·대본. 전용 엔진과 재생 UI 분리 |
| Practice | `#toeic/wrongnotes` | 표시 이름과 레거시 경로가 다름. 파트별 실전 문제, `toeic-practice.js` |
| TOEIC 문제 화면 | `#toeic-cbt/...` | 기존 CBT 경로, `toeic-cbt.js` |
| 행복의 마을 Beta | `#rainbow` | 장면·알 상점·옷/스킨 준비 중·보관함 연결, `rainbow-island.js` |
| 얼음섬 | `#battle`, `#battle/history/<id>` | 대기실·대전·서버 판정·복기, `battle-island.js` |
| MyPage | `#account` / `#account/<sub>` | 로그인/계정·출석·파트너·보관함·내 기록, `account-ui.js`, `characters.js`, `my-records.js` |
| 명예의 전당 | `#hall-of-fame` | 순위·XP·내 최근 풀이, `hall-of-fame.js` |
| 문의 | `/inquiries/` | 별도 HTML 진입, `inquiries/index.html`, `portal-ui.js` |
| 관리자 | `/ops/` | 관리자 권한이 필요한 별도 진입. `ops/index.html`, `portal-ui.js`, `admin-dashboard.js`, `admin-xp.js` |

지도에서의 사용자 명칭과 코드의 legacy 이름(`rainbow`, `wrongnotes`)은 다를 수 있다. 표시 이름 변경을 이유로 라우트나 저장 키를 바꾸지 않는다. 로그인 필요 여부와 접근 권한은 기존 가드를 유지한다.

### 영어 학습 화면의 정보 계층

- **Vocabulary:** `media/toeic-notes.js`, `toeic-notes.css`, `vocabulary-reading.css`가 화면을 구성한다. `vocabulary-chapters-v1.json`, `toeic-supplement.js`, `vocabulary-paraphrases.js`는 단어·보완 설명 자료이며 UI와 분리해 확인한다. 현재 정적 분할 검사는 157개를 50/50/50/7로 확인한다. 사용자 API 자료 전체가 항상 이 개수라는 뜻은 아니다. 첫 항목은 체크한 단어 보기이며 검색·단어장 전용 AI 미니모의 진입은 제거된 상태다. 삭제된 전용 문제를 복원하거나 공식 교재 문제와 혼합하지 않는다. 과거 attempt 기록은 유지한다.
- **PDF:** `vocabulary-print.js`, `vocabulary-print.css`가 선택 항목과 뜻 가리기를 출력에 반영한다. 화면의 단어/예문/뜻이 어느 항목에 속하는지 인쇄에서도 유지한다. 브라우저 인쇄 팝업과 PDF 생성 검증을 물리 프린터 검증으로 표현하지 않는다.
- **Grammar:** `toeic-grammar.js/.css`, `toeic-grammar-data.js`; 현재 활성 ID는 `adjectives-adverbs`, `clauses-connectors`, `word-forms`다. 대명사 자료는 `archivedChapters`에 남아 있고 비교 학습은 현행 자료로 이어진다. `routeAliases`, `topicRedirects`, 기존 연습 bank와 완료 체크를 보존한다.
- **Listening:** `lc-player.js`, `toeic-audio.js/.css`, `audio-player-ui.js/.css`를 함께 확인한다. 선택 곡·재생 상태·대본과 오디오 요소 수명을 분리한다. 자동재생·잠금 화면·백그라운드 재생의 모바일 성공 여부는 실기기로 별도 확인한다.
- **Practice:** `toeic-practice.js/.css`, `toeic-cbt.js/.css`. 현재 메뉴 제목은 TOEIC Practice이고 전투 오답 탭은 이 화면에서 제거되어 있다. 기존 전투 복기·개별 문제 기록·서버 데이터는 별도 보존한다. 지문 묶음, 보기에 대한 정답 공개 시점, 실제 출처 구분은 디자인 변경 범위에서도 유지한다.

### 컴포넌트와 수정 위치

| 수정하려는 부분 | 먼저 읽을 파일 | 보존할 경계 |
|---|---|---|
| 앱 구조·라우팅·화면 제목 | `index.html` | hash, `history.state`, 복귀·로그인 흐름 |
| 공통 색과 기본 컨트롤 | `media/terminal-theme.css`, `index.html`의 기본 style | 전역 선택자와 `!important`가 다른 화면까지 적용됨 |
| 기기 외곽·상단 모델/버전·하단 버튼 | `device-shell.js/.css`, `device-buttons.css` | 안전영역, 고정 메뉴, 실제 읽기 영역의 스크롤 |
| 지도 지형·이름표·정박지 | `world-map.js/.css`, `world-scene.js`, `island-harbors.js/.css` | 원본 지형 mask/hit 영역, 모바일 첫 탭, 키보드 진입 |
| 장면 전환·학습 패널 연출 | `adventure.js`, `study-presentation.js/.css` | 이탈 정리, focus 복귀, 실제 audio 요소 복제 금지 |
| 단어장 읽기·체크·ticker | `toeic-notes.js/.css`, `vocabulary-reading.css` | `#toeicNotesHost.tn`에 범위 제한, `[hidden]`, 계정별 체크 |
| 개인 화면·파트너 | `account-ui.js/.css`, `characters.js`, `rainbow-island.js/.css` | API의 owner·revision·장착 개체·XP를 표시 기준으로 사용 |
| 내 기록 상세 | `my-records.js`와 `account-ui.css`의 `.mr-*` | modal/뒤로 가기, 초점, 필터·페이지·KST, 실데이터 구분 |
| 순위·시상대 | `hall-of-fame.js/.css` | 순위·XP의 서버 응답, 다른 회원 정보 공개 범위 |
| 전투·효과·연결 상태 | `battle-island.js/.css`, `battle-visual.css`, `battle-impact.css`, `battle-connection.js/.css`, `battle-materials.js/.css` | 정답·피해·HP·보상·타이머를 클라이언트 연출로 판정하지 않음 |
| 보유 캐릭터 모션 | `collection-life.js/.css`, `character-actions.js/.css`, `battle-collection-visuals.js/.css` | 원본 등록 좌표, pose 전환, 숨김/축소 모션, 로드 실패 fallback |
| 관리자 대시보드 | `ops/index.html`, `admin-dashboard.js/.css`, `portal-ui.js`, `admin-xp.js` | 관리자 권한과 API 계약, 확인 후 쓰기·감사 기록 |

위 경로는 `media/` 기준이다. 별도 HTML 진입 파일만 예외다. 파일이 여러 번 덧씌워지는 기존 CSS 구조이므로 새 전역 reset이나 범용 `div`, `span`, `button` 규칙을 추가하기 전에 최종 computed style을 확인한다. 새 버튼·표·모달은 해당 화면 host/class 아래에 제한한다.

### 색·글꼴·간격·반응형

현재 코드에 단일 디자인 토큰 패키지는 없다. 다음 값은 실제 구현의 출발점이며, 전 화면이 동일한 토큰만 사용한다는 뜻은 아니다.

| 용도 | 실제 값/위치 |
|---|---|
| 기본 터미널 배경/본문/구분선 | `#050706` / `#f4f7f5` / `#354c3d`, `terminal-theme.css` |
| 초록 강조/오류 강조 | `#72ef9d` / `#ff938b`; 색만으로 정오답·연결 상태를 전달하지 않음 |
| 기기 외곽 | `--device-shell:#b9c9c6`, `--device-light:#eff5ec`, `--device-shadow:#4c666e`, `--device-rubber:#172c36` |
| 역사숲 외곽 변형 | `body[data-island=history]`의 `--device-*` 재정의 |
| 단어장 패널/표제어/본문 | `--vr-panel:#0c1712`, `--vr-word:#8ef0b0`, `--vr-body:#e2eae1`, `vocabulary-reading.css` |
| 단어장 한국어 읽기 글꼴 | Apple SD Gothic Neo → Noto Sans KR → Malgun Gothic → 시스템 sans-serif |
| 단어장 영어 읽기 글꼴 | Arial → Helvetica → 한국어 fallback |

기기·게임 문맥에는 픽셀/모노 계열 규칙이 있고 본문 읽기에는 별도 예외가 있다. 글꼴의 실제 최종 적용은 해당 CSS와 computed style을 기준으로 한다. 자기 호스팅 글꼴과 `media/fonts/LICENSE.txt`의 고지를 유지하며 공식 디지몬 글꼴이라고 표현하지 않는다.

학습 목록의 간격은 `toeic-design-tokens.css`의 48px 기준 행과 8px gap을 따른다. 제목·개수는 같은 행 안에서 인접하게 묶고 헤더·본문의 좌우 경계를 맞춘다. 긴 학습 본문은 필요한 스크롤과 기존 읽기 패널을 유지한다. 기기 desktop 최대 폭은 1180px이고 기본 padding은 `12px 24px 32px`이다. 새 공통 spacing 체계를 도입하려면 기존 밀도와 PDF를 먼저 비교하고 일괄 치환을 별도 작업으로 검토한다.

주요 반응형 분기는 700px 이하, 1000px 이하의 coarse pointer, 높이 500px 이하 가로 화면이며 화면마다 추가 분기가 있다. 모바일 기기 외곽은 safe-area inset을 포함하고 고정 하단 메뉴는 읽기 영역 밖에 둔다. 작은 입력은 기본 테마의 600px 이하 규칙에서 16px, 버튼은 최소 44px 규칙을 확인한다. 실제 검수 폭은 최소 320/390/1440px이고 낮은 가로 화면도 확인한다. 프레임을 `transform`해서 고정 메뉴의 기준을 바꾸거나 지도/표/모달 하단을 잘라내지 않는다.

### 접근성과 모션

버튼·링크·입력의 의미, `aria-current`, `aria-pressed`, 상태용 `role=status/alert`, 명명된 dialog를 보존한다. hover에만 기능을 숨기지 않고 keyboard focus와 touch에서도 진입 가능해야 한다. dialog는 Escape/닫기/뒤로 가기 후 원래 초점과 스크롤로 돌아가야 한다. `hidden` 요소를 광범위한 display 규칙으로 되살리지 않는다.

`prefers-reduced-motion:reduce`에서는 캐릭터 이동·깜빡임·ticker·전환을 각 모듈의 기존 방식으로 멈추거나 단순화한다. 캐릭터 모션은 문서 숨김·화면 이탈·전투 pose와도 연결된다. CSS animation을 추가할 때 이 수명 조건을 함께 처리한다. 색상 대비·읽기 순서·확대 시 잘림·터치 목표는 실제 화면에서 확인하며 접근성 인증을 받았다고 주장하지 않는다.

### 에셋과 캐릭터 작업 규칙

- 지도·배경은 `media/world-art/`와 지도 관련 `media/world-map-*`, 캐릭터는 `media/characters/`, 글꼴은 `media/fonts/`에 있다. 출처·생성 프롬프트·등록 정보는 각 README, manifest, `*.registration.json`, `docs/versions/v0.1.0/*art*.json` 등을 확인한다.
- PNG/WebP의 투명도와 실제 실루엣을 밝은/어두운/체커 배경에서 확인한다. 검은 미리보기 배경을 이미지의 검은 사각형으로 오해하거나 alpha를 제거하지 않는다. 원본을 보지 않고 sprite cell·기준선·발 위치를 추정하지 않는다.
- `collection-atlas-v1.webp`는 승인된 정적 원본이다. registration의 sourceOrigin·backgroundPosition·isolation으로 다른 개체의 픽셀이 들어오지 않게 한다. 프레임을 동일 격자로 가정하지 않는다. 파닥몬 hover는 별도의 6프레임 registration을 사용한다.
- `collection-life.js/.css`는 원본 레이어와 mask를 움직이는 표시 전용 rig다. 애니메이션이 stage·XP·피해 판정을 바꾸면 안 된다. 전투의 charge/hurt/defeat pose와 idle의 우선순위를 보존한다.
- 푸니몬 더듬이는 기존 `.cm-feeler` 레이어를 사용한다. **포요몬은 더듬이와 머리 사이를 잘라 회전시키지 않는다.** 과거 머리 절단선 문제를 막기 위해 하나의 연속된 실루엣에 미세한 breathe/sway만 적용한다.
- v0.1.1의 `collection-blink-overlay-v1.png`는 원본 전체를 대체하는 아틀라스가 아니다. `eyelids()`가 푸니몬·포요몬 눈 주변 네 영역만 사용한다. 몸체·입·더듬이는 원본을 유지하고, 각 instance의 깜빡임 주기·위상을 분리한다. overlay 해독 전/실패 시 열린 눈을 유지한다. 측정 좌표와 생성 프롬프트는 [등록 기록](docs/versions/v0.1.0/collection-blink-art-20261101.json)에 있다.
- 래스터 편집은 원본을 보존한 별도 후보로 만들고 이미지 편집 도구를 사용한다. 코드로 만든 임의 눈·형태가 원본과 다르면 적용하지 않는다. 이름만 같은 다른 캐릭터를 새 디자인으로 대체하지 않는다. 160~200px 실제 크기와 480px 확대, 모바일·reduced-motion을 모두 검수한다.
- 팬 이미지·AI 생성 에셋과 글꼴의 기존 라이선스/출처 설명을 보존한다. 공식 라이선스 자산이라고 승격하지 않는다. 비공개 교재 원문·개인 학습 이미지·인증정보를 공개 에셋 폴더에 넣지 않는다.

### 백엔드 의존성과 운영/후보 구분

브라우저 UI와 서버의 저장·판정은 별도다. `/api/v1`은 `vercel.json`의 기존 rewrite를 통해 API로 연결되고, 클라이언트 계약은 `media/api-client.js`, 서버 기준은 [hanq_api](https://github.com/blockmonkey1992/hanq_api/tree/dev)다. 디자인 목업의 예시 숫자를 실제 회원 기록으로 저장하거나 API 미배포를 성공 상태로 표시하지 않는다.

이전 운영 프런트 v0.1.1의 기능 배포 커밋은 `61dff2b121886d514c97063a7de0ea4b8fd8c291`이다. 실제 실행 중 SHA는 항상 `/app-version.json`과 HTML meta로 확인한다. 이 릴리스는 캐릭터 표시·영어 검사 보완이며 새 API/DB 배포를 포함하지 않는다. 기존 owner-confirmed collection capability 가드는 유지된다. 알 구매·부화·장착 등 쓰기는 서버가 확정한 collection 응답이 있을 때만 활성화한다. 옷/스킨의 준비 중 안내를 실제 판매·장착 기능으로 꾸미지 않는다.

다음은 다른 후보 브랜치에서 준비된 기능이며 **이 릴리스가 운영 완료를 뜻하지 않는다**: 관리자 개별 보유 몬스터 XP 조정, 전투당 1건 집계와 10건 페이지 기록, 다른 회원 프로필의 최근 로그인/활동·개별 XP, 제공된 비공개 Test3 자료의 사용자 연결과 저장. 현재 운영 `admin-xp.js`는 기존 총 XP 조정 UI이며 새로운 개별 파트너 선택 화면으로 문서화하지 않는다. 현재 명예의 전당의 내 최근 풀이 팝업을 모든 회원의 공개 프로필로 설명하지 않는다. API migration/운영 검증이 필요한 후보는 부모 작업에서 별도로 조율한다.

로그인 복원·체크·문제풀이·전투·출석·XP·보관함은 각 기능의 저장 계약을 따른다. 오류/미확인/null을 0 또는 성공으로 채우지 않고, 계정 전환 후 늦은 응답을 버린다. 실제 회원의 XP·풀이 기록으로 디자인 QA를 하지 않는다.

### 실행·검증·배포

일반 npm build가 필요한 구조가 아니다. 저장소 루트에서 정적 서버를 열 수 있다.

```sh
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 열기. 서버 종료는 Ctrl-C.
```

위 명령은 표준 Python 정적 서버 실행 예시다. 로컬 정적 서버는 Vercel rewrite나 실제 API 권한을 재현하지 않는다. 인증이 필요한 테스트는 기존 합성 harness를 사용한다. 이 저장소에는 해당 브라우저 도구를 설치하는 공통 package.json이 없으므로 의존성 설치 명령을 추정하지 않는다.

이 릴리스에서 실제 실행한 의존성 없는 검사 예시는 다음과 같다.

```sh
node scripts/test-grammar-quick-recall.cjs
node scripts/test-focused-grammar-content.cjs
node scripts/test-vocabulary-paraphrases.cjs
node scripts/test-vocabulary-repartition.cjs
node scripts/test-toeic-practice.cjs
node scripts/test-toeic-recall.cjs
node scripts/test-frontend-release-lock.cjs
node scripts/test-auth-session.cjs
node scripts/test-auth-restoration.cjs
node scripts/test-remember-session.cjs
```

`test-focused-grammar-content.cjs`와 `test-vocabulary-paraphrases.cjs`는 비교용 Git 이력도 읽는다. CI는 이 때문에 checkout의 `fetch-depth:0`을 사용한다. 개인 audit fixture가 없으면 그 부분을 검증했다고 보고하지 않는다.

브라우저 검사는 사용 가능한 `playwright`와 설치된 Chrome/WebKit runtime이 필요하고, 캐릭터 정적 검사는 `jsdom`을 사용한다. 의존성이 준비된 환경에서 저장소 루트 기준으로 실행한다.

```sh
node scripts/test-collection-life.cjs
node scripts/qa-baby-blink.cjs
node scripts/qa-poyomon-seam.cjs
node scripts/qa-collection-life.cjs
node scripts/qa-vocabulary-redesign.cjs
```

각 QA 파일의 `ARTIFACT_DIR` 등 지원 옵션을 소스에서 확인한다. 단어장 redesign harness는 합성 API·합성 단어와 현재 RELEASE_VERSION을 주입한다. 실제 배포 버전은 운영 meta와 /app-version.json을 별도로 확인한다. 모의 API 저장 성공과 운영 계정 저장 성공을 혼동하지 않는다. Chrome/WebKit 320/390/1440px 결과를 실제 Safari/iPhone 결과로 표시하지 않는다.

Vercel은 `vercel.json`의 `buildCommand: node scripts/build-app-version.cjs`, `outputDirectory: .`를 사용한다. 빌드 도구는 `RELEASE_VERSION`과 전체 Git SHA를 읽어 HTML meta, media JS/CSS의 build query, `app-version.json`을 생성한다. 따라서 “빌드 명령 없음”으로 안내하면 안 된다. 이 스크립트를 직접 실행하면 checkout의 index.html을 수정하므로 배포 빌드나 별도 깨끗한 복사본에서 사용하고 생성 결과를 무심코 소스 커밋에 섞지 않는다. `.vercelignore`의 docs/로컬 도구 제외 정책을 유지한다.

배포 순서는 변경 검토 → 관련 단위/합성 브라우저 검사 → 검토 브랜치 push → 정확 SHA의 `.github/workflows/ci.yml` 성공 → 기존 운영 dev에 정상 fast-forward → Vercel 성공 상태 → 운영 `/app-version.json`·HTML meta·실제 자산 SHA-256 일치 확인이다. dev에 다른 작업이 들어왔으면 보존하고 다시 통합·검증한다. force push나 실제 사용자 데이터를 이용한 smoke test는 하지 않는다.

### 버전과 협업 완료 기준

사용자 표시 버전의 기준은 `RELEASE_VERSION`이다. 이 checkout의 기계용 버전은 `0.2.10-beta` (서비스 표시 `v0.2.10 - Beta`)이며 [변경 이력](CHANGELOG.md)을 함께 갱신한다. 기존 정책에 따라 호환 기능은 minor, 오류 수정은 patch, 비호환 변경은 major를 올리고 실제 배포 커밋에 태그를 연결한다. 문서 기준선 `docs/versions/v0.1.0/`과 현재 사용자 릴리스 번호는 같은 개념이 아니다. 날짜·commit·검사·운영 반영을 구분하며 예정 기능을 완료로 기록하지 않는다.

디자이너 변경 제안에는 대상 화면/라우트, 사용자 목적, desktop·mobile·축소 모션 모습, 바꿀 JS/CSS/에셋, 유지할 저장·접근 계약을 적는다. 구현자는 작은 범위부터 적용하고 다음을 확인한다.

- 기능: 메뉴·뒤로 가기·새로고침·로그인 복귀·체크/뜻 가리기·PDF·빈 상태/오류 상태.
- 회귀: 기존 ID/답안/체크/attempt 보존, 계정 전환 경계, 서버 capability·권한, 로드 실패 fallback.
- 시각: 320/390/1440px, 낮은 가로 화면, 긴 한국어/영어, 480px 캐릭터, 투명 배경과 머리 연결부.
- 접근: keyboard·focus 복귀·dialog·상태 문구·버튼 크기·색 외 단서·reduced-motion.
- 전달: 실제 바뀐 파일, 실행한 검사와 한계, 전체 SHA/버전, CI와 운영 반영 여부. 목업·검토 브랜치·운영 완료를 분리한다.

저장 규칙·보상·인증·CORS·접근 권한·데이터 삭제는 시각 변경에 포함시키지 않는다. 새 백엔드 계약이 필요하면 그 의존성을 명시한 뒤 기존 운영에서는 준비 중/미지원 상태를 정확히 표시한다.


### 0.2.1-beta의 공통 UI 기준

- `media/toeic-design-tokens.css`가 읽기 폰트·목록 행 높이·간격·크기를 공유하고 `toeic-learning.css`가 Vocabulary/Grammar/Practice에 적용한다. 글꼴은 기존 IMG_0742 참고 규칙과 vocabulary/connector 인쇄 CSS의 Arial/Helvetica + 시스템 한국어 sans-serif를 재사용한다. 출판사 원본 폰트나 새 다운로드 폰트라고 주장하지 않는다.
- 기기 외곽·File Island 브랜드·섬 지도·페이지 이름·외부 메뉴는 기존 FileIslandMenu(Neo둥근모)를 유지한다. `.tn`, `.tg`, `.tc`, `.tp`, 단어 팝업과 LC 대본 안의 단어/뜻/문제/보기/해설/문법 본문/표/학습 컨트롤은 읽기 폰트를 사용한다. Vocabulary/connector PDF도 같은 token을 import한다. 모호한 내부 제목은 가독성을 우선한다.
- 세 학습 목록은 공통 48px 기준 행과 8px 간격을 사용하고 긴 제목은 잘라내지 않고 필요한 만큼 늘어난다. Grammar의 본문·공유 자료·완료 체크·연습/이어풀기와 Practice의 기존 문제·개인 기록은 유지한다. 문법 목록의 긴 설명은 버튼 접근성 이름/title로 보존하고 시각적으로는 제목과 연습 진입을 남긴다.
- 단어장 목차에는 맨 앞 체크 행과 Chapter 행만 둔다. 독립 전체 단어 진입과 상단 전체 PDF 버튼은 없다. 학습 중 체크 필터를 해제하는 ‘전체 보기’는 남긴다. 각 행의 PDF 문서 아이콘은 배경 없이 표시하고 체크 0개면 체크 PDF를 비활성화한다. 클릭은 행 학습으로 전파하지 않는다.
- 최근 단어는 36px(터치 40px) 검정 한 줄 바로, 제목 줄/일시정지 버튼 없이 천천히 왼쪽으로 반복된다. 동일한 두 그룹으로 이음새를 맞추며 hover/focus/터치 읽기에서는 멈춘다. reduced-motion에서는 정적 가로 목록이다. 단어는 현재 route/Chapter/체크를 바꾸지 않는 뜻 dialog를 열고 닫기/Escape/바깥 클릭/초점 복귀/BackForward/계정 교체/이탈을 처리한다.
- 지도 이름표는 텍스트에 맞추고 바깥의 큰 터치 영역을 유지한다. `island-harbors.js/.css`는 viewport와 원화 비율, waypoint 위치로 카메라와 이름표 위치를 계산한다. 장식 가장자리는 카메라에서 잘릴 수 있지만 주요 waypoint·버튼·이름표는 프레임 안에서 검수한다. 학습 본문의 필요한 세로 스크롤은 막지 않는다. 하단 설명/TIP은 공간을 차지하지 않으며 manifest·브라우저 설치 기능은 유지한다.
- 상단은 작은 한 줄 `XP : 250 (1,500)` 형식이다. 앞 값은 owner-confirmed collection의 실제 장착 디지몬 points, 노란 괄호 값은 계정 총 XP다. 장착 XP 계약이 없으면 `—`를 사용하며 0이나 총 XP를 대신 넣지 않는다. 현재 개체의 `partners` 계약이 확인되면 성장 영역은 그 개체의 실제 points를 ‘성장 XP’로 표시한다. 개체 계약이 없으면 기존 막대를 ‘계정 성장 기준’으로 명시하며 계정 XP를 개체 XP라고 바꾸어 부르지 않는다. Coin은 별도 단위다.
- `game-interaction.css/.js`는 지도·캐릭터·게임 장식·명예의 전당/게임 버튼에만 선택/이미지 드래그를 제한한다. 입력·textarea·contenteditable·학습 본문 복사는 유지한다. 컨트롤의 `touch-action:manipulation`은 double-tap 확대를 억제하면서 pan/pinch를 허용한다. viewport 확대 제한이나 전역 touchend 취소를 사용하지 않는다. 실제 iPhone/Android 제스처 검증을 데스크톱 WebKit/Chrome 검사로 대체해 주장하지 않는다.
- 전투 알림의 문서 이탈은 `pagehide`에서 진행 중 조회·presence/SSE·예약 재연결을 정리하고 `pageshow`에서 세션 확인 후 한 번 재시작한다. 이전 계정/문서 세대의 수락/거절 응답은 새 UI나 이동을 바꾸지 않는다. 이미 보낸 쓰기를 자동 재전송하지 않고 실제 서버 오류의 복구 경로를 유지한다. 원래 WebKit access-control 오류는 실제 후보 이미지+정확 FE core-ui에서 별도로 재검증한다.

추가 검사는 `qa-vocabulary-video-bar.cjs`, `qa-toeic-compact-ui.cjs`, `qa-map-shell-polish.cjs`, `test-xp-label-separation.cjs`, `test-battle-navigation-lifecycle.cjs`, `test-battle-invite-owner-races.cjs`다. 모두 scripts 아래 있으며 합성 데이터만 사용한다. CI의 compact-ui-regression job이 의존성 설치·단위·Chrome/WebKit 검사를 실행한다. 검토 브랜치·CI 성공·운영 반영은 각각 구분한다.

로그인에 따른 지도·하단 메뉴 레이아웃은 `media/adventure.js`가 `HanqApi.state().signedIn`으로 판별한다. 로그아웃 등 특정 버튼 DOM의 존재로 로그인 여부를 추정하지 않는다. 마을의 viewport/flex 높이는 `media/rainbow-island.css`, 회귀 검사는 `scripts/qa-rainbow-viewport.cjs`에서 관리한다.

전체 지도는 섬 원화의 전체 가로 폭과 비율을 유지한다. 긴 모바일 화면에서는 원래 크기의 섬들을 바다 안에 세로 배치하고 프레임과 하단 메뉴를 visualViewport 높이에 맞춘다. 남은 세로 높이를 맞추려고 지도 가로 폭까지 축소하지 않는다. 낮은 가로 화면에서는 기존 화면 안의 필요한 스크롤을 허용하고 섬을 잘라 숨기지 않는다. 전체 지도 기기 프레임은 원화 아래 빈 검정 행 없이 끝나며 모바일 메뉴는 기기에 이어진다. `scripts/qa-ui-final-review.cjs`는 320/390/768/1024/1440의 화면별 정렬·행간·전체 지도·작은 XP·네이티브 지도 클릭을 검수한다.

행복의 마을 장식 NPC는 기존 6종 자산의 12마리를 서로 다른 놀이 무리·크기·타이밍으로 배치한다. 실제 소유 디지몬 수나 사용자 collection 데이터로 취급하지 않는다. 퍼펫몬은 72초의 가시 왕복 순환을 사용하며 opacity 숨김/시작점 순간 복귀를 하지 않는다. 기차는 별도의 기존 레일 동작이다. 위치/너비는 resize 때 측정하고 아기 이동 frame에서는 캐시한 node/너비를 재사용한다. `test-rainbow-patrol.cjs`와 `qa-village-nursery.cjs`에서 방향·루프·가게 hitbox·대사·축소 모션을 검수한다.

상단 프로필은 실제 닉네임과 장착/총 XP를 불투명한 글자로 표시한다. 긴 이름·큰 숫자는 글자를 줄이거나 숨기지 않고 필요한 만큼 감싸며, 버튼과 전체 값의 접근성 이름을 보존한다. Vocabulary·Grammar/연습·Practice·한국사 학습 상세의 부모 이동은 현재 활성 화면의 기존 목차/뒤로 handler를 헤더가 재사용한다. 같은 동작의 내부 버튼만 감추고, 파트/문제·묶음 선택·필터·이전/다음 학습 기능과 목적지가 다른 메인 바로가기는 유지한다. Account/Battle/진행 중 모의고사 등 이번에 동선을 대조하지 않은 화면은 정리 대상이 아니다. 학습지도·MyPage·Hall·마을의 전체 지도는 기존 파일섬 전체 지도로 이동하며, 전체 지도 자체에서는 같은 목적지 버튼을 감춘다.

최상단 `.topline.device-crown` 하나가 Global Nav Bar다. `device-shell.js`는 기존 헤더에 기기 표시를 합치고 독립된 두 번째 헤더를 만들지 않는다. 폭이 실제 프로필보다 좁을 때만 같은 바 안에서 프로필을 오른쪽 둘째 행으로 옮긴다. `device-shell.css`의 단일 바 규칙은 최소 44px의 실제 버튼과 기존 파트너 모션을 유지한다. 제작자 줄은 제거하고 상하 6px 여백으로 각 행/전체 두 행 묶음을 세로 가운데에 놓는다. 주요 글자는 모바일 12~14px·desktop 13~14px이고 버전은 9px이다. 정상 1행은 60px, 좁은 2행은 108px이므로 기존 56/58px 높이를 유지한다고 설명하지 않는다. 프로필이 보이면 오른쪽 순수 장식, 이동 버튼이 보이면 왼쪽 장식을 감춰 내용과의 겹침을 없앤다. 서비스 Beta는 버전에만 표시하며 행복의 마을 타일·제목에는 붙이지 않는다. 마을 알은 구매/부화 상태를 바꾸지 않는 비동기 CSS 흔들림과 빛만 사용하고 reduced-motion에서는 정지한다.

Grammar 집중 연습은 현재 문제·보기·해설·이전/다음과 진행번호가 중심이다. 출처는 접힌 상세에 남기고, 성공·최근 이력·결과 대시보드는 상시 노출하지 않는다. 자동저장·첫 결과·재풀이 이력은 `weakness-records.js`에 보존되며 실제 오류일 때만 복구 버튼을 제공한다. 전체 연습 진입은 본인/은행별 마지막 위치를 사용하고 명시한 문제 URL은 그대로 존중한다. Practice 완료는 고유 `(collectionId, number)`의 실제 `practiceReviewed`가 모두 확인됐을 때만 우측 체크·테두리로 표현한다. LC/RC 자료의 운영 등록 여부나 새 backend 기능 활성화를 이 UI 릴리스와 혼동하지 않는다.

알 상점의 상품 소개는 최초 부화 친구와 진화 계열을 구분한다. 표시 능력치 HP 113 / ATK 23 / DEF 11은 `hanq_api/src/battle/rules.ts`의 `forms[2]` 및 collection 전투 profile이 사용하는 성장기 기본값이며 현재 소유 개체의 강화/성장 수치가 아니다. 서버 밸런스 변경 시 이 표시도 함께 대조한다. 현재 성장 XP·장착·남은 진화 XP는 보관함에서 확인한다. `qa-phone-viewport-shop.cjs`는 전체 가시 화면 끝·safe-area·주소창 높이 변화·원화 비율·상품 정보와 보유 상태를 합성 데이터로 검증한다. 실물 iPhone 검증을 대신한다고 주장하지 않는다.


### 0.2.6-beta 지도·헤더 보완

- 세로 모바일은 원본 여섯 섬의 전체 폭·비율·기존 배치·클릭 contour를 유지하고, 별도 `world-map-portrait-sea-v1.png` 파생 배경을 비반복·비미러링·비율 보존 cover로 표시한다. 원본 mobile/wide PNG는 수정하지 않는다. 이 파생 그림은 원본 배경 그대로의 복원이 아니다.
- native 지도는 정지·hover·키보드 focus 모두 원본 배경 한 장의 지형을 그대로 그린다. 검은 polygon 틈을 노출하던 native 지형 lift/inverse-hole은 사용하지 않으며 라벨 hover/focus·원본 contour 클릭과 개별 Digimon 애니메이션은 유지한다.
- 헤더는 왼쪽 명시 경로의 뒤로/전체 지도, 정확 중앙 FILE ISLAND·버전, 오른쪽 실제 프로필이다. 36px 시각 버튼의 44px 클릭 범위, 11px 이상 XP와 노란 총 XP, 전체 닉네임의 title/접근성 이름을 유지한다. fitting 1행 높이는 58px 이내, 폭이 부족한 2행은 98px 이내로 별도 검사한다. 숫자를 숨기거나 폰트 축소로 강제로 맞추지 않는다.
- `#173640` 84% 배경 alpha만 사용하며 글자는 불투명하다. 가장 밝은 금속과 bevel 위 계산 대비는 ivory 6.60:1, 노란 총 XP 5.06:1이다. `ResizeObserver`는 rAF로 측정/클래스 변경을 모으고 같은 상태를 다시 쓰지 않으며 헤더 교체/pagehide에서 취소한다.
- `test-map-header-visuals.cjs`와 `qa-map-header-visuals.cjs`는 합성 API만 사용한다. 원본 PNG 해시, native 정적 전체-frame exact 비교, hover/focus 전체 화면, 큰 XP·긴 이름, 355↔390 반복 resize와 추가 8프레임 안정성, 320/355/390/591/613/1024 Chromium/WebKit을 검사한다. 실제 iPhone 검증과 CI 합성 검증은 구분한다. scripts/docs/evidence/도구와 `.github` 진단 workflow는 운영 정적 출력에서 제외한다.


### 0.2.7-beta 가벼운 헤더·대본 표시

- 프로필과 이동 버튼은 기본 상태에 패널·테두리·베벨·장식 stripe가 없다. 아바타/실제 닉네임/장착·총 XP와 접힌 지도 또는 뒤로 선 아이콘을 밝은 금속 헤더에 통합하며 hover/focus/pressed만 얇은 반투명 표면을 사용한다. 브랜드 묶음 중앙과 좁은 폭의 프로필 둘째 행은 유지한다.
- 작은 글자는 청록, 총 XP는 대비를 확보한 짙은 호박색이다. 밝은 금속 및 상호작용 상태의 계산 최소 대비는 각각5.92:1/4.71:1이다. 이전0.2.6의 dark panel/밝은 노랑 스타일 설명은 이 버전의 현재 헤더에는 적용하지 않는다.
- 36px borderless 버튼의 확장 영역은 `::before` used-height 및 시각 상·하3.5px 실제 `elementFromPoint`로 검수한다. 이전0.2.6의42px used-height를44px 실측으로 간주하지 않는다. `qa-header-refinement.cjs`는 ca0113 baseline과355/390/1024 하위화면의 전체 지도/뒤로·프로필을 실제 합성 렌더로 비교한다.
- 대본은 source/status/timing/정답 근거를 보존한 채 중복 안내 표시만 줄인다. 실제 대본 없음/시간 정보 없음 안내는 남긴다. `test-lc-script-labels.cjs`를 기존 Practice/Script 검사와 함께 실행한다.

### 0.2.9-beta 헤더 가독성·활성 부모 이동

- `bindHeaderParent`는 현재 header/host의 실제 부모 control만 위임한다. module의 busy/disabled·기존 discard/저장 계약을 재사용하고 page/view 교체에서 observer·위임 표식을 정리한다. 늦은 저장 승인은 원래 action과 현재 control identity가 같을 때만 재실행한다. park된 Listening이나 제거된 view의 handler를 찾지 않는다.
- 프로필은 실제 `refreshHeader`의 menu outerHTML 교체를 관찰하고 ResizeObserver를 새 model/menu에 재등록한다. rAF 측정을 모으고 pagehide에서 예약 작업과 관찰을 정리한다.
- 합성 검수 기준은 320/355/390/1024 Chromium/WebKit, 정상/긴 닉네임·큰 XP·정상 복귀, 장식 교차 없음, 실제 44px 양방향 hit와 Tab/Shift+Tab focus, 직접 링크/기존 depth BackForward·모달·저장 취소/수락·파트/목차 복귀다. 본문 학습과 0.2.8 Full Test/Practice 회귀 검사는 별도로 보존한다. 실제 iPhone 및 운영 사용자 자료 검증으로 혼동하지 않는다.

- macOS WebKit의 기본 Tab은 시스템 키보드 탐색 상태에 따라 버튼을 건너뛸 수 있다. 검사는 설정/DOM focus를 바꾸지 않고 기본 Tab을 먼저 사용하며, 해당 환경에서만 표준 Option-Tab(Playwright Alt+Tab) 순회도 검증한다. [Apple Safari 키보드 안내](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac)의 동작과 물리적 Safari 검수 범위를 구분한다.
