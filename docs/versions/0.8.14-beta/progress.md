# 0.8.14-beta 진행

구현/로컬 검사 완료, 운영 반영 대기. auth 0.8.13의 세션게이트와 승인페이지를 병합해 보존했다.

CBT 운영 비활성 원인은 private image mount/env 누락과 옛 Vercel fallback. 501개 기존이미지 해시 및 격리 API 이미지검증 통과, auth후 private RO overlay 대기.

회차별 점수 API global100 한계는 cbt.repository 단일파일 개선3c3c22a로 검증완료. 별도overlay 배포대기.
