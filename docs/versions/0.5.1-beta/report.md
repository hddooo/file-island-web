# 사전검수 결과

## 변경

학습 본문·문제·보기 14px, 제목·강조 15px. 루트 rem 크기·글꼴·줄 간격·색·선택 표시·레이아웃·원본 그림은 변경하지 않는다. 모바일 입력은 16px로 유지한다. 회사모드와 인쇄에는 적용하지 않는다.

## 검사

- `scripts/test-general-typography.cjs`: 6개 통과. CSS 범위/속성, 15개 연결, 독립문서, 반복 모드전환의 답안/DOM/핸들러 보존, 자산 build query를 확인했다.
- `scripts/test-company-mode.cjs` 중 독립 실행 가능한 기능·동작 15개 통과. 전체 테스트 성공으로 간주하지 않는다.
- `scripts/test-app-version-build.cjs`: 통과.
- 브라우저 로컬 실행은 환경의 socket EPERM으로 차단되어 실제 CSS cascade·모바일 시각 통과를 주장하지 않는다. 운영 브라우저 확인은 배포 후 별도 기록한다.

## 배포

이 커밋은 사전검수 결과다. 운영 반영은 정확 SHA CI/CD와 실제 도메인 버전·CSS·computed style 대조 후 확인한다.
