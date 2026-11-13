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

## 정답 미리보기 (2026-11-13)
- 전 시대 sequential 빈칸퀴즈에서 정답 판정 후 기존 파란 피드백 줄에 실제 정답을 표시. 기존 O 애니메이션 1초 후 자동이동·오답 Enter 이동·마지막 제출 포커스 유지.
- 8시대 타이머/접근성/연타 104검사, sequential152, v2UI34, 조선scope61 통과. 아직 통합·운영 배포 전.

## 빈 답 다음 이동 (2026-11-13)
- 기존 다음 버튼은 채점 없이 이동. 제출 시 비운 답은 matcher에 전달하지 않도록 명시 가드 추가; Enter 빈칸 안내 정책 유지.
- 8시대·10세션 전체/부분 134검사: 다음·이전 재방문·마지막·통계 미풀이·빈답 matcher0·부분 저장0 통과. 정답preview104·v2UI34·sequential152 회귀 통과. 운영 배포 전.

## 좌우 방향키 탐색 (2026-11-13)
- 답칸 등 편집 필드 밖에서 ←/→로 이전·다음 문항 이동. 입력 커서·IME·수정키·팝업·통계·애니메이션·범위 끝은 가드. 저장/채점 호출 없음.
- 8시대232 검사 및 기존 skip134·preview104·sequential152·조선61 회귀 검수. 독립 헤드리스 모바일/데스크톱 실제 커서 검수 분리. 운영 미배포.
