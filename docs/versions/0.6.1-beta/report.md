# 결과와 검수 경계

기준: fe61fa155aec65dac497cdf10e92cd86cdccbe1c (0.6.0-beta).

실행 파일 변경은 media/toeic-cbt.js의 data-layout 분기 한 곳과 media/toeic-cbt.css의 PC 확장 selector 5개다. Part 6·7만 좌우 지문/문항이며 Part 3·4는 기존 한 열 화면과 자료/문제 전환을 사용한다. 음원·DOM·선택·스크롤 보존 로직, 정답/기록/인증 API, Part 1·2·5 스타일은 그대로다.

검사: node --check media/toeic-cbt.js, test-toeic-study-desk.cjs 117개, test-toeic-partial-readiness.cjs 353개, test-toeic-script-status.cjs, CSS AST 파싱 통과. 독립 리뷰에서 관련 PC selector 5개 범위와 나머지 변경 없음 확인. 실제 사용자 제출0회.

운영 배포와 실화면 검수는 정확 SHA의 후속 근거로 확인한다. 초기 cloud browser는 로그인 전이므로 현재 실제 화면 확인이 끝났다고 주장하지 않는다. 이전0.6.0의1180/532px 검수는 이 수정본의 시각 검사로 대체하지 않는다.
