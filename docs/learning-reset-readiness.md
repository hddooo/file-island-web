# 섬별 풀이 초기화 준비 상태 (2026-11-07)

## 최신 범위 정정
- 사용자: XP는 보존하고 오답문제 기록, 나의 기록의 해당 오답기록만 초기화. 일반 진행·정답 기록까지 초기화 범위를 확대하지 않음.
- 아래 저장소 목록은 영향 분석 대상이며 삭제 대상 목록이 아님.

## 현재 상태
- 별도 작업트리 준비 구현만 완료. 운영 배포/실제 초기화는 하지 않음.
- MyPage에 역사섬·영어섬 버튼을 분리하되 **항상 비활성**. GET `/api/v1/me/learning-resets`만 읽음.
- `available:false / reset_consistency_pending`은 준비 중, 미지원/실패는 확인 불가로 표시. 알 수 없는 미래 `available:true`도 이 클라이언트에서 활성화하지 않음.
- 실제 POST, 영구 삭제, localStorage/sessionStorage 삭제·수정, XP/문제 원본/단어장 변경 없음.
- 계정과 인증 epoch가 바뀌거나 화면이 종료되면 이전 응답을 무시함.

## 출시 전 반드시 해결할 범위
1. `media/learning-progress.js`: `hanq:att:v1:<attemptId>`의 ownerId + subject + ts로 현재 사용자만 기준시점 적용. 게스트·소유자 없는 기록은 보존. `wrongNotes()`의 원본 loadAttempts 직접 사용 경로도 함께 검증.
2. 같은 파일의 `hanq:progress:v1:<view>`에는 ownerId가 없음. 개인 초기화를 이유로 이 공유 키를 지우면 안 됨. 계정별 새 namespace/호환 경로가 필요함.
3. `media/account-sync.js`: `hanqacct:ikey:<ownerId>`, `hanqacct:sync:<ownerId>`의 ack/import 흐름. reset 이전 미동기화 attempt를 서버에 다시 보내도 과거 풀이가 부활하지 않도록 서버 기준시점/발생시각 검증 및 경합 테스트 필요. import 키와 ack를 지워 재전송시키지 않음.
4. `media/account-ui.js`: sessionStorage `hanqacct:pos:<ownerId>`와 `hanqacct:rundraft:<ownerId>:<runId>`, 메모리 replaySubs/runPos/replayPos. 서버 old-run 무효화와 동일 epoch가 필요. 다른 계정 데이터나 계정·메일 설정은 보존.
5. `media/toeic-cbt.js`: localStorage `hanq:toeic-question-pending:<owner>` 대기 답안. 서버 idempotency와 reset 이전 대기 제출이 되살아나지 않도록 검증.
6. `media/toeic-practice.js`: `hanq:toeic-practice:v1:owner:<uuid>`에는 문항별 star/attempts/lastOptionId/wrong만 있고 timestamp/epoch가 없음. 단순 cutoff 적용 불가. 별표(사용자 표시) 보존과 풀이횟수 리셋 분리 필요. guest 키는 보존.
7. `media/integrated-blank-practice.js`: `hanq:integrated-blank:v1:<sourceSHA256>`는 owner가 없음. 공유 데이터 일괄 삭제 금지.
8. 단어장 체크 `hanq:toeic:word-checks:v1`, 가입·로그인, 원본 collections/PDF/음원/사진, 문제등록 요청, 배틀 기록·XP는 초기화 대상에서 임의 확대하지 않음.
9. 열린 다른 탭의 오래된 메모리/오프라인 저장, 계정 A→B→A, 두 기기 동시 풀이, GET/POST 네트워크 결과 불명, 예전 클라이언트 재접속을 각각 검사해야 함.

## 합성 검증
- `node scripts/test-learning-reset.cjs`: 7개 통과. 미지원/준비중/예상 밖 enabled 응답에서도 비활성, API 실패, 계정전환 중 응답, stop 후 응답, 비로그인 요청 차단.
- `node scripts/test-account-ui.cjs`: 22개 통과 (jsdom 미설치로 해당 스크립트 DOM 부분은 미실행).
- `node --check media/{learning-reset,account-ui,api-client}.js` 통과.
- 실사용자 기록·실서버 POST는 테스트하지 않음.