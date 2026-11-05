# 81회 문장 내 입력과 79회 기능 연결 — 로컬 검토 후보

기준 운영: 37755375f64ecf548df7074f1c3668c8e0c32724. 완전한 기능 이식이나 운영 반영 완료가 아니다.

## 완료한 표시 변경

- 고려·조선의 기존 임시 답안 키를 그대로 사용하여 별도 textarea를 원문 빈칸의 input으로 이동했다.
- 조선 172문항/172응답, 고려 100문항/103응답 그룹을 유지한다. 고려 두 칸짜리 한 응답 그룹은 물리 입력 2개와 기존 쉼표 연결 값으로 처리하므로 물리 input은 104개다. 네 하위 응답은 기존 field ID와 순서를 보존한다.
- 원문 텍스트/강조/보기/정답은 변경하지 않는다. 원래 빈칸 위치가 확인되지 않으면 추측하지 않고 중단한다.
- 시대·학습 메뉴는 밝은 배경과 녹색 밑줄로 통일했다. 81회 Script 화면에는 의미가 없는 legacy 범위 선택기를 표시하지 않는다. 기존 bookquiz 경로는 변경하지 않는다.

## 실제 79회와 비교한 기능

기존 textbook-source-quiz renderer는 blur/Enter 즉시 채점, IME/repeat 보호, 수정 재채점, 다음 입력 이동, 문항별 정답 표시, 풀이/오답 목록, 일괄 저장, 중단·이어 풀기, 실패 재시도와 저장 응답 경합 처리를 제공한다. 기존 renderer의 합성 입력·채점 화면을 확인했다. 이를 현재 81회에 모두 이식했다고 주장하지 않는다.

현재 81회 Script는 임시 입력과 별도 교재 정답 확인만 제공한다. 로컬 임시 저장을 계정 저장처럼 꾸미거나 79회 ID/진도에 연결하지 않는다.

## API 의존성 — 미완료

실제 기존 renderer 연결은 api.textbookSourceWorkspace / saveTextbookSourceWorkspace를 사용한다. GET/PUT semantic/workspaces/:id의 version/revision/mutationId와 immutable 문항·정답 모델이 필요하다. 이전 semantic/progress 경로만 연결하는 것으로 기존 기능을 이식할 수 없다.

현재 API 계열의 Script 컨트롤러는 bundle·figure GET만 제공한다. 운영 정상 TLS/무인증 GET 비교에서 기존 semantic/workspaces/goryeo는 401, 81회 PDF SHA의 revisions 경로 아래 semantic/workspaces/goryeo 및 semantic/quizzes/goryeo는 404였다. 따라서 다음이 준비돼야 한다:

1. 81회 독립 namespace의 검증된 hanq-source-quiz/1 문항·빈칸·답안 모델과 불변 버전.
2. 그 모델에 연결된 계정별 workspace GET/PUT, 기존 79회 기록과 분리된 저장 키, 충돌/재시도 계약.
3. 검증된 API release와 판본 gate 활성화 근거. 기존 닫힌 revision gate를 이 후보가 해제하지 않는다.

이후 기존 79회 renderer를 위 계약에 연결해 기능별로 검수한다. API 계약과 저장 구현은 이 FE 후보에서 변경하지 않았다. 그 전에는 완전한 기능 이식 릴리스로 게시하지 않는다.

## 검증 범위

실제 index 합성 320/390/1440px에서 문장 안 입력, 단일/복합/하위 응답, Tab 이동, 답안 접힘·펼침, 모드/주제/Back 이동 시 임시 입력 보존, logout 제거를 표적 검사한다. 새로고침/화면 종료 후 계정 복원은 아직 구현되지 않은 API 기능이다.

원문 projection 검사로 고려 문답/강조와 조선 정답 보존을 확인했다. 79회 전체 테스트는 기본 private corpus 경로가 없어 ENOENT로 끝났으며 전체 통과로 표시하지 않는다. 해당 파일을 읽기 전의 합성 기능 assertions와 별도 실제 renderer 캡처는 실행했다. 기존 JSDOM progress-recovery와 period 고정 해시 제약은 이전 기록대로이며 이번에 반복하지 않았다. 실회원·물리 기기·VoiceOver 미검증. 개화기는 중지한다.

## Range-selector follow-up (local, pending API integration)

The legacy Joseon range radios inherited terminal white text while retaining white backgrounds. Scoped terminal colors now distinguish selected and unselected states without changing labels or filter values. The fieldset carries the current era to avoid affecting other eras. Verified actual labels: 전체 / 전기·양난 / 후기.

Isolated actual-index checks at 390/1440px passed all three radio selections and keyboard focus. Computed text contrast is 9.04:1 selected and 15.48:1 unselected. Both screenshots were directly inspected. Source-quiz has no obsolete range picker; bookquiz and summary remain unchanged. The mock fixture deliberately has no valid server progress response; this is not a production persistence test. This follow-up remains local until the 81회 workspace API contract is integrated and verified. No API, data, permissions or opening-era changes.
