# 진행

81전용 meta에 따라 학습 라우트/reader를 정규화하고 구판 fallback/picker를 숨겼다. 145개 신규 정책검사,139개 기존 기본판본 검사,81개 semantic reader 회귀,조선 session 통과. 실제 Chrome QA 진행 중.

Chrome320/390/1440px×7영역×정상/오류42케이스 통과: 선택 UI/구판 fallback 없음, API는NEW만 호출, overflow/runtime error0. 합성 manifest로 수행했으며 운영회원 저장은 미수행. 고려조선개화기 app.available0/7/8 및 bookquiz정규화 검증.
