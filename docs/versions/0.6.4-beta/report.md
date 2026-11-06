# 0.6.4-beta 릴리스 전 검수 기록

기능 후보: `fc3601f0b9ef2203cafb7443c1bcc36a75c5b696`. 이후 마이페이지 `707f767d79ea8f2ea1273812eaf22635fa1d5909` 위에서 비충돌 파일만 통합한다.

- `node --check media/device-shell.js`: 통과.
- `node scripts/test-device-screen-edges.cjs`: CSS 파싱 및 일반/회사·Practice 포함 32 DOM scope 조합 통과. 렌더링 측정의 대체가 아니다.
- `node scripts/test-device-scroll.cjs`: 21개 통과. JSDOM의 실제 requestAnimationFrame 타이머를 켜서 header observer 오류 없이 검사한다.
- `node scripts/test-device-place.cjs`: 43개 통과. 마이페이지 명칭·뒤로 이동·단일 헤더 보존.
- `node scripts/test-header-refinement.cjs`: 원래 header DOM·제어·대비 회귀 통과. 기본/초점/hover/눌림의 본문 5.92:1, XP 합계 4.71:1 이상.
- 격리 브라우저는 OS socket 권한 제한으로 시작하지 못했다. 320/390/1440px 및 낮은 가로 화면·WebKit·실제 iPhone 검수는 이 기록에서 미실행이다.

변경은 공통 화면 외곽 스타일과 위치 이름이며 원문·정답·보기·사용자 기록·XP·API·원화 bytes를 수정하지 않는다. 회사모드와 전용 Practice 전체화면 selector는 제외한다. 실제 운영 검수는 배포 SHA/HTML meta/자산과 화면을 확인한 별도 결과로 보고한다.
