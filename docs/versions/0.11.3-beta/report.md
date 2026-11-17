# 0.11.3-beta 결과

- 보호된 교재 원본을 수정하지 않고 정확 판본·쪽·표·셀 ID와 두 항목을 모두 확인한 경우에만 학습용 묶음 칸을 표시한다. 새로운 역사 설명/날짜는 삽입하지 않는다.
- 기존 페이지·다른 판본/표·다른 라벨에는 적용되지 않으며 재렌더링해도 중복되지 않는다.
- API, DB, 사용자 답안/별표/읽음 상태에는 쓰기를 수행하지 않는다.
- 검증: node scripts/test-history-assembly-group.cjs; 기존 scripts/test-textbook-semantic.cjs --dom (118 checks). 기존 설치된 jsdom/playwright를 재사용했다.
- private p129 fixture와 screenshot은 로컬 .artifacts/assembly-qa에만 두고 공개 배포하지 않는다.
- 운영 배포는 exact SHA 및 실제 도메인 자산 확인 후 별도 보고.
