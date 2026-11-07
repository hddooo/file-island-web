# 0.8.14-beta 검증

- 신규 목록 합성DOM: 최신3개/최종일시순서/진행중이어풀기/미확인점수/자료미준비가드/하단기록제거/PDF연결 통과.
- CBT batch draft 26, notebook 69, compact result 12, multi-round 1570 회귀 통과. 오래된 test-formal-exams fixture는 batch API 모델을 반영하지 못해 종료되지 않아 중단했으며 통과로 계산하지 않았다.
- 합성 Chrome iframe viewport 320/390/1440px 가로넘침 없음, 320/390 스크린샷 확인. 실사용자/실기기 Safari검증 아님.
- PDF 합성3문항+공통1자료 → 2쪽. 실제 Chrome다운로드 bytes 일치, 제목/보기/쪽번호/EOF 확인. 사용자원문·답안 제출·XP변경 없음.
- 순서형/분류형은 642문항 1532assertions 및 담당 Chrome 320/390/1440 검증통과. API수정 없음.
- 실제 운영배포/SHA 및 사용자 시험시작·제출 동작은 아직 확인 전.
