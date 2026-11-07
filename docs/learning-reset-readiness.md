# 섬별 오답 기록 초기화: FE 구현 상태 (2026-11-07)

## 구현 (운영 미배포)
- GET/POST `/api/v1/me/learning-resets`. `available:true`와 `scope:wrong_answers_only`를 함께 확인해야 버튼 활성화.
- 사용자·섬별 서버 resetAt 이전 incorrect만 제외. 일반 정답·과거 오답의 정답 재풀이·XP·다른 섬·문제 원본·단어장 유지.
- POST 직전 브라우저 확인창에 섬/오답 범위/유지 범위/화면 되돌리기 미지원 표시. 취소 시 요청하지 않음. 실패 결과 불명은 재시도 독촉 없이 재확인 안내.
- `hanq:wrong-reset:v1:<owner>`에 서버 확인 cutoff만 보관. 계정/epoch 검사, 단조증가 merge, 로그인·focus·storage 이벤트 재확인. 모든 데이터 영구 삭제 없음.
- learning-progress `wrongNotes()`에서 ownerId·subject·ts·correct=false로 필터. 기존 attempt 원본은 남김.
- TOEIC 로컬 practice는 원본 record를 비파괴 projection으로 가림. 시각 없는 과거 wrong은 cutoff가 있으면 가림. 새 채점 lastAt 추가. 새 채점으로 대체되기 전 가려진 과거 wrong을 `archivedWrong`에 보존. 정답/별표/풀이총수 유지.
- 한국사 quiz-progress와 index 기출 pending, TOEIC answer/group-answer pending 생성 시 resetAt 캡처. 재시도는 저장된 토큰을 그대로 전송. API-client가 전송 시 최신값으로 바꾸지 않음.

## 추가 확인 및 출시 제한
- 실제 API 통합/브라우저 렌더/운영 migration 및 smoke 검증 전 완료·배포로 볼 수 없음.
- `learning_reset_changed`로 거절된 오래된 pending은 보존되지만 현재 UI에서 이를 보존 보관함으로 옮기고 새 답안을 명시적으로 시작하는 기능은 아직 없음. 토익에는 반복 재시도 금지 원인을 표시. 한국사 기존 pending 화면도 이 별도 UX가 필요.
- TOEIC 로컬 aggregate는 정확한 문항별 정오답 전체 이력 구조가 아니며 기존 attempts 총수는 유지한다. 기존 정답 기록을 훼손하지 않기 위함.
- 공유/owner 없는 `hanq:progress:v1:<view>` 및 integrated-blank는 범위 밖으로 보존. 일반 진행 초기화하지 않음.
- 서버 날짜와 기기 lastAt 시계 차이, 오래된 열린 화면 메모리/동시 기기/오프라인 큐는 추가 통합검증 필요.

## 정확한 경로
- `learning-progress.js`: loadAttempts 121, attempts 194, wrongNotes 228. wrongNotes에만 필터 적용. 일반 attempts 목록/진행은 그대로 유지.
- `account-sync.js`: owner별 key/acked 관리 및 import 흐름. 오래된 incorrect import는 API reset 정책이 최종 방어.
- `toeic-practice.js`: identity 33, load 39, save 54, record/pool/grade. 키 `hanq:toeic-practice:v1:owner:<uuid>`.
- `toeic-cbt.js`: pending persist/restore 203/204, check/checkGroup/checkMember에서 생성 캡처. 키 `hanq:toeic-question-pending:<owner>`.
- `quiz-progress.js`: pending record 생성과 submitAttempt 5번째 resetAt 인자.
- `index.html`: 기출 pending 생성 1137/1180 및 제출. 일반 공유 진행 키 변경 없음.
- `my-records.js`: api.myRecords 조회 54, refresh 제공 65. 서버 wrong 필터를 사용하며 성공 후 refresh.

## 합성 검사
- reset readiness/explicit confirm/owner isolation/non-destructive projection: 10 통과.
- TOEIC practice controller: 54 통과.
- quiz progress: 15 통과.
- account API: 22 통과 (jsdom 없음으로 DOM 부분 미실행).
- practice growth: 5 통과. TOEIC real-client route/auth regression 통과.
- JS 구문/diff whitespace 검사 통과. 실사용자 기록 변경 및 운영 POST 없음.