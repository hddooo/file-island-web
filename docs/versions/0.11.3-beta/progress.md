# 0.11.3-beta 진행

- 구현: 실제 rowspan=2 상위 칸과 다른 행 colspan=2, 좁은 화면 표 폭 유지.
- 기능 검사: 신규 합성 회귀 및 비공개 실제 p129 fixture 통과. 원본 JSON 불변 확인.
- 회귀: 기존 semantic renderer DOM 118개 통과.
- 시각: Chromium 320/390/1440px 렌더링, 문서 가로 넘침 없음. 320/390 스크린샷 검토. iOS 실기기 검사는 아님.
- 배포: 현재 로컬 검증 완료, push/정확 SHA CI/운영 응답 확인 예정.
