# 0.10.35-beta progress

- [x] Integrate source-bound matcher, explicit v2 client/session and quiz/menu/wrong-review adapters.
- [x] Shared 96 vectors / 316 matcher checks; 77 client, 30 session and 34 UI separation checks.
- [x] Saved history 58, sequential flow 152, manual save 61, semantic library 85 and menu detail 25 checks.
- [x] Three scripted-reader entry/lifecycle paths and eight-era wrong review in both v1 and v2: raw inputs, account/late-response separation, fresh start, no navigation/autosave writes.
- [x] Sixteen Chromium/WebKit viewport/theme flows with the actual frontend matcher and supplied API candidate grader; raw final payload and server-confirmed statistics.
- [x] Windows read-only actual source parity: 697 questions, 702 slots, 6,680 answer variants, all 46 policy bindings, original objects unchanged.
- [ ] Exact final frontend commit, clean static build and official API/Linux image qualification.
- [ ] API-first deployment, then exact frontend main fast-forward/CI/CD and live verification.

- [x] Integrated the independently deployed tooltip main ac342b2061acfcd18bcfb632bc51358b14b62fa1 without changing the v2 matcher, legacy comparator, API contract or either retained test correction.
- [ ] Revalidate this combined 0.10.35 candidate and bind its exact SHA to the final API qualification. No remote push or production activation occurred in this integration step.

## 조선 범위 선택 후보 검수
- 기준 1be77f5에서 분리 구현. 실제 승인된 로컬 원문 데이터의 172문항을 전기26+후기50=76, 중앙관청15+사회외교13+사회비교14+경제비교18+문화36=96으로 분할. 문항 원문·ID 불변.
- 부분 제출은 서버 저장 함수를 호출하지 않고 일회 통계·오답·PDF만 표시. 부분 이력 패널 없음. 전체 저장 경로 보존.
- 합성 DOM v1/v2 61검사, v2 UI34·matcher316·session30·기존 수동저장61 통과. 독립 headless Chrome 일반/회사모드 320·390·1440 폭 6케이스, 기존 색상32케이스 통과. 사용자 Chrome 미제어.
- 전체 시대 원문 회귀는 입력 fixture에 prehistory가 없어 미실행. 조선 원문 범주 확인과 합성 회귀를 전체 운영 검수로 확대하지 않음.
