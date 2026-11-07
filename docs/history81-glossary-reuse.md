# 신81판 소규모 검증 용어 재사용

`glossary-data.js`의 기존 `short` 및 출처만 재사용한다. 정의를 새로 작성하거나 원문을 변경하지 않는다. 검증 근거는 `glossary-verification.md` 그대로이며, 이 기능은 전체 강조 구간에 대한 해설 완성을 의미하지 않는다.

## 연결 허용 목록

- 선사·여러 나라: 뗀석기, 빗살무늬 토기, 고인돌, 사출도, 영고, 제가회의, 서옥제, 소도, 천군 (9)
- 삼국: 골품제, 6두품, 율령, 태학 (4)
- 남북국: 골품제, 6두품, 녹읍, 관료전 (4)
- 개화기: 호포제, 사창제, 당백전, 척화비, 별기군, 집강소, 홍범 14조, 단발령, 광무개혁, 통감부 (10)
- 일제강점기: 회사령, 산미증식계획, 창씨개명 (3)
- 현대: 농지개혁법, 사사오입 개헌, 긴급조치, 금융실명제 (4)

34개 시대별 정의 연결, 기존 사전 표기 45개. 이는 허용 목록 개수이며 실제 교재에 표시되는 개수가 아니다. 실제 교재의 강조 전체가 일치하는 곳에만 표시하므로 적용은 그보다 적을 수 있다. 사람·지역 부록에는 문맥별 뜻 검증이 없어 추가하지 않았다.

## 소스 및 UI 제한

- 일반 reader: 신81 PDF `d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de`, PDF8–40/108–139에서 시대 범위별 적용. 구판과 고려·조선·개화기 generic 페이지에는 미적용.
- 개화기 script: `255c37fb68122a329cca00ae1c15035590b6a7b21f601e4a5b5f7515fdfbf695`, study에서만 적용. 원래 markdown strong/em/u와 허용 원문 색상에 표식을 붙인다. 검정 색상만 있는 span에는 붙이지 않는다.
- 일반 reader는 원문 bold 또는 sourceStyleAudit 검증된 밑줄·색·하이라이트 span에만 `data-history-source-emphasis`를 부여한다. source hash를 article에 보존한다.
- 최대 강조 묶음의 공백 정규화 전체 일치만 허용. 부분 문자열, 주변 글자에 이어 붙은 부분어, 클릭 가능한 UI 내부는 제외한다. 새 glossary 경로에서는 불일치 강조 안의 중첩 강조도 재탐색하지 않는다.
- 기존 150자 이하 short만 사용. 클릭/키보드/Escape/화면이동 닫기와 작은 화면 viewport 위치 제한은 기존 tooltip 모듈 재사용. 토픽 전환/reader 정리 시 tooltip과 이벤트를 제거한다.
- 기존 고려·조선 데이터/독자·기본 동작은 수정하지 않았다. 기존 mount의 선택적 4번째 데이터 인수와 그 인수를 준 경로의 엄격 중첩 검사만 추가했다.

## 검증 범위

`test-history81-glossary.cjs`:45표기 각각 source match/mismatch, 원문/정의 불변, cleanup, nested/partial 거부, generic renderer 연결, 개화기 inline 연결, 320px tooltip/Escape 검증.
기존 `test-history81-terms.cjs`431forms, `test-textbook-semantic-library.cjs`81checks, 개화기 app/transport 검증 통과.

운영 API/실제 회원 브라우저/전체137page 후보 DOM 출현수는 이 커밋에서 검증하지 않았다. 배포나 모든 용어 완료를 주장하지 않는다.
