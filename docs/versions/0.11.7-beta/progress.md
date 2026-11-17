# 0.11.7-beta

원인: v2 완료 기록이 없어 legacy 완료 기록을 읽으면 useV2=false가 새 재풀이까지 전달되어 strict 비교 사용. practiceV2는 검증된 현재 세션을 따르도록 분리. matcher 또는 capability 실패 시 기존 오류 경로 유지.
