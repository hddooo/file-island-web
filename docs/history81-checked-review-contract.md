# 81회 체크 복습 저장 계약

API 82ef72e61e41054a15f354c027323d6d0fdfb17e의 기존 81회 workspace 계약을 사용한다. 응답 reviewSelectionAvailable === true 및 유효한 workspace.selectedReviewQuestionIds 배열을 함께 확인한다. 롤백된 서버에서 저장 배열만 남은 경우 기능을 켜지 않는다.

선택은 top-level selectedReviewQuestionIds 전체 교체 배열로 저장한다. 선택만 변경하면 updates는 빈 배열이다. 필드 생략은 기존 선택 유지, 빈 배열은 선택 해제다. checkedSlots는 계속 채점 상태이며 재사용하지 않는다. item ID/버전/계정/시대/판본 및 기존 CAS mutationId 경계는 불변이다.

FE 큐는 선택 세대와 답안 세대를 별도로 추적한다. 저장 중 새 변경은 다음 batch로, 응답 유실은 동일 요청과 mutationId로 재시도한다. 409는 사용자 재시도 시 최신 선택에 이 화면의 선택/해제 의도만 합친 새 CAS 요청으로 처리한다. 답안과 위치를 초기화하지 않는다. 계정/판본으로 묶인 미저장 recovery에 선택 의도를 포함하며, 지원이 사라진 경우 선택 draft를 소모하지 않는다.

renderer checkedReview 옵션은 81회 adapter에서만 지원 응답으로 켜진다. 구판79는 기존 버튼/복습 동작을 유지한다. O/X는 채점된 오답이 있으면 X, 모든 빈칸이 정답이면 O, 나머지는 미완료다. 필터는 입력 DOM을 재생성하지 않는다. prefers-reduced-motion에서는 모션 없이 결과가 남는다.

검증: 실제 두 모델 기반 DOM/CAS fixture, 실제 index 합성 API 및 320/390/1440 화면. API 담당의 별도 17검사/격리 PostgreSQL 결과와 구분한다. 실제 운영 회원 쓰기/물리 iPhone/VoiceOver 미검증. 소스·원문·정답·기존 키와 권한은 변경하지 않았다.
