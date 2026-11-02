# 웹툰 읽음 표시 계약 (media/read-progress.js) — 단계 C

작성 2026-10-08. 학습 화면(시대별 한 페이지 학습, 펼친 웹툰 iframe)에서 **실제로 화면에 보인 컷**만 세어 흐름·시대에 ‘읽음’을 표시한다.
점수·순위·결제와 관계없다. 로그인·서버가 없고, 기록은 이 브라우저에만 있다. 저장소·시계를 손으로 고치는 것을 막는 보안 장치가 아니다.

## 1. 흐름과 컷

- 흐름 목록은 학습 화면의 흐름 바로 가기와 같은 자료다(`HANQ_FLOW[시대].list`, 개화기는 `HANQ_LECTURE.opening.parts.list`). 흐름 id는 웹툰 문서 안 흐름 머리 요소의 id다.
- 웹툰 문서에서 문서 순서대로 흐름 머리 뒤에 나오는 `.scene`이 그 흐름의 컷이다. 실제 문서에서 세며, 32 같은 고정 개수를 쓰지 않는다. 보충 컷(`data-added`)도 실제 컷이라 센다.
- 컷 키: 컷의 `id`. id가 없거나 겹치면 `x` + hash(흐름 id · 흐름 안 순서 · 제목)로 만든다.
  - 고려·조선 통합본에 id 없는 컷이 있다.
  - 조선은 통합본 `joseon-all-comic.html` 하나로 센다. 전기·후기 단독 웹툰(16·11컷)은 이번 단계에서 세지 않으므로 겹쳐 세지 않는다.
- 컷의 그림은 그림 틀(`.art`·`.artwork`·`.c-art`·`.m-art`·`.p-art`·`.gj-art`·`.n-art`·`.s-art`) 안에서 이 순서로 찾는다. 틀이 없으면 컷 안에서 찾는다. 머리 아이콘 같은 다른 그림은 쓰지 않는다.
  1. `img`
  2. SVG의 외부 `<image>`
  3. 틀 자체의 **CSS 배경 그림**: 계산된 `background-image`의 `url(...)`이다. 독도와 간도의 `.art.i-art` 7컷이 그렇다(그림판 `islands-panels.png` 한 장을 `background-size:200% 400%`와 인라인 `--x`/`--y`로 잘라 씀).
- 컷 서명(sig) = hash(키 · 제목 · 그림 설명).
  - 그림 설명(속성 값만 씀):
    - `img`: `img|<src>`
    - SVG: `svg|<viewBox>|<image href>|x,y,width,height,preserveAspectRatio,transform,clip-path`
    - CSS 배경: `bg|<배경 주소, 웹툰 문서 기준 상대>|<계산된 background-size>|<그 요소의 인라인 사용자 속성(--x 등)과 인라인 background 선언, 정렬>`. 계산된 `background-position`은 화면 폭에 따라 픽셀로 바뀔 수 있어 넣지 않는다. 자르기 값은 인라인 사용자 속성으로 들어간다.
  - 앞의 `./`는 뗀다. 주소는 웹툰 문서 기준 상대 주소로 맞춰, 앱 안·혼자 연 창·호스트·검사 환경(jsdom)에서 같다.
- 컷 서명(sig) = hash(키 · 제목 · 그림 설명).
  - 화면 폭·픽셀 위치·표시 글자(읽음 배지)는 넣지 않는다. 그래서 320/375/1280, 앱 안, 혼자 연 웹툰에서 모두 같다.
  - 컷 내용(제목·그림·잘라 쓴 범위)이 바뀌면 서명이 바뀌어, 예전의 ‘봤음’이 새 컷으로 옮겨 가지 않는다. 예전 기록은 지우지 않는다.
- 기준:
  - 흐름 읽음 = 그 흐름 컷 수 n의 `ceil(n/2)`개 이상을 봄.
  - 시대(장) 읽음 = 장 전체 서로 다른 컷 N의 `ceil(N/2)`개 이상을 봄.
  - 예: 삼국 32컷의 장 기준은 16이고, 흐름1(7컷)의 기준은 4다. 흐름1에서 4컷을 보면 흐름1만 읽음이고 장은 아니다.
- 지금 10개 시대의 실제 컷은 흐름 38개, 컷 200개다:

  | 시대 | 흐름별 컷 수 |
  | --- | --- |
  | prehistory | 3/3/4/2 |
  | gojoseon | 5/7 |
  | samguk | 7/6/8/11 |
  | nambuk | 8/6/10/8 |
  | goryeo | 4/3/4/4/5 |
  | joseon | 7/4/6/4/6 |
  | islands | 3/4 |
  | opening | 4/13/5 |
  | colonial | 4/4/2/8 |
  | modern | 4/4/2/3/5 |

  이 수는 `scripts/verify-hanq.cjs`가 실제 문서에서 다시 센다.

## 2. ‘봤음’의 조건

다음을 **모두** 만족하는 상태가 끊기지 않고 약 0.7초(`DWELL_MS = 700`) 이어진 컷만 한 번 센다.

1. 바깥 창 문서가 보이는 상태(`visibilityState === 'visible'`)다. 숨었다 돌아오면(`visibilitychange`) 머문 시간을 곧바로 처음부터 센다. 그래서 숨은 동안 늦게 돈 타이머의 시간이 들어가지 않는다.
2. 지금 그 시대의 학습 화면이다: 같은 장, 학습/요약 단계, iframe이 문서에 붙어 있고 표시됨. 또 iframe과 그림이 CSS로 숨지 않았어야 한다.
   - 자기나 조상의 `display:none`·`visibility:hidden`·`opacity:0`이면 숨은 것이다.
   - `checkVisibility({checkOpacity, checkVisibilityCSS})`, 없으면 조상 계산 스타일로 본다.
   - 사각형이 남아 있어도 숨은 것은 세지 않는다.
3. 그 컷의 그림이 실제로 불러와져 풀렸다.
   - `img`: `complete`·`naturalWidth` 확인 후 `decode()`가 끝나야 한다.
   - SVG 안의 외부 `<image href>`와 CSS 배경 그림: 같은 주소를 바깥 창에서 `Image`로 따로 불러 `decode()`한다. viewBox나 그림 틀의 사각형이 있다는 것만으로는 보지 않는다. 배경 그림 컷의 위치는 그림 틀로 잰다.
   - 불러오기·decode가 잠깐 실패하면 3초 뒤 다시 확인한다. 나중에 실제로 불러와지면 센다(영구 거절하지 않음).
   - 그림 없는 컷은 글 컷으로 본다.
4. **바깥 창 기준**으로 보인다.
   - 위치 = iframe의 위치(`getBoundingClientRect` + 테두리) + 그림의 iframe 안 위치. 이것을 iframe 칸, 바깥 창 화면, 바깥 창 위·아래의 고정/sticky 막대(`.mobile-nav`·`.topline`·`.steps`·`.rc-bar`)로 잘라 본다.
   - 보이는 폭이 그림 폭의 절반 이상이어야 한다.
   - 보이는 높이가 그림 높이의 60% 이상이어야 한다. 그림이 화면보다 크면 보이는 화면 높이의 절반 이상이면 된다.
   - 펼친 iframe은 장 전체 높이라서 iframe 안의 화면 기준(IntersectionObserver root:null)으로 재면 모든 컷이 보인다고 잘못 나온다. 그래서 쓰지 않는다.

그래서:
- 들어온 것만으로는 그 화면에 실제로 보인 컷(대개 0–1개)만 센다.
- 스크롤로 빠르게 지나친 컷, 바로 가기로 건너뛴 앞 컷들, 숨은 탭·다른 화면·떼어진 iframe은 세지 않는다.
- 같은 컷을 다시 봐도 늘지 않는다.
- 저장된 위치나 예전 위치는 읽음의 근거가 아니다.

다른 창이 보낸 메시지로는 세지 않는다. 바깥 창이 같은 출처의 iframe 문서를 직접 재기 때문이다(기존 `hanq:height`·`hanq:goto` 메시지는 그대로 둔다).

화면 처리:
- 바깥 창의 scroll·resize·visibilitychange는 requestAnimationFrame 한 번으로 묶는다. 0.25초마다 머문 시간을 확인한다.
- 다른 화면으로 가거나 iframe이 떼어지면 다음 확인 때 리스너와 타이머를 모두 정리하고 멈춘다.

## 2-1. 혼자 연 웹툰(‘웹툰을 크게 열기’ 새 탭)

10개 시대의 주 웹툰(`prehistory`·`gojoseon`·`samguk`·`nambuk`·`goryeo`·`joseon-all`·`islands`·`opening`·`colonial`·`modern`)을 혼자 열어도 같은 시대·흐름·컷 키로 남긴다. 앱으로 돌아오면 목차와 학습 화면에 같은 배지가 보인다.

- `media/comic-scenes.js`가 **그 창이 맨 위 창일 때만**(`window.self === window.top`) 필요한 것을 불러 `HanqRead.attachStandalone`로 시작한다.
  - 불러오는 것: `learning-progress.js`, `read-progress.js`, 그 시대의 흐름 자료(`lecture-flow-<era>.js`, 개화기는 `lecture-notes.js` 다음 `lecture-notes-opening.js`).
  - 앱 안 iframe에서는 시작하지 않는다. 그래서 두 번 세지 않고, 펼친 iframe의 큰 화면을 기준으로 삼지 않는다.
- 기준 화면은 그 창의 화면이다. 위에 붙은 흐름 바로 가기 막대(`nav`·`.p-nav`, 화면 폭 절반 이상인 고정/sticky 막대)는 가린 부분으로 뺀다.
- 그림 확인·머문 시간·CSS 숨김 확인은 앱과 같다.
- 웹툰 머리 아래에 짧은 상태 줄(`role="status"`)을 둔다: 읽은 컷/전체, 기준, 읽은 흐름 수, 저장이 막혔으면 이 탭에만 둔다는 알림. 흐름 머리 제목 옆에는 ‘✓ 읽음’ 또는 ‘본 컷 k / n’을 둔다. 이 표시 글자는 서명에 들어가지 않는다.
- `pagehide`에 리스너·타이머를 정리한다. 다른 탭의 기록은 storage 이벤트로 다시 읽는다.
- 조선 전기·후기 단독 웹툰(`joseon-comic.html` 16컷, `joseon-late-comic.html` 11컷)은 통합본과 컷 구성·흐름이 달라 이번 단계에서 세지 않는다. 앱의 조선은 통합본 27컷 하나로만 세어 겹치지 않는다.
- 읽기 전용 고리: `window.HanqReadComic.debug()`.

## 3. 저장

형식 지키기:
- 컷 기록은 `schema:1`·`kind:'read-cut'`·과목·시대·키·서명·시각이 맞고, 키 이름이 그 내용의 `seenView`와 같을 때만 센다.
- manifest는 `schema:1`이고 버전 문자열이 있으며, 흐름 id가 겹치지 않고, 컷 키가 흐름 사이·pre까지 통틀어 겹치지 않아야 하며, 키·서명이 비지 않아야 읽는다.
- 더 새 형식(schema > 1)이나 깨진 기록은 세지도, 읽지도, **덮어쓰지도 않고** 그대로 둔다.
- 올바른 manifest는 실제 내용이 바뀌었을 때만 새로 쓴다. 관찰 기록(컷마다)은 바뀌지 않는다.

학습 기록 저장소(`HanqProgress`)의 진행 기록을 쓰므로, 막힘·용량 초과 알림과 메모리 대체가 그대로 적용된다.

- **`hanq:progress:v1:read-<era>-<hash(key|sig)>`**: 본 컷 하나당 하나이고 바뀌지 않는다(이미 있으면 다시 쓰지 않음). 여러 탭이 서로 덮어쓰지 않는다.
  - 형식: `{schema:1, kind:'read-cut', subject:'history', era, key, sig, flowId, at}`.
  - 시대(era)가 키에 들어가서, 여러 시대의 같은 `flow-1`이나 `scene-1`이 섞이지 않는다.
- **`hanq:progress:v1:readman-<era>`**: 마지막으로 연 웹툰의 흐름·컷 목록(`{schema, subject, era, v, flows:[{id, name, scenes:[{key,sig}]}], pre}`).
  - 목차의 표시용이다. 웹툰을 다시 열면 실제 문서로 새로 계산하고, 내용이 바뀌었을 때만 바꾼다.
- 읽음은 늘 ‘지금 컷 목록’과 ‘본 컷 기록’으로 계산하고 따로 저장하지 않는다. 같은 내용이면 한 번 읽음이 계속 읽음이다(새로 고침·다시 보기·뒤로 가기).
- 다른 탭이 남긴 기록은 storage 이벤트로 다시 읽는다.

## 4. 표시

- 학습 화면의 흐름 바로 가기 버튼마다: 읽었으면 ‘✓ 읽음’, 읽는 중이면 ‘본 컷 k / n’.
- 학습 화면 머리 아래: 시대 웹툰의 본 컷 수와 절반 기준, 또는 ‘✓ 이 시대 웹툰 읽음’.
- 목차의 시대 카드: 장 읽음이면 ‘✓ 웹툰 읽음’, 아니면 읽은 흐름 수(‘웹툰 흐름 k / n 읽음’). 처음에는 아무것도 없다.

## 5. API

`HanqRead`(CommonJS로도 불러옴)의 함수:
- 컷 목록: `buildManifest(era, flows, entries)`, `extractEntries(doc, flowIds)`
- 보임·머문 시간: `visibleArea(art, frame, view)`, `createDwell(ms)`
- 저장: `recordSeen(store, era, cut, t)`, `loadSeen(store, era)`, `saveManifest(store, man)`, `loadManifest(store, era)`
- 계산: `summarize(man, seen)`, `threshold(n)`, `hash32`
- 확인: `validManifest(m, era)`, `cssVisible(el)`
- 지켜보기:
  - `attachFrame({win, frame, era, flows, store, active, onChange, now, dwellMs, extract, obstructSelector})` → `{stop, tick, reloadSeen, debug}`.
  - `attachStandalone({win, doc, era, flows, store, onChange, ...})`: 맨 위 창이 아니면 `null`.
  - `extract`는 검사에서 문서 대신 넣을 수 있다.

앱의 읽기 전용 고리는 `window.HanqReadUI = {summary(era), flows(era), debug()}`다. 읽음을 강제로 바꾸는 함수는 없다.

## 6. 검사와 한계

- `node scripts/test-read-progress.cjs`: 가짜 창·iframe 위치로 본다.
  - 들어온 화면 = 보인 컷만, 가운데로 바로 가기 = 그 컷만, 0.7초 미만은 세지 않음.
  - 흐름 기준 −1은 읽음 아님, 기준이면 읽음, 장 기준은 따로.
  - 같은 컷 중복 없음, 다시 열어도 유지, 시대끼리 섞이지 않음.
  - svg 외부 그림은 풀리기 전에 세지 않음.
  - 숨은 탭·숨은 iframe·다른 화면·고정 막대에 가린 컷은 세지 않음.
  - 내용 변경, 막힌 저장소.
- `scripts/verify-hanq.cjs`: 10개 시대의 실제 웹툰 문서와 앱 흐름 목록으로 흐름 38개, 컷 200개를 다시 센다.
- 작성자는 실행하지 못했다. 실제 Chrome(320/375/1280, 늦게 뜨는 그림, 실제 스크롤)은 조정자가 확인한다.
- 조선 전기·후기 단독 웹툰은 이번 단계에서 세지 않는다(위 2-1).
- jsdom에는 화면 배치가 없어 화면 검사에서 실제 보임을 재지 않는다.

### 조정자 독립 검증 (2026-10-08 KST, 원본 dev)

- 전체 검증 8,080개 / 실패 0. 읽음 단위 59개, 독립 검증 116개 / 실패 0.
- 실제 격리 Chrome에서 320/375/1280 화면 검증 44개, 단독 웹툰 및 10시대 목록 검증 38개 / 실패 0. 삼국 3/7컷은 미읽음, 4/7컷은 흐름만 읽음(장 32컷 기준 16 미도달), 반복·새로고침 보존, 숨은 탭·CSS 숨김, 바깥 화면 밖 컷 미집계를 확인했다.
- 실제 SVG 외부 그림과 독도·간도 CSS 배경 그림 요청을 지연시켜, 화면에 보이는 중에도 파일 로드 전 0컷, 실제 해독 후 1컷으로 바뀌는 것을 확인했다.
- 기존 500기출·2,500보기 풀이 근거 검사 17,233개, 객관식 이동 54개, 기출 이동 112개, 오답 저장 독립 65개, 모의 회차 독립 182개·저장 무결성 18개 / 실패 0. 실제 모의 화면 129개, 동시 탭 30쌍 + 추가 7상황 / 실패 0.
- 기존 media 620파일 중 공유 comic-scenes.js를 제외한 619파일은 바이트 단위로 그대로다. 원본 학습 그림·문항·보기·출처 데이터는 변경하지 않았다.
- 정적 사이트여서 npm lint/typecheck/build 명령은 정의되어 있지 않다. JS 47개 구문 검사와 위 실제 DOM·브라우저 검증을 실행했다.
