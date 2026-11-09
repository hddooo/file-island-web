# FE 개발 설계

> 2026-10-30 현재 릴리스 범위: 직접 확인한 사용자 로컬 참고5장을 재해석한 행복의 마을(왼쪽 놀이동산·오른쪽 큰 나무 알 둥지·아기 디지몬3마리), 선로에 맞는 역정차/짧은 왕복, 곰 가림 방지와 My Page 카드 보관함을 반영한다. 현재 파트너·계정XP와 빈 준비 중 슬롯만 표시하며 알 구매/60초 부화/새 장착·개별XP 저장은 닫혀 있다. API/DB/auth/CORS 변경과 새 Library 업로드는 없다. 전체 기능 후보 FEa111e8d/API987be57은 보존한다. 정확한 운영 SHA·CI·Production 검증은 최종 결과를 기준으로 한다.

## 책임과 실행 구조

정적 `index.html`과 `media/`를 Vercel이 제공하고 기존 `/api/v1` rewrite로 API를 호출한다. 빌드 도구 도입이나 서버 코드 이동은 이번 문서 정리에 포함하지 않는다. 로그인·토큰·소유권·서버 채점의 기준은 [API 개발 설계](https://github.com/blockmonkey1992/hanq_api/blob/dev/docs/design-development.md)이며 FE에서 재정의하지 않는다.

로그인 유지 UI는 공개 `GET /api/v1/premium/plan` 응답의 선택적 `auth.rememberMe: { available: true, maxDays: 90 }` 선언과 브라우저 Web Locks 지원을 모두 확인해야 선택 가능하다. 이 필드는 FE가 수용할 후속 계약이며 현재 운영/준비 API에는 아직 구현되지 않았다. 누락·잘못된 값·조회 실패는 지원 확인 실패로 표시하고 일반 로그인을 유지한다. `remember_unavailable` 또는 `session_coordination_unavailable`을 받으면 해당 탭에서 옵션을 해제·잠그고 사용자가 일반 로그인 버튼을 다시 눌러야 한다. 비밀번호 자동 재전송, 토큰 영구 저장, 클라이언트 기간 연장은 없다. 일반 503을 지원 불가로 잘못 해석하지 않는다.

- `media/world-map.js`·`world-map.css`: PC/모바일 배경, 여섯 목적지, 투명 atlas 배회, reduced-motion 및 이탈 정리. TOEIC 내부 키는 유지하며 화면 지역명만 영어섬이다.
- `media/battle-island.js`·CSS: 문제/종료/리뷰 모달, 선택 변경 후 명시 제출, 서버 접수 뒤 완료, 파란 ○·빨간 X, 공격·HP 잔상 바. SSE 상태·revision과 이벤트 큐를 처리하며 클라이언트가 피해·XP·정답을 결정하지 않는다.
- `media/battle-wrongnotes.js`: 개인 전투 오답 복습. 반복 출처의 누적 복습과 최신 복습 필요 상태를 구분한다.
- `media/lc-player.js`·`lc-playlist.js`·`audio-player-ui.js`: 선택 곡 우선 재생, 순차 prefetch/제한 캐시, Script 내부·재생목록 내부 스크롤. 일반 LC 배속은 0.8→1→1.1→1.25 순환이다. 전투 중 LC 조작 UI는 숨기고1× 자동 재생하며 종료 복습의 컨트롤은 유지한다.
- TOEIC 공통 헤더와 문법 화면 정리는 콘텐츠/기록 삭제 없이 표시 범위만 정리했다.

## 문서와 데이터 경로

`docs/`에는 설명뿐 아니라 스크립트가 읽는 출처·검수 JSON이 있다. 기존 도구의 docs 경로 참조를 검사하여 실제 입력/출처 파일만 유지한다. `.vercelignore`는 docs를 배포 제외한다. [README](../README.md)의 상세 링크와 [스크립트 설명](../scripts/README.md)을 보존한다.

## 검증

[현재 결과 보고](versions/v0.1.0/report.md)에 실제 실행 범위·정확한 배포 커밋·실기기 미검증을 기록한다. 일반 요청은10초 미만 정상 지연에 조기 timeout하지 않고 배틀의 일시 복구는 전역 스피너/기술 경고를 반복 표시하지 않는다. 실제 최종 실패를 성공처럼 숨기지는 않는다.

<a id="world"></a>
## 지도·디지바이스·화면 수명

현재 지도는6섬·4배회 캐릭터이고 사용자 표시 지역은 영어섬이다. 예전2입구/북남장식 지도는 대체됐다. 화면은 검정 학습 패널·흰 본문·초록/빨강 강조와 디지바이스 프레임을 사용한다. 자기 호스팅 Neo둥근모는 공식 디지몬 글꼴이 아니며 기존 OFL/저작권 고지를 유지한다. 캐릭터 에셋도 공식 라이선스라고 주장하지 않는다. 출처는 `media/characters/README.md`와 기존 manifest에 둔다.

지도 진입 연출과 잦은 문항 이동은 다른 수명으로 관리한다. Escape/뒤로/이탈 시 inert·애니메이션·리스너를 정리하고 reduced-motion은 연출을 생략한다. 작은 화면의 단일 읽기 영역, 안전영역·고정 메뉴·대사 줄바꿈을 보존한다. 문항 전환 복제에 실제 audio/video/iframe을 복사하지 않는다. 과거 공간 연출 문서의 픽셀·시간 수치는 당시 측정이며 최신 전체 앱 검사와 혼동하지 않는다.

<a id="audio"></a>
## LC 재생·대본·준비

오디오 요소는 전용 엔진에 유지하고 UI만 이동한다. 계정 변경/로그아웃에는 개인 캐시와 오래된 응답을 정리한다. 문제 음원과 전역 플레이어가 동시에 재생되지 않도록 상호 일시정지한다. 현재 일반 플레이어는 Script를 카드 내부에, 약4행 높이 재생목록을 하단 내부 스크롤로 보여준다. 배속은0.8/1/1.1/1.25 단일 순환이며 옛0.75~2배 UI와 전체다운로드 완료 전 재생 차단 설명은 대체됐다.

선택한 곡 우선 재생·나머지 순차 prefetch, 진행 중 요청 합치기·현재 재생 보호·캐시 제한·실패만 재시도를 사용한다. Blob 준비는 해당 열린 페이지의 재사용이며 브라우저 종료 후 영구 오프라인 보장이 아니다. 자동다음/Media Session은 플랫폼 제약이 있고 실기기 잠금·메모리 압박·강제종료 성공을 데스크톱 검사로 주장하지 않는다. 확인된 대본과 음원 기반/미확인 자료를 구분하고 정렬되지 않은 단어에 시간을 추정해 붙이지 않는다.

<a id="vocabulary"></a>
## 단어장·PDF·개인 체크

원래 expression·ID·체크 키와 원문/예문 출처를 유지하면서 짧은 표제어를 표시한다. 고정 복합명사·구동사의 뜻을 기본형 뜻과 혼동하지 않는다. 같은 기본형이어도 다른 기존 기록을 임의 병합하지 않는다. 단어별 예문·해석·Tip/패러프레이즈와 품사, 뜻 가리기·체크한 항목 필터·25개 페이지를 유지한다. 현재 기본 예문은 보이고 뜻 가리기에서는 한국어/힌트를 숨긴다. Tip 펼침 기억과 테스트 상태는 분리한다. 10/29부터 읽기 배치는 `vocabulary-reading.css`가 `#toeicNotesHost.tn` 범위에서만 정한다(전역 `html body *` 픽셀 글꼴 규칙 때문에 Arial 뒤로 넘어가던 한글을 시스템 한글 본문체로). 뜻 가리기는 `hidden` 속성이 소유하므로 이 시트는 해당 요소의 display를 건드리지 않고 마지막에 `[hidden]` 보호 규칙을 둔다. 필터 토글(`setOnlyChecked`)과 뜻 토글은 화면 상태만 바꾸며 `persistChecks`(계정 체크 저장)를 부르지 않는다.

PDF는 같은 볼드 표제어와 단어별 독립 블록, 단어 사이 구분선, 예문/해석/Tip 간격을 사용한다. 관리용 오답보기 라벨과 공유 예문 그룹으로 소속을 흐리던 출력은 대체됐다. 표제어 용례가 아닌 원문3개는 학습용 보완 예문으로 구분하고 원본 출처를 보존했다. 기존49/45/32개 기준 챕터 출력은3/3/2쪽으로 검수됐으며 추가 단어가 생기면 실제 개수를 다시 측정한다. 과거2쪽 강제 압축·9.25pt·예문 공유 출력은 현재 지침이 아니다. 문법 공식8개는 원본 ID/체크를 지우지 않고 일반 단어 출력에서 제외했으며 문법 화면의 레거시 부록 노출도 제거됐다. PDF 저장·직접 다운로드·OS 인쇄는 각각 다른 기능이고 물리 프린터 성공을 주장하지 않는다.

<a id="grammar"></a>
## 문법·보기 해설·학습 근거

현재 문법 화면은3개 약점 노트와 현행 연습 진입을 중심으로 한다. 옛8/9챕터 목차/가정법 부록/이전100제 링크를 지금의 화면으로 설명하지 않는다. 기존 ID·원문·완료 체크·풀이 기록은 유지한다. 상세 개념과 예문·암기표는 학습 범위와 출처를 분리하며, 확인한 개인 문항 반복을 ETS 전체 빈도라고 부르지 않는다.

연결어 핵심노트는 접속사36·전치사/구33·연결부사/구33 및 if so/if not2조건표현의 당시 데이터 기준이다. 접속사+절/전치사+명사구/문장 안 연결부사를 구조와 뜻으로 비교한다. until/by 시간 방향, otherwise 조건결과, on the contrary 앞 주장 반박을 구분한다. unless를 단순히 절 연결 불가로 배제하거나 whose의 사물 선행사를 부정하지 않는다. PDF는 해당 핵심표와100문항 연습을 구분한다.

Part5 보기 해설은 원문·보기 순서·정답의 정확한 지문 결합 후 공개하고 학습용 창작 예문을 실제 기출처럼 표시하지 않는다. Part7은 같은 지문의 형제 문항과 실제 오답을 구분하며 전체 풀이와 근거 문장 위치를 혼동하지 않는다. 문법/연결어의 세부 근거·검수 수치는 보존된 JSON을 기준으로 확인한다.

<a id="history"></a>
## 한국사·전체 복습·콘텐츠 정확성

시대 학습은 기존 스토리·문화재·전체요약·퀴즈·시대별 문제의 안정 ID/깊은 링크를 유지한다. 화면에서 없어졌던 옛 날짜별 시험/랭크 안내를 현재 기능으로 되살리지 않는다. 기존 회차·채점·진도는 보존한다. 독도/간도는 내용에 맞는 시대와 연결하고 별도 목차 복원과 실제 선정표 편입을 구분한다. 요약은 흐름→비교→회상→정답 확인을 따르며 왕별/시기별 정리는 사건 관계를 왜곡하지 않는다.

시대별 장면 원출처와 교재·기출 대응표는 실행/검수 참조 자료이므로 유지한다. 텍스트 추출·문항 수·기계적 정답 한 개 검사는 원문 이미지/도표/선택지의 전수 판독 증거가 아니다. 전체 카탈로그에 있음과 기본 선정표의 질문·정답에서 회상할 기회가 있음도 별개다. 기존 ID를 지우지 않고 선정·중복 집계와 단서를 검토한다.

현재 복습 기능 계약은 기존 학습/읽음/모의회차 계약 문서를 따른다. 로컬 진행·서버 진행의 범위는 각 모듈별로 구분하며 앱 전체가 무조건 로컬 전용 또는 서버 전용이라고 일반화하지 않는다. 원문 빈칸 입력은 서버 정확 비교와 버전·revision/mutationId를 사용하며 임의 유사답을 정답 처리하지 않는다.

<a id="records"></a>
## 개인 기록·계정 복귀·학습 피드백

My 기록은 저장된 실제 제출·서버 집계만 사용하고 오류를0으로 채우지 않는다. KST 월/날짜·가입 전 날짜·가져온 과거 기록과 새 제출을 구분한다. 계정 교체 후 늦은 응답이 새 화면을 덮지 않도록 수명/요청세대를 확인한다. 개인 XP·진화·체크·답안 데이터는 표시 정리와 별개다.

로그인 상태 복원과 일시적 네트워크/5xx는 인증 만료와 구분한다. 기존 입력을 보존하고 확정되지 않은 저장을 성공으로 꾸미지 않는다. 배틀의 일시 복구에는 기술 문구/스피너를 반복 노출하지 않는다. 일반 API의10초 응답 허용과 다음 문제 전10초 재접속 유예는 다른 개념이다. 인증/보상 규칙은 API 설계와 보안 계약만 기준으로 한다.

<a id="mini"></a>
## 미니모의·묶음 제출

Chapter 미니모의는 기존 단어·표현에 연결된 자체 제작 학습 문제이며 공식 ETS 원문 또는 점수 예측으로 표시하지 않는다. Part1~6의 모든 선택지는 공통 버튼 구조를 사용해 단어장 form/radio 스타일 상속으로 보기 높이가100px 이상 늘던 문제를 해결했다. 제출 전 선택과 미제출 위치, 공통 지문/음원 묶음을 보존한다.

첫 결과·최근3회·재풀이·오프라인 outbox는 계정/event ID 기준이며 응답 유실 후 정확히 접수한 event만 제거한다. 묶음 전체 채점 전 대본·해설/정답 힌트를 공개하지 않는다. 공개 가능 여부는 실제 음원 manifest/서버 릴리스 가드와 코드 기준으로 확인한다. 초기 Chapter1 문서의 음원0·준비중·migration038미확인은 당시 상태이지 현재 배포 판정이 아니다. 이번 문서 통합에서 새 시험 실행/서버 저장을 검증한 것은 아니다.

### 10/27 여섯 섬의 지형 진입

얼음섬 이름에는 부제를 두지 않는다. 역사숲·영어섬·얼음섬·무지개마을·명예의 전당·건의 문의 모두 PC/모바일 원본 픽셀을 따라 만든 오목한 비정형 SVG 경로로 분리한다. 볼록 껍질이나 원·타원으로 외곽을 대신하지 않는다. 지형과 배회 캐릭터만 1.045배 확대하고 위로 살짝 이동하며, 제목 카드는 위치를 유지한다. 원본 이미지의 같은 영역은 바탕에서 제외해 중복 잔상을 막는다.

지형 포인터 영역은 같은 윤곽을 사용하고 이름표와 동일한 이동 동작으로 연결한다. 투명 지형 hit 영역은 공통 링크 hover 배경의 영향을 받지 않는다. 모바일 첫 탭으로 이동하며, 이름표의 keyboard focus도 같은 지형을 강조한다. 무지개마을은 aria-disabled 준비 중 상태를 유지하고 키보드로 확인할 수 있지만 진입은 열지 않는다. reduced-motion에서는 이동·확대 없이 밝기 강조만 제공한다. 지도 전체 transform이나 서버·학습 기록은 바꾸지 않는다.

### 낮은 화면의 지도 접근

일반 화면은6메뉴를 한 지도에 배치한다. 높이가 부족한 가로/작은 창에서는 이름표를 줄이거나 하단을 숨기는 대신 지도에250px 최소 높이를 두고 기존 기기 읽기 영역 안에서 스크롤한다. 크기 계산은 읽기 영역의 scrollTop을 포함해 스크롤 중 재측정이 지도 크기를 흔들지 않게 하며, 지도 이탈 시 전용 스크롤 class를 정리한다. 이는 좁은 화면에서 확인된 메뉴 접근 결함 보완이며 다른 학습 화면의 스크롤·서버 규칙을 바꾸지 않는다.

전투의 판정·공격 사이에는 “서버 판정 완료…” 같은 내부 처리 안내를 표시하지 않는다. 공개된 O/X·공격·카운트다운으로 상태를 전달하고 실제 복구 유예/최종 실패처럼 사용자가 알아야 하는 상태와 구분한다. 서버 판정 시각·피해·저장은 이 문구 정리로 변경하지 않는다.

## 관리자 화면과 로그인 집계

- `ops/index.html`, `media/admin-dashboard.css`: 관리자 전용 셸. 사용자 문의 화면의 스타일은 유지한다.
- `media/admin-dashboard.js`: 7/30일 집계와 최근 가입 회원을 읽고 차트·일별 표·현재 관리자 카드를 구성한다. 신규 외부 분석 도구나 추적 코드는 없다.
- `media/portal-ui.js`: 기존 회원/XP/문의 흐름과 관리자 메뉴를 연결한다. 요청 세대·소유자 검사로 이전 계정/화면의 응답을 버린다.
- API 계약: `GET /api/v1/ops/login-analytics?days=7|30`. `recordedLoginCount`, `recordedUniqueUsers`, `daily[].recordedLogins/recordedUsers`, `firstRecordedLoginAt`, `generatedAt`, `coverage`, `collectionStartedAt`. 기간 고유 회원 수는 일별 값을 더하지 않는다. null은 확인 불가다. `coverage=unverified`를 완전 집계로 해석하지 않는다. API 원천은 기존 `member_access_logs`의 성공 `signin` 이벤트다.
- 검증: `JSDOM_PATH=/absolute/path/to/jsdom node scripts/test-admin-dashboard.cjs`. 합성 데이터만 사용하며 실제 회원 변경/운영 DB 쓰기는 수행하지 않는다. FE는 정적 HTML/JS이며 배포 빌드에서 아래 앱 버전 표식만 생성한다.
- 원본을 확인한 부모의 명시적 설계로 구현했고, 부모의 원본 대조 검토를 통과했다. 이후 지원 Library 흐름과 기존 macOS CA 인증서 파일을 사용해 원본을 Mac에 저장하고 실제 이미지 확인도 마쳤다. 원본은 운영 배포 자산에 포함하지 않는다.

## 한 줄 나의 기록

풀이마다 과목·문제 번호·문항 정오답·날짜와 경로를 한 줄로 표시한다. 전투는 공개 상대 닉네임과 경기 WIN/LOSS/DRAW 또는 무효/미확인을 추가한다. 긴 닉네임은 시각적으로만 줄이고 전체 정보는 접근성 이름과 팝업에 남긴다. 기록 선택 시 native dialog에 원문·선택지·내 답·정답·해설·KST 전체 시각을 보여준다. 문항 정오답과 원경기 결과는 별개다. Tab 초점 제한, Escape/닫기, 브라우저 뒤로·앞으로, 새로고침과 원래 행 초점/스크롤 복귀를 지원한다. 필터·20건 페이징·조회 스냅샷과 반복 풀이 보존은 유지한다.

## 무지개섬 컬렉션 화면

`rainbow-island.js`가 컬렉션 계약 검증·공유 초상화·무지개섬 UI를 제공한다. version1, 소유 ID/계열 유일성, XP 합계, revision 합, 장착1개, 단계와 다음 목표 일치를 모두 확인한다. API 미지원/오류/로딩/합계 불일치 때는 구경 화면만 표시한다. `api-client.partnerAction`도 같은 문을 통과해야 하므로 disabled 버튼을 우회해 호출해도 새 API를 요청하지 않는다.

수령·장착·진화는 낙관적 XP/소유 변경 없이 서버 `confirmed`와 최신 `/me`를 기다린다. 응답 유실은 sessionStorage에 계정/입력별 UUID를 보존해 재시도한다.409는 최신 상태로 갱신하며 오래된 계정 응답은 버린다. 출석과 연습 정답의 XP 변경도 컬렉션 사용 시 전체 프로필을 함께 읽는다. MyPage는 장착 디지몬 XP와 계정 합계를 따로 표시하고, 헤더·전당·대전은 새 atlas의 실제 모습을 사용한다. 새 캐릭터의 전용 포즈·기술 표현은 아래 독립 시각 모듈을 사용한다. 공통 단계 능력치·피해·판정은 서버 계약을 유지한다.

2026-10-29부터 섬 화면은 `ri-game` 한 장면이다: 화면 비율에 따라 `rainbow-park-wide/tall-v2` 배경과 투명 스프라이트 시트(`rainbow-park-sprites-v2`)를 쓰고, 기차는 requestAnimationFrame으로 트랙을 돈다(숨은 탭·reduced-motion에서는 멈춤, 정지 위치 고정). 알·수호자·`내 친구들`은 장면 안 버튼이며 선택 창은 `history.state.rainbowPanel`로 뒤로가기와 연결된다. 화면이 유지되는 동안 서버 상태가 바뀌면 작은 창만 다시 그린다. 로그인 직후 섬 복귀 때 로그인 화면용 `#app.login-integrated` 블록 배치가 남아 장면 높이가 0이 되던 문제는 `finishLoginLanding`에서 로그인 화면 클래스를 함께 해제해 막는다(대전 복귀도 같은 경로).

이전 배경519,380bytes, 작은 포스터,1254×1254 투명3×3 atlas를 사용한다. 출처·프롬프트·크기·SHA는 `media/world-art/manifest.json`, `media/characters/collection-manifest.json`, `docs/versions/v0.1.0/rainbow-art-prompts.json`에 있다. canvas 렌더나 주기적 컬렉션 polling을 추가하지 않았고, 화면 제거 시 구독/observer를 해제한다. 새화면 CSS는 기존 terminal 테마의 전역 important 선언을 한정된 무지개섬 scope에서만 덮는다.

### 신규 계열 전투 시각 모듈

`media/battle-collection-visuals.js/.css`는 두 계열 12캐릭터의 준비·발사·피격·패배 48포즈와 8종 기술 표현을 제공한다. 실제 생성 그림의 경계를 CSS atlas viewport/clip으로 읽으며, 같은 캐릭터 네 포즈는 같은 배율을 사용한다. 원본 비트맵은 imagegen으로 생성하고 WebP 인코딩만 했다. 프롬프트·SHA·용량은 `media/characters/battle-collection-poses.provenance.json`에 있다. 전투에서 필요한 계열만 한 번 지연 로딩한다(각 약0.5MB). 이미지 준비 전에는 기존 초상화를 유지한다.

`battle-island.js`의 연결은 portrait preload, pose, hurt, material, 정답 공격 type/표시명에 한정한다. 약공격·draw·chargeMs/eventMs·기존 아구몬 FX와 API 피해/XP는 그대로다. Seven Heavens의 일곱 구슬은 단일 공격 객체의 시각 자식이며 피해 이벤트를 일곱 번 만들지 않는다. 유년기 정답은 거품, 오답은 통합본의 몸통박치기를 유지한다. 모션 감소에서는 공격 FX 없이 기존 판정/HP 흐름을 따른다.

### 배포 버전과 설치 앱 안내

`scripts/build-app-version.cjs`가 `VERCEL_GIT_COMMIT_SHA`(없으면 로컬 HEAD) 40자리 값을 검증해 index의 `hanq-app-version` meta와 `/app-version.json`을 함께 만든다. 로컬 JS/CSS URL에는 같은 build query를 넣는다. Vercel의 [buildCommand/outputDirectory 계약](https://vercel.com/docs/builds/configure-a-build)을 사용하며 루트/index/version 응답은 no-store다. API rewrite와 인증 설정은 유지한다. 개발 원본 meta `development`에서는 안내 모듈이 작동하지 않는다.

`app-update.js`는 시작/pageshow/visibility/focus에서 same-origin 버전을 credentials omit·no-store·5초 timeout으로 읽는다. 1분 이내 중복 확인을 합치고 실패·404·잘못된 schema는 화면을 바꾸지 않는다. 확인된 다른 SHA만 안내하며 자동 reload는 없다. 허용된 메인/역사 메뉴/무지개섬/전당/계정 첫 화면 외 경로, 대결·모달·요청·인증 복원·미완료 입력·재생 중에는 적용을 막고 클릭 시 다시 검사한다. 진행 내용은 기존 흐름에서 마친 뒤 적용한다. hash/query와 local/session storage는 유지하고 HTML URL에 배포 SHA를 붙여 명시적으로 다시 연다. 새 버전 확인 후 해당 query만 제거한다. 서비스워커·캐시 삭제·로그아웃·인증정보 출력은 추가하지 않았다.


### 전용 시각/PWA 통합의 경계 보완

업데이트 알림은 api-client 직후 다른 앱 스크립트보다 먼저 구독한다. head의 defer로 두면 앞서 시작된 요청의 pending 이벤트를 놓칠 수 있으므로 이 순서를 유지한다. 지연된 캐릭터 atlas는 현재 요청된 charge/release/defeat 자세만 복구하고 clear 시 대기 자세를 지운다. 대기 초상화의 CSS atlas 자리표시자는 WebKit에서도 decode되는 투명 SVG를 사용한다. 서버 신규 전투 규칙 설명은 기존 modernLobby 가드를 따르며 구 API에 약공격/draw가 적용된 것처럼 안내하지 않는다. 실제 피해/타이머/제출/보상 처리에는 변경이 없다.
## 한국사 원문 가독성·Part 7 문서 구분

`learning-reader.js`는 읽기 전용 공용 표시 계층이다. 한국사는 개별 원본 이미지와 대조한 `history-readable-reviewed.json`만 런타임 데이터로 빌드한다. 문항 ID·내용 버전·회차·번호·다섯 선택지 ID가 모두 일치해야 텍스트를 표시한다. 공통 자료는 별도 이미지 SHA와 연결 문항 번호도 대조한다. 과거 버전·자료 부족·판독 보류는 기존 원본으로 돌아간다. 정답·해설·선택 상태·저장·XP는 기존 담당 모듈이 그대로 처리하며 텍스트 데이터에는 판정 필드를 넣지 않는다.

문장·말풍선·자료·표·보기 순서·한자·기호·밑줄을 보존하고, 원문에 없는 연도나 정답 명칭을 빈칸에 보충하지 않는다. 원본 전체는 별도 펼치기와 확대에서 확인한다. 자료의 사진·지도·연표·회화 선택지가 필요한 문항은 이미지로 유지한다. 이미지를 생성하거나 보간한 결과를 복원본으로 사용하지 않는다. CSS 표시·원본 확대만 적용한다. 세 열 이상의 표는 480px 이하에서 행별 카드로 표시하고 각 값에 원래 열 제목을 붙인다. 표의 행·열 순서, 셀 원문, 접근성 역할은 유지한다.

Part 7 문서는 원문 전체의 식별값과 검토한 시작 위치, 또는 원본의 명시적인 연속 `DOCUMENT 1/2/3` 표제를 기준으로 나눈다. 빈 줄·인용 이메일을 새로운 문서로 추정하지 않는다. `지문 3 · 두 번째 이메일`처럼 문서 순서와 같은 유형 안의 순서를 각각 표시한다. 원문 모든 문자는 한 번씩 유지하고, 이메일 메타정보·자료 카드·문제 왕복 탐색을 제공한다. 왕복 위치는 실제 `.device-content` 스크롤을 보존한다. 근거/해석 범위는 문서별로 잘라 연결하되, 두 문서의 실제 문장을 걸치는 미지원 해석 단위는 기존 단일 렌더링으로 돌아가 중복 해석을 방지한다.

CBT·부분 재풀이·오답노트·기존 혼합 RC·전투 Part 7·TOEIC 연습·나의 기록에서 재사용한다. 한국사 전투용 `battleQuestion(question, content)`는 버전과 이미지 목록을 검증한 뒤 읽기 영역과 버튼 글자만 변경한다. 전투 소유 파일의 호출 연결은 통합 담당과 별도로 조율한다. 현재 나의 기록과 과거 전투 복기에 원문 버전이 없는 한국사 자료는 텍스트 교체 대상이 아니다. 새 API 계약 없이 원본 확대만 제공한다.

빌드/검수 입력: 기존 정규화 원문 JSON과 기존 선택지 후보 JSON을 `build-history-readable.cjs`, `build-history-review-workbench.cjs`의 두 인자로 준다. 전수 상태는 `history-readability-inventory.json`, 지문 구분 근거는 `passage-layout-inventory.json`에서 확인한다. 대조 작업 화면과 브라우저 증거는 배포 제외 `evidence/learning-readability/`에 저장한다. `test-learning-reader.cjs`, `qa-learning-reader-browser.cjs`, `qa-history-reader-integration.cjs`, `qa-history-reader-full-page.cjs`, `qa-learning-records-browser.cjs`가 합성 API/로컬 원본만 사용한다.

### 학습 표시 계층의 통합 연결

`battle-island.renderQuestion`은 기존 문항·선택지 DOM 생성 직후 `HanqLearningReader.battleQuestion`을 호출한다. 자료 준비·레디·서버 시간·명시 제출·HP·보상 함수는 그대로다. `account-ui.questionHtml`은 한국사 복습 카드에 escape한 문항 ID와 정확한 버전만 붙인다. 읽기 계층이 보기 텍스트를 붙일 때 기존 선택 순서·상태·정답의 접근성 안내를 보존한다. 버전이 없는 기록과 판독 보류/그림 필수 문항은 원본을 유지한다.

Vercel 빌드에 필요한 `scripts/build-app-version.cjs`만 `.vercelignore`의 scripts 제외 규칙에서 허용했다. 다른 검수 스크립트·문서·증거의 제외는 유지한다. 근거는 [Vercel 제외 파일 문서](https://vercel.com/docs/deployments/vercel-ignore)의 업로드/배포 제외 계약이다.

## 섬 지도 정박지와 얼음섬 상태등 (10/29)

`island-harbors.js`는 기존 역사숲/영어섬 지도 버튼을 그대로 두고(핸들러·주소·상태 소유는 앱) 지형 그림 위 좌표·랜드마크 아이콘·이름표만 입힌다. 700px 이하는 세로 지도(`*-harbors-mobile-v1.webp`)와 별도 좌표를 쓴다. 예전 공용 곡선 경로와 연결되지 않은 네 번째 역사 경유점은 제거했다. 프롬프트는 `docs/versions/v0.1.0/island-harbor-art-prompts.json`.

`battle-connection.js`는 표시만 담당한다. 상태는 `battle-island.js`가 실제 스트림 이벤트(`waiting/snapshot/invitations`)와 HTTP/스트림 실패 분류에서만 정하며, 재연결·presence 타이밍은 바꾸지 않았다. 닫힌 스트림의 늦은 콜백은 세대 번호로 무시한다. 설명 말풍선은 화면 가로 안으로 좌표를 보정하고, 기기 스크롤 아래로 가려지면 열 때 보이도록 스크롤한다.

## 무지개섬 기차 선로 (10/29)

기차는 배경 그림에 그려진 선로만 따른다(별도 선로를 그리지 않음). 배경별 선로 중심선을 그림 픽셀 좌표의 superellipse(지수2.5, 앞/뒤 반지름 분리)로 측정해 `rainbow-island.js`의 `TRACKS`에 두고, 같은 균일 배율·오프셋(`trackFrame`)으로 배경·기차·수호자·알을 놓는다. 예전 `object-fit:fill` 비균일 확대와 화면 전체를 가로지르던 사인 곡선 경로가 탈선 원인이었다. 기관차와 객차2량은 호 길이로 간격을 둔 각자의 위치·접선으로 움직이고, 양 끝 회전은 180° 회전 대신 원근 축소·좌우 반전으로 표현해 뒤집히지 않는다. 한 프레임 이동은 0–80ms로 제한해 역주행·튐이 없고, 숨은 탭에서는 멈췄다 그 자리에서 이어 가며, 모션 축소는 앞 직선에 정지한다. 검수는 `scripts/qa-rainbow-train.cjs`(가짜 시계로 폭별 두 바퀴 매 프레임을 렌더된 배경 박스 기준으로 비교).

## 사이트 전체 대전 초대 (10/29, 서버 지원 시에만 동작)

`media/battle-invites.js`가 로그인 세션 전체의 초대 수신을 맡는다. 시작 시 `POST /battle/presence` 한 번으로 서버 지원을 확인하고, 404/400(현재 운영 API)이면 아무 연결도 열지 않는다. 지원하면 탭마다 sessionStorage의 탭 id로 10초 heartbeat를 보내고, `#battle`이 아닌 화면에서는 탭당 하나의 `GET /battle/events?place=site` 스트림을 연다. `api.battleStream`은 탭당 하나(새로 열면 이전 것을 닫음)이므로 얼음섬에서는 얼음섬이 스트림과 초대 창을 맡고 이 모듈은 쉬며, 얼음섬을 떠나면 다시 연다. 화면 복귀(visibility)·`online` 때 서버 상태를 다시 읽고 즉시 재연결하며, pagehide에는 keepalive로 그 탭만 suspend한다. 팝업은 `#app`을 inert로만 막고 다시 그리지 않는다. 수락은 `HanqSemanticLibrary.prepareLeave()` → 남은 시간 확인 → `POST accept` → 서버가 ready/playing/between을 준 때만 `#battle/<id>`로 이동한다. `api.battle` 허용 경로에 `POST /presence`, `GET /invitations`를 더했다. 얼음섬은 서버가 `activity`를 줄 때만 내 줄과 새 상태 문구를 보이고, 닫힌 초대 이유는 같은 안내(`HanqBattleInvites.toast`)로 보인다. 서버 계약은 API `docs/design-development.md`의 사이트 전체 접속자·대전 초대 절.


## 보유 디지몬 모션 · 파피몬/파닥몬 계열

서버의 기존12개 character ID와 진화 순서, 개체 XP·장착·60초 부화·전투 판정을 유지한다. `collection-life.js/css`가 대기·이동의 부분 동작과 서버에서 확인된 진화 표시를 담당한다. 유년기의 더듬이/뿔/귀, 성장기의 귀·팔·발, 늑대 계열의 꼬리·발·기계 날개, 엔젤몬 계열의 바깥 날개를 검토한 원본 그림에서 분리해 움직인다. 원본 RGB 픽셀은 바꾸지 않고 CSS/SVG 마스크·관절 기준점을 사용한다. 성장기까지 귀여운 인상과 성숙기 이상 체형·실루엣 차이를 유지한다. 낮은 비행과 그림자는 실제 귀날개/날개 동작과 함께 움직인다.

파닥몬 대기는 Library 인계 묶음의 원본 `patamon-hover-idle-v1.png`를 사용한다. 명목3×2셀은 약33px 행 어긋남과 셀 밖 날개가 있어 그대로 쓰지 않는다. `patamon-hover-idle-v1.registration.json`의584뷰, 눈 기준점, 프레임별 배경 위치와 clipInset으로6개 귀날개 자세를 약0.96초에 한 번 재생한다. 정적 collection atlas도 메탈가루몬 날개 등이418셀을 넘으므로 `collection-atlas-v1.registration.json`의 실제 알파 연결 성분·분리 장식·실루엣 hull/480뷰로 격리한 후 부분 동작을 적용한다. 각 격리 영역에 다른 주요 캐릭터 픽셀이0개임을 두 엔진에서 확인했다.

`HanqCollection.portrait`, My Page hero/보관함과 전투 대기 초상화가 같은 수명 관리를 사용한다. IntersectionObserver, 숨김 탭, 축소 모션과 DOM 이탈에서 모션을 멈추고 정리한다. 진화 표시는 같은 owner/개체의 서버 stage·revision 증가 뒤에만 시작하며 XP 증가나 다른 계정에서는 재생하지 않는다. 이미지가 준비되기 전에는 기존 정적 그림을 유지하고 실패 후 온라인 복귀 시 같은 자산의 모든 표시 위치를 함께 복구한다. 전투의 원래 img.bi-avatar는 유지하며 준비/발사/피격/패배 때 대기 rig를 숨기고 정지한다. 정적 메탈가루몬의 실제 source-facing과 좌우 반전을 구분한다.

파닥몬의 기존 전투 귀날개 색이 승인된 대기 그림과 달라 `patamon-actions-v2.png`의 보라색 귀날개·파란 눈을 유지한 준비/발사/피격/패배4포즈를 추가했다. 실제4실루엣의 rect/hull/공통 scale과 입 기준점은 `patamon-actions-v2.registration.json`에 둔다. 다른11종과 실패 시 fallback은 기존 family atlas를 유지한다. 새 파일의 늦은 decode는 현재 요청된 자세에만 반영하며 오래된 상태로 돌아가지 않는다. 파닥몬의 발사 위치는 귀 위가 아닌 검토된 입 위치에 연결한다. 피해·공격 시간표·HP·XP·API 경로는 바꾸지 않는다.

모든 --cm-image URL은 `/media/characters/...`의 절대 경로다. 외부 CSS에서 상대 custom-property URL이 `/media/media/...`로 해석되는 실제 화면 누락을 수정했으며 검수도 실제 link stylesheet를 로드하고 계산된 모든 배경 URL이200인지 확인한다. 정적 CSS 주입만으로 실제 배포 문맥을 대신하지 않는다. 전역 터미널 테마의 animation:none!important와 원래 img/pose 가림도 실제 computed style과 픽셀로 확인한다.

로컬 합성 검수는 Chrome/WebKit320/390/1440의 부분 모션6조합, 12종/좌우/공격·피격·패배·약공격·축소 모션 및 새 자산 실패44조합, 지연 로딩4조합을 포함한다. 세 배경 접촉표와 전체48포즈도 확인한다. 실제 Nest/격리 PostgreSQL의 구매·장착·60초·두 계열5단계 진화와 실제 전투 검수는 통합 담당의 별도 기록을 따른다. 실물 iPhone/Safari·운영 배포 여부와 로컬 WebKit/합성 검수를 구분한다.

## 건의·문의 독립 페이지 · 0.4.18-beta

`inquiries/index.html`은 리다이렉트 대신 기존 same-origin API 클라이언트와 `HanqInquiries.mountPage`로 간단한 작성 폼을 표시한다. 지도 링크 가로채기는 제거하고 MY PAGE 모달·목록은 보존한다. 페이지는 모달 잠금을 획득하지 않으며, 인증 확인·계정 전환과 BFCache 복귀 때 기존 owner/epoch·불명확한 전송의 requestId 보존 규칙을 재사용한다. 페이지의 로그인·문의 확인 링크는 루트 MY PAGE를 가리킨다. 새 API·DB·메일 전송 경로는 추가하지 않는다.


## File Island Study entry (0.8.27-beta)

A decorative book/island logo appears for about two seconds on the first app entry per tab session. Refresh and navigation do not repeat it. Reduced-motion, keyboard dismissal, CSS failure-safe timeout and existing access control are preserved. See [verification](versions/v0.8.27-beta/report.md).

## 0.8.44-beta: Ephemeral concept recall
The fourth era-study tab is 백지 테스트. Current concept bold text becomes blanks; Tab/Enter and local grading reveal mistakes in red. No wrong-note, XP, or progress persistence. Existing authenticated source and figure permissions remain unchanged.

## 0.8.45-beta
Blank recall preserves source titles/captions. Korean-aware auto-sized inputs show typed text without clipping. Recall-only bulk grade/reset controls removed; individual keyboard/blur grading retained without persistence.
