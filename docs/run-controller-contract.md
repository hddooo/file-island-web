# 모의고사 회차 계약 (media/run-controller.js)

오답으로 만드는 모의고사(미니 20 / 실전 50)를 만들고, 답을 저장하고, 시간을 재고, 일시정지하고, 최종 채점하는 하나의 컨트롤러다.
화면(DOM)과 떨어져 있고 시계·난수를 넣어 줄 수 있어, 80분을 기다리지 않고 시험할 수 있다(`scripts/test-run-controller.cjs`).
저장은 기존 학습 기록 저장소(`media/learning-progress.js`, `docs/learning-progress-contract.md`)를 그대로 쓴다. 로그인·서버·결제는 없다.

## 1. 상품 설정 (한곳: `HanqRun.PRODUCTS`)

| key | 종류 | 문항 | 시간 | 시간 근거 | 순위 대상(rankEligible) | 앞으로의 가격(계획) |
| --- | --- | --- | --- | --- | --- | --- |
| `personal-mini` | 개인 오답 | 20 | 30분 | HanQ 연습 규칙(공식 시간 아님) | **false(늘)** | 500원 |
| `personal-formal` | 개인 오답 | 50 | 80분 | 한국사능력검정시험 심화 50문항 80분 — https://www.historyexam.go.kr/pageLink.do?link=apyexmInfo | **false(늘)** | 1000원 |
| `fixed-mini` | 일반 고정 | 20 | 30분 | 연습 규칙 | true(명시) | 없음 |
| `fixed-formal` | 일반 고정 | 50 | 80분 | 공식 | true(명시) | 없음 |

- 순위 대상 여부는 이 표의 `rankEligible`만 본다. 가격이나 이름으로 짐작하지 않는다. 개인 오답 회차는 설정과 상관없이 컨트롤러가 false로 고정하고, true로 적힌 기록은 깨진 기록으로 본다.
- 가격은 **앞으로의 계획일 뿐**이다. 지금은 구매·결제·영수증·이용권이 없고, 회차에도 가격을 적지 않는다(`purchase: null` 자리만 있음). 나중에 서버 주문을 만들 때 그 시점의 가격을 주문에 따로 남겨야 하며, 지금 클라이언트 기록은 결제 보안의 근거가 될 수 없다.
- 회차를 만들 때 문항 수·시간·규칙 버전(`rulesVersion`)을 회차 안에 복사한다. 나중에 설정을 바꿔도 이미 만든 회차의 채점·규칙·문항 수는 그대로다.
- 일반 고정 회차(`createFixedRun`)는 컨트롤러에만 있고 이번 화면에는 입구가 없다. 순위 계산(다음 단계)이 쓸 수 있게 만들어 둔 것이다.

## 2. 개인 오답 회차 만들기

1. 오답 모음: `store.wrongNotes(lookup, {subject:'history'})`에서 넣을 범위(기본 `unresolved`, 사용자가 고르면 `all` = 해결한 오답 포함)에 든 문항만 고른다. 지금 앱의 같은 내용 버전으로 실제 회차 문항을 만들 수 있어야 한다.
   - 과목·종류·문항 ID마다 하나라서 같은 문제를 여러 번 틀려도 1문제다.
   - 내용이 바뀐 옛 기록(stale)·맞지 않는 기록(invalid)·빠진 문제(missing)·만들 수 없는 문항은 세지 않고, 수를 따로 알린다(`excluded`). 기록은 지우지 않는다.
   - 빈칸·확인문제(빈칸 카탈로그) 오답과 기출 오답을 모두 넣는다. 종류가 달라도 빠뜨리지 않고, 화면·결과에서 출처를 나눠 보인다.
2. 서로 다른 오답이 **10문제 미만이면 만들 수 없다**(`MIN_WRONGS = 10`).
3. 정원(20/50)보다 많으면 사용자가 고른 방법으로 정원만큼 넣는다.
   - `recent`: 마지막으로 틀린 시각이 늦은 순이고, 같으면 `subject|mode|questionId` 순으로 정해 결과가 늘 같다.
   - `random`: 같은 문제를 두 번 뽑지 않는 무작위다.
   - 넣지 못한 오답은 오답노트에 그대로 남는다.
4. 정원보다 적으면 남은 자리를 **보유 기출 500문항(제70–79회) 중 최신 회차부터** 채운다.
   - 순서는 제79회 → 제70회, 같은 회차 안에서는 문항 번호 순이다. 이미 넣은 기출 오답과 같은 ID는 건너뛴다.
   - ‘최신’은 앱에 수록된 기출(제70–79회) 중 회차 번호가 큰 것을 말한다(회차 번호는 시행 순서). 수록되지 않은 회차를 말하지 않는다. 문제 그림 속 신문·전시 날짜는 시험 날짜가 아니다.
   - 기출이 모자라면 없는 문제를 지어내지 않는다. 적은 문항으로 만들고 `shortBy`(모자란 수)를 알린다.
5. 회차 안의 순서: 고른 오답(고른 순서) → 보충 기출(위 순서). 빈칸·확인문제의 보기 순서는 만들 때 한 번 섞어 고정한다. 기출 보기는 원래 ①–⑤ 순서(`exam-RR-NN-option-k`)다.

`preflight({product, scope, order})`는 만들기 전에 수만 미리 계산한다. 무작위로 골라도 들어가는 수는 같다.
돌려주는 값: `eligibleWrong`, `quizWrong`, `mockWrong`, `selectedWrong`, `selectedQuiz`, `selectedMock`, `leftOutWrong`, `fill`, `fillAvailable`, `total`, `shortBy`, `canCreate`, `excluded{resolved, stale, invalid, missing, unbuildable}`, `fillRounds{from,to}`, `poolRounds{newest,oldest}`, `durationMin`, `durationPolicy`.

## 3. 저장 형식

키는 `hanq:progress:v1:run-<runId>`로 회차마다 하나다(`runId` = `r` + 시각 36진수 + 난수, 이미 있으면 번호를 더 붙임). 진행 기록 겉모양 `{schema:1, kind:'progress', view:'run-<runId>', updatedAt, data}`의 `data`가 회차다.

```json
{
  "schema": 1, "kind": "run", "id": "r…", "subject": "history",
  "product": { "key": "personal-mini", "mode": "personal", "size": 20, "durationMs": 1800000, "durationPolicy": "practice",
               "label": "오답 미니모의고사", "rankEligible": false, "rulesVersion": "hanq-run-1" },
  "seq": 3, "createdAt": 1791417600000, "kstDate": "2026-10-08", "title": "26/10/08 · 3회차 오답 미니모의고사",
  "selection": { "scope": "unresolved", "order": "recent", "eligibleWrong": 14, "quizWrong": 12, "mockWrong": 2, "selectedWrong": 14,
                 "selectedQuiz": 12, "selectedMock": 2, "leftOutWrong": 0, "fill": 6, "shortBy": 0,
                 "fillRule": "latest-official-round-desc", "fillRounds": {"from": 79, "to": 79}, "poolRounds": {"newest": 79, "oldest": 70} },
  "items": [ { "n": 0, "subject": "history", "mode": "mock", "questionId": "exam-72-47", "contentVersion": "…", "origin": "wrong-mock",
               "pointsKind": "official", "points": 2, "source": {"exam": 72, "number": 47}, "chapter": null, "era": "…",
               "optionIds": ["exam-72-47-option-1", "…", "exam-72-47-option-5"] } ],
  "status": "ready | active | final", "startAt": null, "endAt": null, "current": 0,
  "answers": { "0": { "optionId": "exam-72-47-option-2 | null", "at": 1791417660000 } },
  "pause": { "count": 1, "log": [ { "at": 0, "until": 0, "endedAt": null } ] },
  "submissionId": "sub-r… | null",
  "final": { "at": 0, "reason": "submit | expired", "rulesVersion": "hanq-run-1",
             "graded": [ { "n": 0, "mode": "mock", "questionId": "…", "origin": "…", "optionId": null, "answered": false, "correct": false,
                           "mismatch": false, "correctOptionId": "…", "pointsKind": "official", "points": 2, "earned": 0 } ],
             "score": { "questions": 20, "graded": 20, "correct": 0, "wrong": 0, "answered": 0, "unanswered": 0, "mismatch": 0,
                        "official": {"count": 0, "correct": 0, "earned": 0, "max": 0}, "practice": {"count": 0, "correct": 0, "earned": 0, "max": 0},
                        "total": {"earned": 0, "max": 0, "percent": 0} } },
  "recorded": false, "purchase": null, "updatedAt": 0
}
```

- `origin`: `wrong-quiz`(빈칸·확인문제 오답) · `wrong-mock`(기출 오답) · `fill`(최신 기출 보충) · `fixed`(고정 회차의 기출).
- **회차 번호와 원래 출처는 다르다.** `seq`·`title`은 HanQ가 붙인 내 회차 순서다. 기출의 원래 회차·번호는 문항마다 `source{exam, number}`에 있다. 빈칸·확인문제에는 공식 회차·번호를 지어 붙이지 않는다(`source:null`).
- 회차 번호 `seq`는 지금 있는 회차 중 가장 큰 번호 + 1이다. 두 탭이 같은 순간 만들면 같은 번호가 날 수 있다(드묾, 회차 ID는 다름).
- **채점 전 회차 기록에는 정답이 없다.** 정답(`correctOptionId`)은 채점할 때 문항 카탈로그에서 확인해 `final`에만 적는다. 다만 문항 카탈로그(JS)가 브라우저에 있으므로 이것은 보안 경계가 아니다.
- 깨진 회차는 열지도, 덮어쓰지도, 순위 결과(`finalResults`)에 넣지도 않는다. 목록에는 그 수만 알리고 지우지 않는다.
- `validRun`이 보는 것: 지금 설정이 아니라 **회차에 복사한 값과 key의 성격(`KEY_CLASS`)**이다. 그래서 가격을 바꿔도 지난 회차는 그대로 유효하다.
  - 과목: 지금은 history만. 다른 과목 회차를 한국사로 그리지 않는다.
  - 상품: 아는 product key만 받는다. key별 종류·순위 대상·문항 수가 고정된 값과 같아야 한다. 개인 회차를 fixed·rankEligible:true로 바꾼 기록은 받지 않는다.
  - 시간·규칙: 시간 정책, 알려진 rulesVersion만.
  - 회차 정보: 제목·한국 날짜가 seq·createdAt과 맞아야 하고, `purchase:null`이어야 한다.
  - 문항: 번호 `n`이 자리와 같고, 과목이 같고, 출처와 종류가 맞아야 한다(오답 빈칸=quiz, 기출 오답·보충·고정=mock).
    - 기출: 원래 배점 1·2·3, 보기 ID는 정확히 `<ID>-option-1…5` 순서.
    - 빈칸: 1점, 보기 2–6개.
    - 보기 ID는 겹치지 않고, 같은 문항은 두 번 들어가지 않는다.
  - 개인 회차의 고른 수·보충 수·모자란 수(`shortBy = size − 문항 수`)가 실제 문항과 같아야 한다(부분 회차도 정직하게).
  - 상태별:
    - ready: 시간·답·일시정지·결과가 없어야 한다.
    - active/final: `endAt − startAt = 회차에 복사한 시간`(일시정지로 늘지 않음). 일시정지 기록마다 `until = min(at+5분, endAt)`, 횟수 = 기록 수 ≤ 3. 답은 있는 번호·있는 보기만.
    - final: `submissionId = 'sub-'+id`, 이유·시각(시간 종료면 = endAt, 제출이면 마감 전), 규칙 버전이 맞아야 한다. 채점 줄마다 번호·문항·종류·출처·배점이 회차와 같고, 맞힘·점수가 줄 안에서 앞뒤가 맞아야 한다. **점수 전체가 채점 줄로 다시 계산한 값과 같아야** 한다(지금 설정이 아니라 저장된 줄 기준).
  - 기기 시계가 거꾸로 간 것만으로는 깨진 기록으로 보지 않는다.

## 4. 시간 · 일시정지 · 마감

- `start`: 처음 한 번만 `startAt = now`, `endAt = now + durationMs`를 절대 시각으로 저장한다. 다시 눌러도 바뀌지 않는다.
- **모든 변경은 먼저 마감을 확인한다**(`answer`·`go`·`pause`·`resume`·`submit`·`tick`·`get`). `now ≥ endAt`이면 `endAt` 전에 저장된 답만으로 채점(`reason:'expired'`, `final.at = endAt`)하고 그 변경은 거절한다(`reason:'expired'`).
- 화면은 1초마다(이 화면이 열려 있을 때), 그리고 화면이 다시 보이거나(`visibilitychange`), `pageshow`, `focus`, 앱을 다시 열 때(`tickAll`) 확인한다. 브라우저가 닫혀 있는 동안에는 아무것도 실행되지 않으므로, 다시 열 때 바로 채점한다.
- 일시정지는 **화면만 가린다.** 시험 시간은 멈추지 않는다.
  - 회차당 3번, 한 번에 `until = min(now + 5분, endAt)`까지다. 가린 동안에는 답·이동을 받지 않고, 일찍 풀 수 있다(`resume`).
  - `until`이 지나면 저절로 풀린다. 가린 채 마감이 오면 그대로 채점한다.
  - 가린 채 다시 누르거나, 시작 전·끝난 뒤에 누르면 거절되고 횟수도 바뀌지 않는다.
  - 마감을 늘리는 일은 없다.
- 시계는 이 기기의 시계다. 시계 조작을 막는 보안 장치가 아니다.

## 5. 여러 탭 · 겹친 변경 · 최종 결과

**동기 컨트롤러(`HanqRun.create`)는 혼자서는 탭 사이에 안전하지 않다.**
- localStorage의 ‘읽고 → 고치고 → 쓰기’는 실제 Chrome의 서로 다른 탭(렌더러) 사이에서 한 덩어리로 실행되지 않는다.
- 조정자의 실제 Chrome 검사에서 두 탭이 동시에 답을 저장하면 30번 모두 한쪽 답이 사라졌다.
- 그래서 앱은 회차를 바꾸거나, 마감이 지나 채점될 수 있는 **모든 호출**을 잠금 창구로만 부른다.

잠금 창구는 `HanqRun.createSerialized({core|store, catalog, now, random, locks, lockName})`이다.
- 잠금은 `navigator.locks.request('hanq:run:history', {mode:'exclusive'}, …)` **하나**다. 과목마다 이름이 하나이고, origin 전체에서 같다.
- 그 안에서 저장소 캐시를 비우고 동기 컨트롤러를 한 번 부른다. 잠금 안에서 다시 잠금을 청하지 않는다(겹치면 거절).
- 잠금 안에서 부르는 것: `createPersonalRun` · `createFixedRun` · `start` · `answer` · `go` · `pause` · `resume` · `submit` · `tick` · `tickAll` · `get`(마감 채점이나 채점 기록 마무리가 일어날 수 있음). 모두 Promise를 돌려준다.
- 잠금 없이 읽기만 하는 것(숨은 변경 없음): `peek` · `list` · `finalResults` · `preflight` · `remaining` · `pauseState`.
- 잠금을 **얻은 뒤에** 시각·마감·상태를 본다. 그래서 마감 전에 줄 서 있던 답도 잠금을 얻을 때 마감이 지났으면 거절되고, 그때까지의 답으로 결과 하나가 정해진다.
- 만들기도 같은 잠금 안이라, 같은 시각에 두 탭이 만들어도 회차 ID·번호(seq)가 겹치지 않는다. 일시정지 3번 제한도 두 탭이 동시에 눌러 늘릴 수 없다.

방식(`mode`, `capability()`로 볼 수 있음):

| mode | 언제 | 동작 |
| --- | --- | --- |
| `locks` | Web Locks가 있음(https · 127.0.0.1 같은 안전한 문맥의 최신 브라우저) | 탭 사이 직렬화 |
| `memory` | 저장소가 막혀 이 탭 메모리뿐 | 다른 탭과 나누지 않으므로 이 탭 안에서 줄 세우기 |
| `unavailable` | 여러 탭이 나누는 localStorage인데 Web Locks가 없음 | 회차를 만들거나 바꾸는 호출은 모두 `{ok:false, reason:'no-lock'}`. 화면은 그 사실을 알리고 버튼을 끈다. 안전하지 않은 동기 쓰기로 몰래 넘어가지 않는다. 읽기·오답노트·다시 풀기는 그대로 된다 |

화면:
- 누르면 잠금을 기다리는 동안 그 회차 화면의 버튼을 끈다(`aria-busy`).
- 결과가 오면 그 회차 화면에 아직 있을 때, 그리고 더 새 갱신이 없을 때만 다시 그린다. 다른 화면으로 갔으면 옛 회차를 그리지 않는다.
- 1초 타이머는 잠금 없이 `peek`로 남은 시간만 고친다. 마감이 지났거나 일시정지 상태가 바뀌었거나, 다시 보이기·pageshow·focus·다른 탭의 storage 이벤트·앱 시작이 있으면 잠금 창구로 다시 읽는다.

남은 한계:
- Chrome에서 localStorage 값이 다른 렌더러에 퍼지는 것은 비동기다. 잠금을 넘겨받은 직후 아주 드물게 직전 탭의 쓰기가 아직 안 보일 수 있다는 점은 실제 브라우저 검사로 확인해야 한다.
- 문제가 남으면 다음 대안은 회차 저장만 IndexedDB 트랜잭션으로 옮기는 것이다(이번 단계에서는 하지 않음).
- 이 잠금은 같은 브라우저 안의 탭끼리를 위한 것이다. 저장소·시계를 손으로 고치는 것을 막는 보안 장치가 아니다.

동기 컨트롤러 안의 처리:
- 모든 변경은 `store.updateProgress`의 콜백 안에서 **저장된 최신 회차를 읽어 그 위에서** 한다. 바뀐 것이 없으면 쓰지 않는다.
- 결과가 앞뒤가 맞지 않으면(`validRun` 실패) 쓰지 않는다.
- 최종 결과는 처음 한 번만 정해진다. 끝난 회차에 다시 제출하면 그대로 돌려준다(`already:true`).
- 문항별 채점 기록은 `recordAttempt({source:'run', runId, submissionId:'<submissionId>-<n>', rankEligible})`로 남긴다. 같은 제출 한 번 규칙 때문에 직접 제출·시간 종료·새로 고침·두 탭이 겹쳐도 한 번뿐이다. 모두 남으면 `recorded:true`로 표시하고, 표시 전에 끊겼다면 다음에 열 때 다시 시도한다(이미 있는 것은 늘지 않음).
- **답하지 않은 문항**은 `optionId:null, unanswered:true, correct:false`로 남긴다.
  - 받는 조건: `source:'run'`이고, `runId`·`submissionId`가 올바른 ID(영문·숫자로 시작, 공백 없음)일 때만.
  - 앞뒤가 안 맞는 입력은 고쳐 받지 않고 거절한다: 보기를 골랐다면서 unanswered, 맞았다면서 unanswered, unanswered가 참/거짓이 아님, 공백 ID.
  - 보통 빈칸·실전 모의의 임시 답은 지금처럼 채점·기록하지 않는다.
- 결과 화면의 문제별 풀이는 답하지 않은 문제(빈칸·확인문제 포함)도 공용 풀이 `R.render(q, optionId||null)`로 그린다. 그래서 실제 보기를 모두 보여 주고(정답 ✓), 고르지 않은 오답을 지어 표시하지 않는다.
- 이 기록이 나만의 오답노트에 그대로 반영된다: 맞힌 오답은 해결, 틀리거나 답하지 않은 문제는 오답.
- 회차를 만든 뒤 문항 내용(버전)이 바뀌면 그 문항은 새 답을 받지 않는다. 채점·점수에서 빼고(`mismatch`), 채점 기록도 남기지 않는다. 고른 답과 회차 기록은 그대로 둔다.

## 6. 점수

- 기출: 한국사능력검정시험 문항의 원래 배점(1–3점)을 이 회차에 든 문항만 더한다(`official`). 근거: https://www.historyexam.go.kr/pageLink.do?link=examGuideline (50문항 100점, 문항당 1–3점).
- 빈칸·확인문제: 공식 배점이 없어 **1문제 1점**(`practice`)으로 셈한다.
- HanQ 연습 점수 `total = official + practice`, 백분율 = earned / max(이 회차에 든 문항 배점의 합, 내용이 바뀐 문항 제외). 공식 시험 점수가 아니고, 100점 만점이라고 하지 않는다.
- 답하지 않은 문항은 틀린 것으로 셈한다.
- 순위 점수(다음 단계)는 이 원점수와 따로 정한다.

## 7. API (`HanqRun`)

- `PRODUCTS`, `POLICY`, `RULES_VERSION`, `SCHEMA`, `validRun(r)`, `kstParts(ts)`, `runTitle(seq, ts, label)`, `catalogFrom(QC, EP)`
- `create({store, catalog, now, random})`가 돌려주는 컨트롤러:
  - `preflight(o)`, `createPersonalRun({product, scope, order})` → `{ok, run}` | `{ok:false, reason:'not-enough-wrongs'|'product'|'storage', preflight?}`
  - `createFixedRun({product, round | questionIds})`
  - `get(id)`, `list()` → `{runs, corrupt}`, `tick(id)`, `tickAll()`
  - `start(id)`, `answer(id, n, optionId|null)`, `go(id, n)`, `pause(id)`, `resume(id)`, `submit(id)` — 모두 `{ok, reason?, run}`. reason: `not-started`·`paused`·`expired`·`final`·`limit`·`option`·`index`·`mismatch`·`corrupt`·`missing`
  - `remaining(run)`, `pauseState(run)` → `{paused, until, left, used, max}`
  - `finalResults({eligibleOnly})`: 끝난 회차마다 처음 정해진 결과 하나. 다음 단계의 순위·학습 기록이 이것만 읽으면 같은 회차로 점수를 여러 번 얻을 수 없다.
- `createSerialized(...)` → 잠금 창구(위 5절). 속성 `mode`·`lockName`·`crossTabSafe`.
- 앱 고리 `window.HanqRunUI`(주소는 `#run/<runId>`, 새로 고침하면 같은 회차로 돌아옴):
  - `open(id)`
  - `controller()`: **앱이 쓰는 바로 그 잠금 창구**. 실제 브라우저 경쟁 검사는 이것으로 한다(예: `Promise.all([HanqRunUI.controller().answer(id,0,a), …])`).
  - `reader()`: 읽기 전용 `{peek, list, finalResults, preflight}`.
  - `capability()`: `{mode, lockName, crossTabSafe}`.
  - `view()`
- 순수 Node 검사는 동기 `create`를 그대로 쓴다. jsdom 화면 검사는 navigator.locks가 없어, 한 창 안에서 같은 이름을 차례로 실행하는 최소 LockManager를 플랫폼 대신 넣는다(앱의 창구 코드는 같음).

## 7-1. 날짜별 모의고사(준비 회차, `#exams`)

- **묶음**: 앱에 수록된 제70–79회 기출만 쓴다. 회차마다 두 가지다:
  - 실전 = 그 회차 원래 1–50번 전부(80분, 심화 시험 시간).
  - 미니 = 원래 1–20번(HanQ가 정한 부분 묶음, 30분 연습 규칙).
  - 문항 수·시간은 `PRODUCTS`의 `fixed-mini`·`fixed-formal`에서 온다. 1–20번(또는 1–50번)이 다 없는 회차는 묶음을 만들지 않는다.
- `preparedSets()`(읽기 전용)는 `{key, product, round, ids, size, durationMin, durationPolicy, label}` 목록을 준다. key = `<상품>|r<회차>|<원래 문항 ID 목록 해시>`라 새로 고침·다른 탭에서도 같다.
- `openPrepared({key, review})`. 잠금 창구에서는 `RCS.openPrepared`이고, 한 잠금 안에서 찾고 없으면 만든다.
  - 처음 열기: 그 묶음의 처음 회차(`reviewOf` 없음)가 있으면 그대로 돌려준다(시작 전·푸는 중·끝 모두). 없으면 순위 대상(`rankEligible:true`) 회차를 하나 만든다. 두 번 누르거나 두 탭이 동시에 열어도 하나다.
  - `review:true`: 처음 회차가 끝난 뒤에만 된다(아니면 `no-final`). 안 끝난 다시 풀기가 있으면 그것을 돌려주고, 없으면 같은 문항의 새 회차를 `rankEligible:false`·`reviewOf:<처음 회차 id>`로 만든다. 처음 회차와 그 결과는 바뀌지 않는다.
- `validRun`:
  - 준비 회차 표시(`selection.preparedKey`)가 있으면 다음을 모두 다시 확인한다.
    - 고정 상품이어야 한다.
    - `selection.round`가 두 자리 정수여야 한다.
    - `selection.questionIds`가 문항 수와 같아야 한다.
    - key가 `<상품 key>|r<round>|hash(실제 문항 ID 목록)`과 정확히 같아야 한다.
    - 문항마다 `mock`·출처 `fixed`·ID `exam-<round>-<번호 두 자리>`가 원래 1–N번 순서여야 하고, `source.exam/number`도 같아야 한다.
    - 하나라도 어긋나면(다른 묶음 key로 바꿈 등) 그 회차는 열지 않는다. 어느 묶음에서도 다시 쓰지 않고, 지우지 않는다.
  - `reviewOf`가 있으면 위 준비 회차 표시도 반드시 있어야 한다. 준비 표시가 없는 예전 `createFixedRun` 회차는 예전처럼 받는다(순위 대상 true, 다시 풀기 없음).
  - `reviewOf`가 있으면 고정 상품·`rankEligible:false`·올바른 다른 회차 id여야 한다.
  - `reviewOf`가 없으면 key의 순위 대상 값과 같아야 한다. 그래서 `rankEligible:false`인 고정 회차는 `reviewOf`가 있어야만 받는다. 개인 회차는 늘 false다.
- 회차 화면(시작·답·이동·시간·일시정지·제출·결과·풀이)은 모의고사 회차 화면을 그대로 쓴다. 결과 화면은 처음 결과(랭크에 들어감)와 다시 풀기(안 들어감)를 나눠 적는다.
- 남은 한계: 미니 20은 실제 시험 구성(50문항)이 아닌 HanQ의 부분 묶음이다. 회차 번호 다툼은 5절과 같다.

## 8. 남은 한계

- 순위 대상 고정 회차의 화면 입구는 ‘날짜별 모의고사’(7-1)이고, 랭크·잔디 계산은 `media/activity-stats.js`에 있다.
- 실제 결제·구매·이용권 없음. 앞으로 유료로 공개하려면 실제로 쓴 기출 문서·사진의 상업적 이용 권리를 먼저 확인해야 한다(공공누리 제4유형: 출처표시·비상업·변경금지 — https://www.data.go.kr/data/15119618/fileData.do).
- 휴대폰 320/375px 화면·실제 브라우저 탭·백그라운드 동작은 조정자의 브라우저 검사로 확인해야 한다(작성자는 실행하지 못함).

## 조정자 실제 실행 검증 — 2026-10-08 05시대 KST

작성 세션 정상 종료 후 독립 실행: 전체 검사 8,034/0, 회차 단위 101/0, 저장 단위 67/0, 독립 회차 경계·마감·기록 182/0, 저장 무결성 18/0, 기존 오답노트 독립 회귀 65/0, 빈칸 이동 54/0, 기출 이동 112/0, 기출 원문·2,500보기·배점·이미지 보존 17,233/0, JavaScript 구문 46/0. 별도 Chrome 154에서 실제 제품 잠금 창구로 동시 답 저장 30회 및 동시 회차 생성·제출·일시중지·잠금 대기 중 마감 등 7개 상황을 실행했고 실패 0. 초기 동시 답 저장에서 30/30 충돌을 재현한 뒤 Web Locks 직렬화로 고쳤다. 화면 폭 320·375·1280px에서 129/0: 9/10 생성 경계, 혼합 20문항/50문항, 답·번호·마감 새로 고침, 화면을 떠난 뒤 복귀, 공통 제시문·개별 이미지 확대, 무응답 포함 모든 보기 최종 풀이, 일시중지 3회와 제한 시간, 실제 탭을 닫고 새 탭으로 만료 회차 재접속. 저장 어댑터 외 기존 미디어 618개는 91d85a8과 바이트 동일. 사용자 브라우저·계정·지갑과 외부 배포를 건드리지 않았다. 읽음 표시와 활동 달력/순위는 별도 다음 단계다.

### 조정자 최종 검증 — 사용자용 고정 회차 연결 (2026-10-08 KST)

- 전체 검사 8,089개 / 실패 0. 회차 단위 125개·저장소 67개·읽음 59개·통계 46개 / 실패 0. JS 48파일 구문 통과.
- 실제 원문 70–79회에서 고정 묶음 20개(10회 × 미니/실전)를 만들며, 독립 검사 59개·준비 회차 저장 무결성 22개 / 실패 0. 준비 표식을 다른 실제 묶음으로 바꾸거나 원문 회차·문항 순서·해시·문항 수를 훼손하면 열지 않고 원래 기록을 그대로 둔다.
- 실제 격리 Chrome 320/375/1280 화면 51개 / 실패 0. 홈의 실제 Enter 키로 목록 열기, 오답 0개에서도 미니20 시작, 한국 날짜·내 회차 번호, 15개 임시 답 새로고침 보존, 직접 번호 이동·이전, 5개 미응답 제출 확인, 최초 점수 135점, 결과 다시 열기, 동일 20문항 재풀이의 점수 제외, 실전50/80분·닫았다 마감 뒤 재접속 채점을 확인했다. 320px 목록 캡처를 직접 시각 검토했다.
- 실제 두 탭에서 최초 생성 10쌍·재풀이 생성 10쌍 / 실패 0. 같은 묶음 최초 회차와 진행 중 재풀이가 각각 하나로 합쳐졌다. 재풀이의 서로 다른 답 동시 저장·동시 제출·40개 활동 기록과 최초 135점 유지도 통과했다(추가 3상황).
- Web Locks 없는 실제 창은 목록 20개 시작을 비활성화하고 이유를 보인다. 저장이 막힌 창에서는 메모리로 준비 회차를 열고 시작 전 이 탭에만 남는다고 알린다(실제 2상황 통과).
- 기존 오답 모의 실제 화면 129개·동시 탭 30쌍+추가7상황 재검증 / 실패 0. 기존 회차 독립182개·저장18개·통계33개·오답저장65개·읽음116개도 통과했다.
- 원문 기출·보기 근거17,233개, 객관식 이동54개·기출 이동112개 / 실패0. 직전 media622파일 중 회차 컨트롤러를 제외한 621파일은 바이트 단위로 그대로다.
- 새 백엔드·결제·계정·공개 순위는 없다. 준비된 미니는 원래 1–20번 부분 묶음이며, 실제 시험 50문항의 축소 예측 모형이 아니다.
