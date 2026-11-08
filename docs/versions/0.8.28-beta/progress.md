# 검증 진행

- 독립 GET/answer/star/image API 계약 합의.
- 합성 DOM, PDF 생성/초기화 경합, 기존 CBT 오답/PDF 회귀 통과.
- 실제 Edge 390px/1440px 빈 상태 목차 캡처 및 가로넘침 확인 통과.
- 81회 교재 145개 회귀 검증 통과.
- 기존 test-cbt-auth-transitions는 이미 삭제된 feStart/fePause 버튼을 전제로 하여 실패: 새 홍문관과 무관한 구 계약 테스트, 통과로 보고하지 않음.
- 운영 API/원본 binary 배포 및 실제 계정 종단 검증 대기.

API image 65a8f646 deployed. Protected list/image anonymous access returns 401; private originals mounted read-only and 72 pre-existing table fingerprints preserved (backend deploy verification). Actual signed-in browser session is not available; no user answer or star writes performed.
