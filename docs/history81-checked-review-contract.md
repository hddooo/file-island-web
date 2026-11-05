# 81회 체크 복습 저장 의존성 (미연결)

현재 운영 API 2062b84의 Update81은 itemId/values/submitted/checkedSlots만, Batch81은 version/revision/mutationId/cursor/status/updates만 지원한다. checkedSlots는 채점한 입력칸이며 복습 선택이 아니다. FE는 이 필드를 재사용하거나 임의 localStorage 저장을 추가하지 않는다.

API 담당과 확정할 최소 제안(아직 구현/활성화하지 않음):
- workspace에 선택한 item ID 목록과 명시적 지원 여부를 제공한다.
- 기존 CAS batch에 별도 선택 변경 목록(itemId, boolean)을 추가한다. 답안을 만들거나 채점하지 않고 선택만 변경할 수 있어야 한다.
- 선택 변경 생략 시 기존 선택을 유지한다. 기존 답안-only 클라이언트도 선택을 지우지 않아야 한다.
- 해당 판본의 실제 item ID만, 중복/범위 검증. 계정/시대/판본 격리 및 기존 mutationId 재시도/409 정책 유지.
- 모델 version/진도 key/기존 답안 불변. 권한/DB 구조 변경 필요 여부는 API 담당이 판단한다.

로컬 UI는 공유 renderer의 checkedReview 옵션 및 reviewMarks.has/set 콜백으로 분리되어 있다. 현재 81회 운영 adapter는 이를 켜지 않는다. 콜백 메모리 fixture 검사는 서버 저장이나 운영 검증이 아니다. 확정된 API 계약을 받으면 동일 batch/recovery 수명에 연결하고 실패/충돌/늦은 응답/재진입을 통합 검증한다.

O/X 정책: 채점된 오답이 하나라도 있으면 X, 모든 빈칸이 채점된 정답이면 O, 일부만 맞고 나머지가 미입력이면 미완료. 빈칸별 기존 정답 피드백을 보존한다. 필터는 DOM을 재생성하지 않는다. 구판79는 옵션이 꺼진 기존 동작을 유지한다.
