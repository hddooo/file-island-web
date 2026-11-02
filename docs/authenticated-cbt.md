# 로그인 기반 실전모의고사

메인 메뉴는 시대별로 학습하기 → 나만의 오답노트 → 실전모의고사 순서입니다. `#formal-exams`에서 심화 제79→70회, 원본 순서 50문항·5보기·80분·100점 CBT를 이용합니다. 문제 바로 가기는 1~50번 선택으로 답과 시험 시간을 유지합니다. 서버에 저장된 현재 위치·답·결과를 로그인 후 복원합니다.

JWT로 보호되는 API와 이미지 Blob만 사용하며 새 원본 파일은 공개 저장소에 추가하지 않았습니다. 기존 공개 기출 파일과 이미지는 이 변경으로 비공개가 되지 않습니다. API 마이그레이션007과 비공개 이미지 볼륨 설정이 별도로 필요하며 운영 DB 적용은 수행하지 않았습니다. 파트별 분석은 초기 분류이며 미확인 항목을 표시합니다. 기존 오답노트의 권한은 유지합니다.

검증: API 통합112개, UI13개·이미지클라이언트6개, 실제375/1280px 브라우저20개 통과. 브라우저 검사는 별도 로컬 DB와 전용 탭에서 수행했습니다. 서버 마감·계정 소유권·중복 제출·누락 이미지 시작 방지는 API 통합 검사로 검증했습니다.

`node scripts/test-cbt-binary-client.cjs`; UI 검사는 jsdom25가 필요하며 `HANQ_JSDOM_PATH` 또는 설치된 jsdom을 사용합니다.

## Device drafts, pause and batch submission

The current frontend creates `answerMode: batch` runs. Choices and navigation update the UI and the owner's device draft immediately; they do not call `/answer` or `/go`. The image DOM is retained on choice changes and decoded image blobs are reused within the mounted run. Drafts use `hanq:cbt-draft:v1:<owner UUID>:<run UUID>` with exact question/version/option signatures. They contain no tokens, answer keys or scores. Unpaused edits are device-local; confirmed pause checkpoints can be restored by another signed-in client. If localStorage fails, the current in-memory draft survives API resynchronization and the screen warns the user; closing that screen cannot guarantee recovery from unavailable device storage.

Pause/resume endpoints retain the original 80-minute budget, freeze the authoritative remaining time and extend the deadline only for completed pause intervals. The paused UI hides the question and disables answering/navigation; reload restores the paused server state. Authentication changes clear screen/in-memory pointers without deleting the previous owner's device draft.

Final confirmation and timeout freeze the same complete 50-answer payload and submission key before sending it. A failed or lost response preserves that payload for retry/reload. The server validates all positions and stored option IDs, stores answers and receipt and records exactly 50 attempts plus one final-score growth event in one transaction. Replays must have the same key and payload; changes conflict. Only an acknowledged final result clears the draft. Existing final results remain immutable. An existing active legacy run is upgraded before local editing, retaining its saved answers and original deadline.

This is a practice protocol: the server marks late submissions expired using its deadline, while accepting the first full frozen batch so offline drafts are not prematurely graded empty. Without per-answer server writes it cannot prove when an offline choice was made. The frontend freezes answers at zero and retries the frozen batch; no client score or client time is trusted for grading.

Deploy the API including migrations `013_cbt_batch_pause.sql` and `014_cbt_pause_checkpoint.sql` before this frontend. The additive migration preserves legacy runs; old clients retain their old API behavior. No operating migration, push or deployment was executed during implementation.

Refresh failures now propagate the refresh error rather than the original expired-access 401. Temporary network/503 errors preserve session and CBT draft, and offer retry; a genuine refresh 401 still clears authentication. Existing TTL and cookie policy are unchanged (defaults access 10 minutes, rotated refresh 14 days, absolute session 30 days; operating environment overrides not verified).

## Pause checkpoints (migration 014)

Current pause sends an immutable snapshot of all50 answers, current position, a retry key and the last server checkpoint version. The server validates stored question/option IDs and atomically stores the snapshot and remaining time under the owner/run lock. Pause never grades or creates attempts/rewards. The pause receipt makes retries idempotent even after resume; stale revisions and changed retry bodies conflict. Invalid/final/expired/other-owner requests cannot edit answers.

A fresh client without a device draft hydrates the server checkpoint. A newer server checkpoint supersedes an older device snapshot; edits after the same revision remain local until the next pause or final batch submit. Network failure keeps the frozen pause payload and current draft, shows an unconfirmed state and offers identical retry or read-only state verification. Only a server response confirms that the clock is paused. Final batch grading remains unchanged.

Deploy API with additive migration014 before this frontend. No operating DB operation or deployment was executed. Result cards and details have text labels for correct/wrong/unanswered; wrong is red with explicit selected and correct option numbers. Mobile/desktop checks use375px/1440px, an isolated API/DB and simulated before/after-response faults, not operating records or physical iOS Safari.

## Review stars

Questions now have a device-local, owner/run/version-scoped review star independent from the five choices and scoring. Stars survive same-device pause/reload/final review, are not sent in pause/submit payloads and do not sync across devices. Details and same-round retake validation: `cbt-stars.md`.

The review-star toggle is next to the five choices below the question image. The clear-answer button is removed; changing the selected choice remains supported.
