# 결과와 검수 경계

기준 main: 8d31a8c1080e53f7944247ace31657653d354da9.

- Practice 풀이 중 브라우저 폭 전체 사용, 나가면 원래 섬 프레임 복원.
- Part3·4·6·7 넓은 화면 지문/문제 독립 스크롤, 모바일 지문/문제 전환과 선택·읽던 위치 유지.
- Part1 사진·음원 축소, 답 모아 보기, A.A 중복과 문제번호/진행 개수 혼동 정리.
- 원문·정답·채점·음성 엔진·기록·인증 API 유지.

기존 원문·보기·오디오 DOM을 옮긴다. pane 전환은 API/재렌더링 없이 동작하며 숨김 패널 스크롤은 별도 보존한다. OS fullscreen API는 사용하지 않는다.

- node --check media/toeic-cbt.js: 통과.
- node scripts/test-toeic-study-desk.cjs: 합성102개 통과. Parts1–7 원문·ID·문항수, 선택·스크롤·오디오 동일성, picker, 실패 재렌더링과 종료 확인.
- node scripts/test-toeic-partial-readiness.cjs: 합성353개 통과. 준비 상태·단일/묶음 채점·중복/재시도·계정·원문/해설/대본 보존.
- node scripts/test-toeic-script-status.cjs: 통과.
- CSS 파싱과 독립 코드 리뷰 완료.
- scripts/qa-toeic-study-desk.cjs는 합성 Chromium matrix. 실행 환경 socket EPERM으로 렌더링 검수 미실행. 실제 iPhone/Safari 확인으로 표시하지 않는다.
- 정확 SHA 빌드·홈서버 배포·운영 도메인 검수는 후속 근거와 구분한다. 사용자 실제 기록 변경 없음.
