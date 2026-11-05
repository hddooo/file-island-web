# 검증 결과와 한계

- 고려·조선 81회에만 답칸 우선 Tab/Shift+Tab, 마지막 정답 확인, F2 복습 체크와 Escape 복귀를 적용했다. 체크는 네이티브 키보드 접근을 유지하며 맨 아래 복습 체크 선택 버튼으로도 접근한다. IME 중 단축키를 가로채지 않는다.
- 요청 안내문을 그대로 표시하고 전체보기/체크문제보기 버튼에 aria-pressed와 선택 수를 표시한다. 문항 머리글은 번호·O/X·오른쪽 44px 체크 터치 영역을 한 줄로 배치한다. 원문/응답/저장 모델/API는 변경하지 않았다.
- 실제 index 합성 320/390/1440px × 고려·조선: 순방향/역방향, 첫/끝 경계, 복수 답칸, 필터, 정답 확인, 반복 탭/주제, 저장 실패·복구, 로그아웃, 276개 입력 및 79회 범위 유지 검증. 실제 PNG와 동시 좌표에서 넘침 없음·체크 44×44px 확인.
- 기능/서버 capability/CAS 저장(응답 유실·충돌·계정 격리)/지시문/강조/모드 세션/공통 헤더 7개 표적 명령 통과. node --check/git diff --check 적용. 별도 package lint/typecheck 명령은 없다.
- 기존 test-progress-recovery.cjs의 JSDOM Window null _location 오류와 test-period-joseon.cjs의 고정 byte/hash 불일치는 앞선 기준 검수에서 확인한 제약으로 이번 미재실행이다. test-textbook-source-quiz.cjs 전체 private corpus 기본 경로는 제공되지 않아 미실행; 실제 두 모델 표적 검증으로 대체했으며 전체 suite 통과라 하지 않는다.
- 화면은 격리된 합성 회원/API 응답이다. 기존 API 격리 PostgreSQL 결과를 재사용하며 이번 FE 검수가 실제 운영 회원 저장 성공은 아니다. 실회원·물리 iPhone/VoiceOver는 미검증. 원문/PNG/캡처/private 인계 자료는 공개 파일에 포함하지 않았다. 개화기는 변경하지 않았다.
- 정확 커밋 CI/CD와 운영 자산 검증은 게시 후 실행 기록에 별도로 남긴다.
