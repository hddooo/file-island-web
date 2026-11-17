# 0.11.4-beta 결과

- 변경은 media/textbook-source-quiz.js의 topicLabel 출력뿐. 보호된 자료·원본 제목·답안은 수정하지 않음.
- 신규 검사 scripts/test-history-government-instruction.cjs와 기존 scripts/test-textbook-source-quiz.cjs 통과. 기존 설치 jsdom 경로와 비공개 원본 fixture를 로컬 환경에서 지정.
- 실제 p137 government 33문항을 포함한 대한민국 전체 62문항, 전체 원본 답 및 ID 보존을 확인.
- 운영 완료는 push와 CI/CD 및 실제 도메인 SHA로 별도 보고.
