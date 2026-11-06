# 검사 결과

- `test-toeic-practice-pdf.cjs`: JSDOM + Skia + PDF.js 합성 검사 120개 통과. 일반 사진 7문항은 4쪽, 세로 사진 2문항은 2쪽이다. 가로 보기·장문·원문 보존·혼합 파트·정답 분리·굵은 제목/일반 본문·3문항 구분·모든 그리기 영역·계정 전환·취소·bfcache를 검사했다.
- 기존 `test-toeic-partial-readiness.cjs` 353개, 실제 API client 라우트/auth 검사, Script 상태 검사 통과.
- 독립 소스/합성 검토 후 남은 차단 지적 없음. Poppler로 렌더링한 일반/세로 사진, 가로/긴 보기, 합본 PDF를 시각 검수했다.
- 합성 Chromium 320/390/1440px UI 검사는 실행 환경의 `socket() Operation not permitted`로 시작하지 못했다. 실제 브라우저·모바일/운영 다운로드 검증으로 표시하지 않는다.
- 데이터·인증·권한 변경 없음. 게시 후 정확 커밋의 빌드/배포와 실제 도메인의 버전·자산 해시를 별도로 확인한다.
