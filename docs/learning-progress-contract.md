# 학습 기록 저장 계약 (media/learning-progress.js) — 단계 A

브라우저 안에서만 쓰는 학습 기록 저장소와 **나만의 오답노트**(`#wrongnotes`)의 계약이다.
로그인·서버·결제·기기 간 동기화는 없다. 다음 단계(B: 시간제 미니 20 / 정식 50 회차)는 이 어댑터를 그대로 다시 쓴다.

## 1. 저장 위치와 키

모든 키는 `hanq:`로 시작한다. 이 밖의 키는 읽지도, 바꾸지도, 지우지도 않는다.

| 키 | 내용 | 쓰는 방식 |
| --- | --- | --- |
| `hanq:att:v1:<attemptId>` | 채점 기록 한 건(attempt) | 한 번 쓰면 고치지도 지우지도 않음. 탭마다 서로 다른 키로 쓰므로 여러 탭이 함께 써도 덮어쓰지 않음 |
| `hanq:progress:v1:quiz` | 빈칸의 풀던 상태 | 읽고 → 합치고 → 쓰기. 문항별로 `at`(밀리초)이 더 큰 쪽이 남음 |
| `hanq:progress:v1:mock` | 실전 모의의 풀던 상태 | 위와 같음 |
| `hanq:progress:v1:wrongretry` | 오답 다시 풀기 줄(지금 하는 것 하나) | 위와 같음(통째로) |
| `hanq:progress:v1:run-<runId>` | 모의고사 회차(`docs/run-controller-contract.md`) | 잠금 창구 안에서만 |
| `hanq:progress:v1:read-<era>-<hash>` | 웹툰에서 실제로 본 컷 하나(`docs/read-progress-contract.md`) | 한 번 쓰면 바꾸지 않음 |
| `hanq:progress:v1:readman-<era>` | 마지막으로 연 웹툰의 흐름·컷 목록(목차 표시용) | 내용이 바뀌었을 때만 바꿈 |
| `hanq:probe` | 시작할 때 저장 가능 여부를 확인하려고 잠깐 썼다가 곧바로 지움 | — |

오답 목록(아직 못 풂·해결·옛 기록)은 **저장하지 않는다**. 채점 기록에서 그때그때 계산하므로 다른 탭이나 새로 고침 뒤에도 같은 결과가 나온다.

## 2. 채점 기록(attempt) 형식 — schema 1

```json
{
  "schema": 1, "kind": "attempt", "id": "a<시각36진수><난수36진수>",
  "subject": "history",
  "mode": "quiz | mock",
  "source": "quiz | mock | wrong-retry | run",
  "questionId": "legacy-goryeo-003 | check-05-12 | exam-72-47",
  "contentVersion": "<문항의 v>", "reviewVersion": "<문항의 rv> | null",
  "optionId": "<빈칸 보기 ID> | exam-RR-NN-option-k",
  "choice": "1–5(실전 모의) | null",
  "correct": true,
  "chapter": "goryeo | null", "era": "goryeo | null",
  "submissionId": "<제출 ID>", "runId": "<회차·다시 풀기 ID> | null",
  "rankEligible": false,
  "ts": 1791417600000
}
```

- 실전 모의의 `optionId`는 반드시 같은 문항의 `<questionId>-option-1…5`여야 한다.
- `ts`는 실제로 채점한 시각(밀리초)이다. 예전 기록에 날짜를 지어 붙이지 않는다. 화면에서는 한국 시간(UTC+9)으로 `YYYY.MM.DD HH:MM`만 보인다.
- **기록 ID**: `a<시각36진수><난수36진수><저장소 일련번호>`. 이미 있는 키(저장소·이 탭 메모리·캐시)와 겹치면 `x<번호>`를 붙여 늘린다. 시계·난수가 같은 두 탭이 함께 써도 먼저 쓴 기록을 덮어쓰지 않는다(아주 드물게 두 탭이 같은 순간 같은 키를 확인하고 쓰는 경쟁은 막지 못한다. localStorage에 원자적 ‘없을 때만 쓰기’가 없기 때문).
- **과목 구분**: 같은 제출 판정과 오답 묶음은 모두 `noteKey(subject, mode, questionId)` = `subject|mode|questionId` 기준이다. subject를 비우면 `history`가 된다. 다른 과목의 같은 ID 기록과 섞이지 않고, 다른 과목에서 맞혀도 한국사 오답이 해결되지 않는다. 이 앱은 다른 과목 내용을 만들지 않는다. 다른 과목 기록이 있어도 지우지 않고 그대로 두며, 오답노트 화면은 `{subject:'history'}`로만 계산한다.
- **같은 제출은 한 번**: 과목·종류·문항·`submissionId`가 같으면 다시 쓰지 않고 이미 있는 기록을 돌려준다(버튼을 두 번 눌러도 한 건).
  - 빈칸·실전 모의: `submissionId = <문항 상태의 sid>-<채점 횟수>`. sid는 풀던 상태와 함께 저장돼 새로 고침 뒤에도 이어진다. ‘처음부터 다시’를 누르면 새 sid가 생긴다.
  - 오답 다시 풀기: `submissionId = <runId>-<questionId>`이고 `runId`도 함께 남긴다.
- **rankEligible**: `source: 'run'`이면서 호출하는 쪽이 `rankEligible: true`를 넘길 때만 true가 된다. 빈칸·실전 모의·오답 다시 풀기는 늘 false다. 순위·점수 계산은 이 단계에 없다(D 단계).
- 같은 문항을 여러 번 틀리면 기록도 여러 건 남는다. 맞혀도 앞의 틀린 기록은 지우지 않는다.

## 3. 오답 상태 (wrongNotes(lookup, opts))

`lookup(mode, questionId, subject)`는 지금 앱에 있는 문항을 돌려주고, 없으면 null을 돌려준다. 문항 그 자체(`{v, options}`)든 앱의 감싼 꼴(`{v, item:{options}}`)이든 된다. `opts.subject`를 주면 그 과목만 계산한다.
보기 목록이 있으면 기록마다 **실제 보기인지** 확인한다. 내용 버전이 같은데 보기 ID가 지금 문항에 없거나, 저장된 `correct`가 그 보기의 실제 정답 여부와 다르면 그 기록은 지우지 않고 계산에서만 뺀다(`invalid-option` 알림). 보기 목록이 없는 lookup(`{v}`만)이면 이 확인은 건너뛴다.
틀린 적이 있는 문항만 아래 다섯 중 하나가 되며, 과목·종류·문항마다 항목이 하나다.

| 상태 | 뜻 | 다시 풀기 |
| --- | --- | --- |
| `unresolved` 아직 못 풂 | 지금 내용(v)으로 실제 오답 보기를 골랐고, 그 뒤 같은 내용으로 실제 정답을 고른 적이 없음 | 넣음 |
| `resolved` 해결 | 지금 내용으로 틀린 뒤 같은 내용으로 맞힘(기록은 그대로) | ‘지금까지 틀린 문제 전체’에만 넣음 |
| `stale` 내용이 바뀐 옛 기록 | 유효한 오답이 모두 예전 내용(v가 다름) | 넣지 않음, 접힌 ‘옛 기록’에만 보임 |
| `invalid` 맞지 않는 기록 | 지금 내용 버전이라 적혀 있지만 보기·정답 표시가 지금 문항과 맞지 않는 오답뿐 | 넣지 않음, 접힌 ‘옛 기록’에만 보임 |
| `missing` 빠진 문제 | 지금 앱에 없는 문항(lookup이 모르는 다른 과목 포함) | 넣지 않음, 접힌 ‘옛 기록’에만 보임 |

해결된 뒤에 다시 틀리면 다시 `unresolved`가 된다. 항목마다 `subject`·`wrongCount`(모든 틀린 기록)·`activeWrongCount`(지금 유효한 오답)·`invalidCount`·`attemptCount`·`firstWrongAt`·`lastWrongAt`·`lastAttemptAt`·`lastWrongOptionId`(지금 유효한 마지막 오답 보기, 카드 풀이에 씀)·`attempts`(시각순)를 함께 준다.

오답이 0이어도 상황에 따라 다르게 알린다. 지금 내용으로 틀렸다가 맞힌 문제가 있을 때만 축하한다. 옛 기록(`stale`·`invalid`·`missing`)뿐이면 “지금 다시 풀 수 있는 오답 0개”와 “옛 기록은 맞힌 것으로 치지 않음”을 알린다. 다시 풀기 끝 화면도 같다.

## 4. 풀던 상태(progress) 형식

```json
{ "schema": 1, "kind": "progress", "view": "quiz", "updatedAt": 1791417600000, "data": { … } }
```

- `quiz.data`: `entries{questionId: {v, attempt, selected, checked, correct, graded, tries, sid, at} | {cleared:true, at}}`, `sets{chapterId:{set,at}}`, `pos{"chapter|part|set":{i,at}}`, `attempt`.
- `mock.data`: `entries{examId: {v, selected, checked, correct, graded, tries, sid, at} | {cleared:true, at}}`, `choices{chapterId:{scope,set,at}}`, `pos{"chapter|part|scope|set":{i,at}}`.
- `wrongretry.data`: `{run:{id, order, list, era, mode, startedAt, queue:[{subject, mode, questionId, contentVersion}], index, answers{questionId:{selected, graded, correct}}} | null, at}`.
  되살릴 때 다음 경우에는 이어 풀지 않고 알린다(채점 기록은 그대로): 줄이 배열이 아님, 같은 `subject|mode|questionId`가 두 번, 형식이 틀린 칸, history가 아닌 과목, 범위를 벗어난 index.
  답은 지금 문항(같은 내용 버전)에 실제 있는 보기만 받고, `correct`는 저장값을 버리고 실제 보기로 다시 계산한다.
- 저장된 사전(`entries`·`sets`·`pos`·`choices`·`answers`)의 키는 자기 속성만 읽는다. `constructor`·`__proto__`·`prototype` 같은 이름이나 카탈로그에 없는 ID는 건너뛰고 알린다(앱이 멈추지 않음).
- 되살릴 때 `correct`는 저장된 값을 믿지 않고 지금 문항의 정답으로 다시 계산한다. `v`가 지금과 다르거나 보기 ID가 지금 문항에 없으면 그 풀던 상태만 버리고(채점 기록은 그대로) 오답노트에 개수를 알린다.
- `{cleared:true, at}`는 ‘이 묶음 기록 지우고 처음부터’의 표시(묘비)다. 다른 탭의 예전 상태와 합쳐져도 지운 상태가 되살아나지 않는다.
- 고르기·바로 가기·이전/다음·새로 고침·묶음 바꾸기는 풀던 상태만 저장하고, **채점 기록은 만들지 않는다**.

## 5. 어댑터 API (`window.HanqProgress`, Node에서는 `require('./media/learning-progress.js')`)

| 이름 | 설명 |
| --- | --- |
| `SCHEMA`, `KEYS{prefix, attempt, progress}`, `SOURCES` | 상수 |
| `store` | 앱이 쓰는 기본 저장소(브라우저에서만, 다른 탭의 `storage` 이벤트를 받음) |
| `create({storage, now, random, listen})` | 저장소를 새로 만든다(시험·다음 단계 컨트롤러용) |
| `validateAttempt(o)` · `kst(ts)` · `memoryStorage()` · `noteKey(subject, mode, questionId)` · `safeKey(k)` | 도우미 |
| `s.recordAttempt(input)` | `{ok, duplicate, attempt, persisted}`. 형식이 틀리면 `{ok:false, error}` |
| `s.attempts({mode, questionId, subject, source})` | 얼린(고칠 수 없는) 기록 목록. 시각순 |
| `s.wrongNotes(lookup, {subject})` | 3절 |
| `s.loadProgress(view)` · `s.updateProgress(view, prev => next)` | 4절. `update`는 쓰기 직전에 다시 읽는다. 결과 `{ok, persisted, readOnly?}` |
| `s.mergeEntries(a, b)` | 키마다 `at`이 더 큰 쪽 |
| `s.snapshotQueue(items, 'fixed' \| 'random')` | 다시 풀기 줄. 문항 ID·내용 버전을 고정한 얼린 배열이며 중복과 `currentVersion` 없는 항목은 뺀다 |
| `s.status()` | `{backend, blocked, persistent, writeFailed, corruptKeys, futureKeys, readOnlyViews, notices[{code,text}]}` |
| `s.onChange(fn)` · `s.handleStorageEvent(e)` · `s.invalidate()` | 변경 알림 · 다른 탭 반영 |

앱 쪽 읽기 전용 고리는 `window.HanqMyPage = {open(), notes(), run(), staleDrafts()}`이다.

다음 단계(B) 컨트롤러가 쓸 방법: 회차를 마칠 때 문항마다 `recordAttempt({source:'run', runId, submissionId:<runId>-<questionId>, rankEligible:<조건>})`를 부른다. 회차 상태는 새 진행 기록(예: `view:'run'`)에 두면 된다.
B에서 넓힌 것: 답하지 않은 문항은 `optionId:null` + `unanswered:true`(+ `correct:false`)로 남길 수 있다. 이 꼴은 **`source:'run'`이고 `runId`·`submissionId`가 올바른 ID(`^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$`, 공백 없음)일 때만** 받는다. 보기를 골랐다면서 unanswered인 입력, 불리언이 아닌 unanswered, 공백 ID는 고쳐 받지 않고 거절한다. 모든 submissionId에는 공백이 들어갈 수 없다. 예전 기록에는 `unanswered`가 없어도 된다. 오답 계산(`judge`)에서는 같은 내용 버전이면 유효한 오답이다. 보통 빈칸·실전 모의의 임시 답은 지금처럼 절대 채점·기록하지 않는다.
`s.progressViews(prefix)`는 진행 기록 화면 이름 목록을 준다(예: `'run-'` → 모의고사 회차들). 회차 계약은 `docs/run-controller-contract.md`.

## 5-1. 오답 카드의 풀이

오답노트의 각 카드(`unresolved`·`resolved`)에는 접힌 `<details class="wn-review" data-review-question="…">` ‘정답과 보기 풀이 보기’가 있다(누르는 높이 44px).
펼칠 때 그 카드만 그린다. 미리 다 그리지 않으므로 카드가 많아도 화면이 무거워지지 않는다. 그리는 것은 빈칸·실전 모의와 같은 `HanqQuizReview.render(item, lastWrongOptionId)`이고, 기출이면 공통 자료(72-47·48)·문제 그림·크게 보기·출처, 빈칸이면 문제 글·외울 말을 함께 보인다.
이미 채점한 문제의 풀이라 정답을 보여도 된다. 새로 시작한 다시 풀기는 지금처럼 ‘정답 확인’ 전에는 풀이를 보이지 않는다.
오답노트로 들어가거나 다시 풀기를 시작·이동·멈출 때는 열려 있던 문제 크게 보기를 닫고(`closeMockZoom(true)`) 새 제목에 초점을 옮긴다.

## 6. 고장·예외 처리

| 경우 | 처리 |
| --- | --- |
| localStorage 접근 자체가 막힘(SecurityError, 시작할 때 시험 쓰기 실패) | 이 탭의 메모리로 바꾸고 `blocked` 알림. 첫 저장 때 화면에 한 번, 오답노트에는 늘 보임 |
| 용량 초과(QuotaExceededError)·쓰기 실패 | 그 키부터 메모리에 두고 `quota`/`write` 알림을 한 번. 그전에 쓴 기록은 그대로. 아무것도 잘라 내거나 지우지 않음 |
| 깨진 JSON·형식이 틀린 기록 | 지우지 않고 그대로 두고, 계산에서만 빼며 `corrupt` 알림 |
| 더 새 형식(schema > 1) 기록 | 지우거나 바꾸지 않고 건너뜀(`future` 알림) |
| 더 새 형식·깨진 진행 기록 | 읽지 않고 **덮어쓰지 않음**(읽기 전용). 이 탭의 메모리에만 새로 씀 |
| 문항 내용이 바뀜(v 다름)·문항이 빠짐 | 기록은 `stale`/`missing`으로 남고, 다시 풀기·해결 계산에서 빠짐. 이미 시작한 다시 풀기 줄에 이런 문항이 있으면 그 자리에서 건너뛴다고 알림 |
| 여러 탭 | 기록은 키가 서로 달라 충돌하지 않음. 진행 기록은 읽고 합쳐 씀. 다른 탭의 `storage` 이벤트가 오면 오답노트 목록을 다시 그림. 빈칸·실전 모의는 지금 띄운 문항을 건드리지 않고, 이 탭보다 나중에 바뀐 다른 문항만 반영 |

## 7. 검사

- `node scripts/test-learning-progress.cjs`: 어댑터 단위 검사(가짜 저장소). 형식 검사, 같은 제출 한 번, 반복 오답, 해결 뒤 기록 유지, 내용 변경·빠진 문항, 깨진·새 형식·남의 키 보존, 막힘·용량 초과, 두 탭 합치기, 고정 줄(첫 문제를 맞혀도 둘째를 건너뛰지 않음), 무작위 줄 중복 없음, 한국 시간을 본다.
- `JSDOM_PATH=… node scripts/verify-hanq.cjs`의 4절 끝: 화면 검사. 고르기만으로는 기록이 생기지 않는지, 빈칸·실전 모의 오답 기록, 새로 고침 흉내(저장소를 새 창에 옮겨 담음)로 위치·임시 답·채점 결과·범위가 되살아나는지, 처음부터 다시 해도 기록이 남는지, 오답노트 개수·카드·풀이 숨김, 고정 줄 다시 풀기·다시 풀기 중 새로 고침, 시대·종류 거르기, 다른 탭의 storage 이벤트, 무작위 줄, 축하 화면, 결과 화면 입구, 깨진 기록·남의 키 보존, 막힌 저장소를 본다.
- 작성자는 이 검사들을 **실행하지 못했다**. 결과는 조정자가 따로 실행해 확인한다. 실제 브라우저(두 탭, 시크릿 창, 용량 초과)는 jsdom 흉내와 다를 수 있다.

## 8. 남은 한계(이 단계에서 하지 않은 것)

- 기기 간 동기화·백업·내보내기는 없다. 사이트 데이터를 지우면 기록이 사라진다.
- 기록은 오래돼도 자동으로 지우지 않는다(저장 공간이 차면 메모리로 넘어가며 알림만 한다). 기록 한 건은 약 0.4KB다.
- 웹툰 읽음 표시(C 단계, 시간제 컨트롤러 다음으로 미룸), 시간제 미니 20 / 정식 50 회차(B), 학습 달력·연속 학습·점수·순위(D)는 이 단계에 없다.
- 빈칸에서 맞힌 뒤 1초 자동 넘김 같은 화면 동작은 예전 그대로다. 저장은 그 동작에 끼어들지 않는다.

## 조정자 독립 검증 — 2026-10-08 05시 전후 KST

작성 세션 정상 종료 후 실제 실행했다. 어댑터 단위 54/0, 전체 검증 7,990/0, 독립 저장 계약 37/0, 독립 DOM 28/0, JavaScript 구문 45/0, 기출 탐색 회귀 112/0. 별도 전용 Chrome에서 23/0: 모바일 320·375·1280px, 기존 답/위치 새로 고침, 두 탭 실제 storage 이벤트, 고정 재시도 순서, 기존 공동 제시문과 개별 이미지/모든 보기 풀이, Enter 키, 저장 접근 차단 시 명시적 이 탭 저장. 기존 media 파일 618개는 e6bac9c와 바이트 동일. 사용자 브라우저 및 외부 계정은 건드리지 않았다. B/C/D는 아직 완료된 것으로 주장하지 않는다.
