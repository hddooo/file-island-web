# FE 결과·이슈·다음 업무

### 2026-11-03 · 조선 단독 후보의 회원 저장 검증

별도 네트워크·임시 PG17에서 실제 회원 JWT와 조선172문항을 사용해 저장·채점·CAS·재시도·계정/판본 격리·중단/재로그인·API 재시작 복구를 검증했다. 기존79회164문항과 다른 테이블은 보존됐고, 후보 목록에서 제외한 시대는 API에서도404였다. ab5 테스트 API의 교재8소스는44d와 LF 정규화 후 같지만, 이 결과는 전체44d 인증/배포 자격 검증이나 운영 회원 DB 검증을 대신하지 않는다.

부분 공개 UI는79회 기존 기본 경로를 계속 사용하며 미검수 구판 revision으로 전환하지 않는다. 명시적 구판 URL에는 기존 교재로 돌아가는 수동 동작만 제공하므로 실패를 다른 source로 감추지 않는다. 실제 root 연결과 공개 선언·운영 검수는 남아 있다.

### 2026-11-03 · PDF73 모바일 도식

중앙 정치 기구가 큰 빈 표와 가로 잘림으로 보이던 문제를 보정했다. 검증된 source 좌표에 HTML 글자와 SVG 선을 표시하고, source hash·page·그림 hash·모든 원문 행의 중복 없는 참조를 검사한다. 불완전하거나 교차한 자료는 도식을 그리지 않고 표와 native 캡션을 유지한다. 원본에서 확인한 지방5개 화살표, 중앙 묶음선과 6조/3사 노란 강조를 보존했고 중앙 도식/지도 및 각 캡션의 좌우 관계도 복원했다.

두 OS·두 브라우저·4개 화면 크기에서 실제73쪽 총16건을 검증했다. Linux 조선 전체 자동 읽기168건·빈칸8건과 판본/저장복구20건은 통과했다. 이는 운영 회원 DB 저장이나 전체 raster/vector 강조의 사람 검수를 뜻하지 않는다. 기존 회원·79회 진도는 수정하지 않았으며 운영 선언은 여전히 추가하지 않았다.

### 2026-11-03 · 조선 준비 단위 인계

조선 자료 후보의 질문 172개가 기존 canonical digest와 일치한다. PDF59–87의 native 글자와 ID를 보존하면서 검증된 원문 색·표와 일부 그림 캡션 배치를 복원했다. 표시 코드에는 blue ink, 같은 source에서 검증한 gray 셀, 모바일 원문 행/열 유지, 시험표 제목 폭 및 WebKit 분할 그림 비율 보정을 추가했다. 시대별 공개 선언은 기존 정확 API/source 게이트를 통과한 범위 안에서만 적용하며, 운영 선언은 추가하지 않았다.

구/신판 source·digest·CAS·저장 실패와 복구의 기존 계약은 유지한다. Linux Node24/동일 의존성 회귀 검사에서 판본 전환·저장/복구 20건, 디자인 6건 및 실제 조선 읽기 168화면·빈칸 8화면을 통과했다. 전체 교재 시각 검수와 실제 API root 연결, 통합·배포는 미완료다. 원문과 비공개 추출 자료는 public Git에 포함하지 않는다. 이후 담당은 조선 후보를 먼저 최종 검수·연결하고 운영 확인 후 고려로 진행한다.

### 2026-11-04 · 역사섬 저녁 장면 검수 후보

사용자 요청의 어두운 산속 저녁·조선 궁·중앙 모닥불/의자·오로라·날씨 변화·잎 우산을 별도 장면 레이어로 구현했다. 원화와 메뉴 hit 좌표를 유지하며 물·배·불·하늘·캐릭터 프레임만 각각 움직인다. 비공개 교재와 원본 이미지/등록 정보, 안정 ID·세 건물 라우트·정답·진도·XP·소유·권한은 변경하지 않았다.

Windows Chrome/WebKit 및 Linux Node24 Chromium/WebKit 각각 12건을 통과했다. 각 엔진은 320×740·390×844·844×390·1440×1000의 정상 8코어/8GB, 추가 390×844의 2코어/8GB, 모듈 실패/재입장을 검사한다. 기능·원래 메뉴/Back·터치/키보드·모션 정지/축소/숨김·실제 위상 변화·잎 우산/비·바닥 접점·토글 hit·레이어 정리·합성 기록 보존을 검수했다. source를 주입하던 독립 QA를 제거하고 실제 제품의 CSS/JS 지연 로드 경로를 사용했다. pause 검수는 Animation.ready 뒤 동일 시간/프레임 불변성을 확인하고, media 변화는 실제 상태 전달 뒤 기존 disabled/animation0 assertion을 유지한다. 이탈은 활성 #app 컨트롤 즉시 0과 전환 사본 detached 뒤 기존 전역 0을 함께 검사한다. 증거는 상위 작업 `evidence/history-two-core-windows`, `evidence/history-two-core-linux`의 결과와 각 20개 PNG이며 통합 담당이 실제 저전력 rain 화면도 확인했다.

별도 모듈·CSS가 없거나 실패하면 기존 메뉴와 물은 보존하고 다음 입장에 다시 불러온다. 영어섬 첫 단위 이후 정상 이력으로 순차 main 반영하고, 정확 SHA CI/CD·실제 TLS vhost 버전/HTML/변경 자산 해시와 합성 브라우저를 확인해야 한다. 현재는 구현·로컬 검수 후보이며 실제 iPhone/사용자 브라우저 검증을 뜻하지 않는다.

### 2026-11-04 · 영어섬 복구·페이지 수명 검수

검토 CI의 Linux WebKit 320px 검사에서 디지몬 정지 버튼이 Vocabulary 건물을 가리는 실패를 확인했다. 원래 hit assertion과 실패 화면을 유지하고 기존 Linux 검수 이미지에서 같은 실패를 로컬 재현했다. 고정 180ms 대기 뒤의 오래된 geometry snapshot과 screenshot 이후의 최신 geometry가 달랐으며, 실제 두 rAF 완료 후에는 같은 5개 화면의 assertion이 모두 통과했다. 토글은 첫 배치 전 hidden으로 두고 현재 offsetParent를 측정하며, 테마·포함 블록 변경에서도 실제 hit/지도 내부를 확인한다. pause 검수는 Animation.ready와 실제 hidden/visible 전환을 기다린 뒤 같은 프레임/시간 불변성 assertion을 유지한다. 앞선 실패 CI는 배포하지 않는다.

별도 Linux 비교에서 축소 모션의 WebGL 화면이 검정이지만 같은 task의 drawArrays/readPixels는 정상이고 active 모션·Canvas2D·buffer 보존 비교는 정상이었다. 앱의 정지 GL 재합성 문제로 좁혀 정지/축소 모션 때는 이미 추출한 선명한 plate를 표시하고 GL surface를 숨긴다. 계속 재그리거나 GL drawing-buffer 보존을 강제하지 않는다. 원래 boat를 제거한 plate와 단일 독립 배 레이어, context loss/Canvas2D fallback은 보존한다. screenshot의 실제 장면 RGB 샘플을 추가해 검정 배경을 frame 카운터만으로 통과시키지 않는다.

후속 CI `6cf8b8a`에서는 지도·실제 배경 픽셀 10건이 모두 통과했고, 디지몬 이탈 직후의 전역 버튼 수 검사가 실패했다. 같은 2코어 조건을 로컬에 주어 동일 `1 !== 0`을 재현했다. 저전력에서 입장 시네마틱을 생략하면 기존 `HanqStudyTransition.scene`이 aria-hidden/inert 사본을 520ms 유지하므로 URL 변경은 사본 제거 완료가 아니다. 실제 #app 버튼은 즉시 0인지 검사하고, 전환 사본이 detached 된 뒤 기존 전역 0 assertion도 유지한다. 각 엔진에 2코어 분기·뒤로 복귀 케이스를 추가했으며 고정 시간 샘플 대신 실제 날개 프레임 변화와 media 상태 전달을 기다린다. 제품 전환 코드나 검사 기대값을 바꾸지 않았다.

최종 소스의 Linux WebKit 영어 지도 5건, Linux Node24 Chromium/WebKit 디지몬 12건(전체 2코어 조건), Windows Chrome/WebKit 지도 10건·디지몬 12건, 물/배 9건 및 고궁 회귀 각18건 통과. Linux 비교는 외부 네트워크 차단·읽기 전용 소스와 합성 API만 사용했다. 로컬 증거는 작업 `evidence/linux-english-repro`, `linux-node24-scene-final`, `linux-gl-diagnostic`과 repo `evidence/palace-static-plate-*`에 있다. 최신 main 문서 `b903fdf`를 정상 병합해 보존했다. 사용자 요청에 따라 같은 Linux/2코어 조건의 로컬 검증 후에만 필요한 최종 CI를 실행하며 알림 설정은 바꾸지 않는다. 정확 SHA CI·운영 검증은 아직 별도 단계다.

기존 운영 d842314의 실제 프레임 디지몬/건물 메뉴를 재사용한 작은 오류 수정 단위다. 연결 실패 후 지도를 다시 들어가야만 캐릭터가 복구되던 흐름을 같은 지도 내 재시도로 보완하고, pagehide/pageshow·축소 모션·정지 선택·화면 이탈 수명을 함께 유지한다. 새 장면 아트와 한국사 교재는 이 단위에 포함하지 않는다.

1차 목표/복구 검수와 2차 기존 메뉴·기록 회귀, 3차 모바일·가로·두 엔진 렌더 검수에서 Windows 장면 22건·기록 67건 성공, pageerror 0. `evidence/english-residents/results.json`, `evidence/english-island/results.json`과 엔진·크기별 PNG가 Windows 작업 근거다. 숨김 시험에서 드러난 WebKit ResizeObserver 알림 오류는 위치 쓰기를 rAF로 모은 뒤 같은 검사를 다시 통과했다. 정적 빌드는 커밋 전 소스가 dirty이면 의도대로 거절하므로 커밋 후 다시 수행한다. 최종 CI/CD와 실제 운영 SHA/정적 자산 대조는 후속 evidence와 최종 결과에 구분해 보고한다.

### 2026-11-03 · 한국사 디자인 통합 검수 후보

목표는 디자이너의 읽기 면을 기존 기능과 연결하는 것이다. 고정79회/81회 source SHA를 구분해 같은 표시 스타일을 쓰며 구판을81회로 바꾸어 부르지 않는다. 데이터·정답·ID·원본 배열·quiz digest·workspace·인증·API 준비 게이트는 변경하지 않았다. sourceRowIndices 기반 단일 연결과 원문 관계, 59/14/91 구판 분류를 보존하며 원문 PDF/이미지 픽셀은 수정하지 않았다.

저장 오류 보고는 qa-source-blank-player.cjs에 동일한 구판 fixture를 제공해 fc5e897과 통합 후보를 비교했으며 양쪽 모두 390/1440에서 실패·재시도·재개 검사를 통과했다. 정확한 기존 실패 명령/로그가 전달되지 않았으므로 이전 보고의 원인이 확정됐다고 표시하지 않는다. qa-history-source-quiz.cjs의 실제 개정판 검사는 양쪽 모두 semantic/quizzes 부재로 실행 전에 ENOENT이며 미검증으로 남는다. PDF SHA 일치·172개 앵커를 canonical a974/697문항 복원 또는 운영 활성화 성공으로 대체하지 않는다.

새 CSS에서 학습 진행 표시 숨김을 제거하고 모바일 재배치의 원문 색 제거를 수정했다. 기본 renderer의 일반 th 색이 원문 셀 색을 가리는 경우도 판본 전용 범위에서 원문의 5개 색 역할을 우선했다. 이 보정은 검증된 label/content 재배치 표에만 한정하며 도식·서열표의 별도 헤더/범위 색은 그대로 보존한다. 합성 표의 행 제목/본문 관계·키보드·44px 입력·16px 글자·색 대비·저장 실패 재시도·원본 cursor·구판의 정확한79회 표시를 Chromium/WebKit 3개 폭에서 확인했다. 입력 경계선은 제출안의 1.66:1에서 3.35:1로 보정했으며 원문 표 선/셀 색은 이 조작 컨트롤 보정과 분리했다. 물리 Safari/iPhone 검증이나 실제 81회 전체 원문 대조를 완료했다고 주장하지 않는다.

후속 사용자 승인으로 검증된 디자인을 기존 자료에 우선 운영 반영한다. 정확 SHA CI 뒤 최신 main 정상 통합과 자동 홈 CD를 수행하고 실제 반영을 별도 확인한다. 정확 커밋·CI URL·미해결 입력은 별도 인수인계 패킷에 기록한다.

### 한국사 reader 독립 후보 · 2026-11-03 · 미배포

구판144/신판147의 선택과 원문 비교 UI를 같은 reader로 통합하고 원문 내용은 수정하지 않았다. 구판 workspace와 복구 draft, PDF revision/quiz digest/CAS, manifest에 따른4지선다 제공 여부를 보존한다. 검사는 합성 transport·실제 자료 로컬 renderer·BE 실API·운영 확인으로 구분한다. 자동147쪽/697문항 검증은 사람의 모든 표·그림 대조를 대체하지 않는다. 실제 신규 판본 API 연결과 정확 SHA CI 결과는 최종 인계 근거를 따른다. 장면716 main/home FF는 자동 승인 검토가 두 차례 거절해 실행하지 않았고 중지했다. 다른 경로나 권한 변경으로 우회하지 않으며, 기존 운영061과 Vercel fallback을 유지한다.


## 2026-11-02 헤더·대본 표시 0.2.7-beta

- 운영ca0113/0.2.6 기반의 좁은 표시 수정이다. 프로필/이동 패널·베벨을 없애고 아바타/청록 글자/지도·뒤로 선 아이콘과 hover/focus 반투명 면으로 바꾼다. 브랜드 중앙·실제 nickname/XP/파트너·기존 숨김/라우팅은 보존한다.
- 대본 안내 세 종류의 UI 출력만 제거하며 원문/status/타이밍/해석/근거 필터·실제 없음 안내·채점/저장은 보존한다. 지도 배경·재생 의미·미배포 Hall/XP/Growth는 포함하지 않는다.
- 필수 검수는 ca0113 baseline/candidate 하위355/390/1024 전체·헤더·focus PNG, 실제 pointer used-height/양방향 hit, 기존 전체 CI 및 대본308/Listening28 계약 검사다. 실행 전 검사/운영 완료로 기록하지 않으며 정확 SHA의 CI와 실제 domain version/자산으로 상태를 구분한다.


## 2026-11-02 지도·헤더 0.2.6-beta 통합

- 최신 운영 기준 0.2.5-beta `7a9cd33de61c4e71a9e9c118315cb41d0f09f4ac` 위에 지도/헤더 source와 검사를 통합한다. Practice 0.2.4와 반복 UI 0.2.5 source·CI 확장은 보존한다.
- 모바일은 여섯 원본 섬·배치·클릭을 유지하고 별도 바다 파생 배경을 보완한다. 원본 전체 배경을 그대로 복원했다는 뜻이 아니며 원본 mobile/wide PNG는 보존한다.
- native 지형의 복제 lift/inverse-hole 효과는 검은 polygon 틈의 경로이므로 제거한다. 원본 지형은 hover/focus에도 고정하며 라벨 상태·클릭 contour·개별 캐릭터 애니메이션은 유지한다.
- 공통 헤더는 좌 이동/독립 중앙 브랜드·버전/우 실제 프로필이다. 실제 폭이 부족할 때만 프로필을 같은 바의 오른쪽 둘째 행으로 옮기고 닉네임·장착 XP·노란 계정 총 XP·44px 터치·키보드 focus를 보존한다. 배경 alpha만 적용하며 observer는 rAF coalesce와 수명 정리를 한다.
- 필수 검수: 320/355/390/591/613/1024 Chrome/WebKit 합성 화면, native 원본 해시·정적 전체-frame exact·hover/focus 검은 틈, 큰 XP/긴 이름, 355↔390 반복 resize와 8프레임 후 안정성, 기존 전체 CI. 실제 iPhone 검사라고 표시하지 않는다.
- 구현·검사 성공·원격 push·운영 반영은 각 커밋의 정확 CI와 실제 domain의 version/SHA/자산 해시로 구분한다. 이 source 기록은 운영 완료를 대신하지 않는다. API/DB/인증·권한·원문/답안·기록/XP·인프라 변경은 없다.

> 2026-10-30 현재 릴리스 범위: 직접 확인한 사용자 로컬 참고5장을 재해석한 행복의 마을(왼쪽 놀이동산·오른쪽 큰 나무 알 둥지·아기 디지몬3마리), 선로에 맞는 역정차/짧은 왕복, 곰 가림 방지와 My Page 카드 보관함을 반영한다. 현재 파트너·계정XP와 빈 준비 중 슬롯만 표시하며 알 구매/60초 부화/새 장착·개별XP 저장은 닫혀 있다. API/DB/auth/CORS 변경과 새 Library 업로드는 없다. 전체 기능 후보 FEa111e8d/API987be57은 보존한다. 정확한 운영 SHA·CI·Production 검증은 최종 결과를 기준으로 한다.

현재 버전 폴더 `v0.1.0`은 API의 기존 `package.json` 버전 `0.1.0`을 기준으로 한 문서 기준선이다. FE에는 별도 패키지 버전이 없고 두 저장소 모두 Git 릴리스 태그가 없다. 새 제품 릴리스를 선언하거나 태그·패키지 버전을 변경한 것이 아니다. 배포 식별은 아래 정확한 커밋을 사용한다.

<a id="timeline"></a>
## 날짜별 변경 이력

다음은 같은 패키지 기준선 안의 실제 작업 이력이다. Git 반영과 당시 운영 검증을 구분하며 현재 기능으로 확정한 것은 최신 설계를 따른다. 과거 미완료가 후속 커밋으로 대체된 경우도 날짜를 유지한다.

| 날짜 | 한 일 | 실제 근거 | 상태·한계 |
|---|---|---|---|
| 10/08 | 초기 계정/서버·기출/원문 학습 통합 | 원격 이력에 보존된 당시 local-release 보고 | 당시 로컬 검사·운영 준비 기록. 오늘 미배포 상태라는 뜻 아님 |
| 10/13 | 선정표 회상 공백·연결 보기·그림 출처 감사 | 독립 감사와 source/coverage JSON | 전체 풀과 선정표를 구분. 미확인 후보를 이번 문서 작업으로 해결 처리하지 않음 |
| 10/22~23 | 디지털월드 화면·개인 체크·KST 기록·문법/보기 해설 | API `1db4962`, `b04df44`, `213686a` 및 당시 검수 보고 | source/역사 검사 범위. 실제 iPhone 전체 성공 근거 아님 |
| 10/24~25 | 약점 문제/첫 결과·최근3회, 연결어 PDF, Chapter1 공개, LC 순차 준비 | FE `6efbe0e`, `310e973`, `aeb094f`; API `6a5c65b`, `2ac130f` | 초기 준비중/2쪽 압축 설계는 후속으로 대체 |
| 10/26 | Chapter2·3, PDF 독립 예문·Tip 간격, 공통자료/개인답안, opt-in90일 | FE `04f1a2f`, `52b0f59`, `9336983`, `7a44d78`; API `0ac880a`, `1dc1eb7`, `90085b7`, `0ed4de8` | Git 반영 확인. 정책 설정을 이 문서가 변경하지 않음 |
| 10/26 | SSE·자동진행·지연응답/공격 누락 복구·연습봇 | FE `8522ffa`, `011a582`; API `022e843`, `e32a225` | 격리 전체 앱·두 참가자·응답 지연 검사. 물리 단말 미검증 |
| 10/27 | 문제/종료 모달·Ready·HP 잔상,6섬 지도·전투 오답·UI 정리 | FE `0502f01`, `b3036c1`, `63ce626`; API `129d50b`, `30d7376` | 아래 최신 기능 배포·자산/health·DB045 근거 확인 |
| 10/27 | 전체 기획3문서·버전 기록 입구 | FE `583e508`; API `8ecbfc0` | Vercel 체크 성공·Render Live, health200 확인 |
| 10/27 | 기존 문서 실제 통합·중복 제거·이력 표 정리 | 이번 문서 전용 diff와 이후 Git 커밋 | 링크/원문 대응·실행 참조 검사. 새 기능/실계정 검사는 아님 |

## 확인된 배포 결과 — 2026-10-27

- FE [63ce626](https://github.com/blockmonkey1992/hanq/commit/63ce62688bb217ab0d46cb80f300854a2430e4c9): Vercel 성공. 운영24개 FE자산 bytes의 SHA256이 최종 검수 후보와 일치했다.
- API [30d7376](https://github.com/blockmonkey1992/hanq_api/commit/30d7376ea8698e9847d58b99d2aead82820b4605): Render `dep-dbg18hbbc2fs739o44f0` Live. 기존 Render Free와 Supabase 구성 유지.
- migration045 `045_battle_wrongnotes.sql` 체크섬 `c57102980ea7435194ba93181ec069f409d86008697032da1658c06356d79941`. 기존44개 체크섬과 기존 테이블 권한 불변, 새 제약·인덱스 확인. 사용자 데이터 쓰기0.
- [운영 지도](https://hanq.vercel.app/#subjects) 픽셀 확인. health200, 익명 battle history/wrongnotes401. 운영에서 실제 사용자 대결/답안/XP를 만들지 않았다.

## 검사 근거와 한계

독립 지도 QA는375×667/390×844/360×640/1156×838/1440×900,6메뉴·4캐릭터·이탈 정리·reduced-motion·기존 TOEIC 화면을 확인했다. 실제 전체 index/common scripts와 로컬 Nest/PGlite/SSE 두 브라우저에서7묶음10문항,9.2~9.7초 지연·응답 유실·READY·제출/완료·공격/HP·자동 진행·종료 리뷰·개인 기록/오답/정산 중복방지를 검사했다. 해당 실행 wire40건 조기 연결종료0·브라우저 오류0이었다.

근거 산출물은 작업 공간 `deliverables/map-renewal/REPORT.md`, `source-manifest.json`, `release/deployment.json`, `release/live-assets.json`, `release/migration045.json` 및 별도 `independent-map-20261027/INDEPENDENT-REPORT.md`다. 이 로컬 QA 산출물은 저장소의 공개 자산으로 복사하지 않았다. 물리 iPhone/Safari·네이티브 PostgreSQL 다중 프로세스·장기 운영 부하 검사는 이 결과에 포함되지 않는다.

초기 API push는 목적지 승인 심사로 실행 전 거부됐으며 정확한 두 저장소/dev의 새 사용자 승인 후 한 번 재시도해 완료했다. 실패한 공개65초 프로브는 재시도하지 않았다.

## 문서 정리 결과와 향후 업무

최초 문서 입구 정리에서는 기존 기록을 유지하고 전체3문서·버전별3문서·README 입구·AGENTS/CLAUDE 문서 규칙을 추가했다. 문서 변경은 기능 배포 결과를 소급하여 바꾸지 않는다. 문서 커밋은 Git 이력으로 식별하며 새 제품 릴리스 태그를 만들지 않는다.

다음 후보는 실기기 재생 검사, 다중 인스턴스 준비, 반복 대결 보상 악용 정책이다. 효과음·무지개마을 실제 기능은 계획이지 완료가 아니다. [계획](plan.md)과 [진행](progress.md)을 갱신한다.

<a id="consolidation"></a>
## 기존 문서 통합·제거 검증 (2026-10-27)

중복된 파일을 archive로 옮기지 않고 현재 기획·설계와 아래 버전 결과로 통합했다. 원문은 이 저장소의 이전 원격 커밋 `583e508c5cedce9e48ae8ebcaa4331524f89350d`에서 복원할 수 있다. 현재 트리에서 제거한 파일은 모두 이 커밋에 추적돼 있었으며 미추적 유일 자료는 삭제하지 않았다. 아래 대응은 옛 파일의 내용 범위이며 과거의 수치/준비중/미배포를 현행 완료 사실로 승격하지 않는다. 당시 검사 세부는 Git 원문에서 확인하고 현재 검증은 이 보고서의 배포·한계 항목을 따른다.

<details>
<summary>기존 파일별 통합 대응표</summary>

| 제거한 기존 파일 | 현재 내용 위치 |
|---|---|
| `adventure-offline-20261022.md` | [통합 설계: LC 재생·대본·준비](../../design-development.md#audio) |
| `adverb-pairs-pagination-review.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `ancient-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `async-study-presentation-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `auth-recovery-and-source-grading.md` | [통합 설계: 개인 기록·계정 복귀·학습 피드백](../../design-development.md#records) |
| `cards-font-cache-20261022.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `cbt-explanations.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `cbt-result-history.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `cbt-stars.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `cbt70-78-verification.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `cbt79-restoration.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `chapter1-mini-preview-20261024.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `character-speech-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `colonial-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `comparison-focus-review.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `connection-choice-quality.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `connection-recovery-qa.md` | [통합 설계: 개인 기록·계정 복귀·학습 피드백](../../design-development.md#records) |
| `connector-recall-board-20261023.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `connector-summary-20261025.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `connectors-2024-expansion-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `device-v2-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `digital-world-renewal-20261022.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `era-full-summary.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `era-partial-grading.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `era-study-feedback.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `file-island-lc-pwa.md` | [통합 설계: LC 재생·대본·준비](../../design-development.md#audio) |
| `file-island-world-20261022.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `final-era-structure.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `final-learning-audit-20261023.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `focused-study-review-20261023.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `full-review-menu.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `goryeo-culture-ancient-artifacts.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `goryeo-joseon-comparison.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `goryeo-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `grammar-all-nine-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `grammar-memory-board-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `grammar-nine-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `grammar-priorities-relative-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `grammar-three-section-review.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `independent-content-audit.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `integrated-blank-practice.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `island-background-tip-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `islands-integration.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `joseon-core-review.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `joseon-full-summary.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `joseon-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `joseon-short-card-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `joseon-tabs-recall.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `lc-player-script-20261022.md` | [통합 설계: LC 재생·대본·준비](../../design-development.md#audio) |
| `lc-player-tab.md` | [통합 설계: LC 재생·대본·준비](../../design-development.md#audio) |
| `local-release-20261008.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `login-theme-contrast.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `map-header-account-20261022.md` | [통합 설계: 개인 기록·계정 복귀·학습 피드백](../../design-development.md#records) |
| `mini-options-layout-20261026.md` | [통합 설계: 미니모의·묶음 제출](../../design-development.md#mini) |
| `mixed-review-quiz.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `modern-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `monthly-activity-20261023.md` | [통합 설계: 개인 기록·계정 복귀·학습 피드백](../../design-development.md#records) |
| `notes-only-navigation.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `opening-review-coverage.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `part5-option-study-20261023.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `part7-membership-audit-20261023.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `personal-goryeo-review.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `pronoun-number-board-20261023.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `pronoun-summary-20261022.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `public-review.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `qa/toeic-grammar-pdf-coverage.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `qa/toeic-grammar-review.md` | [통합 설계: 문법·보기 해설·학습 근거](../../design-development.md#grammar) |
| `quick-recall-20261023.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `quiz-scope-deployment.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `reviewed-quiz-verification.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `source-blank-player.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `spatial-world-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `study-flow-qa.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `study-renewal.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `summary-eras.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `summary-ruler-layout.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `transparent-characters-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |
| `unidentified-image-followup.md` | [통합 설계: 한국사·전체 복습·콘텐츠 정확성](../../design-development.md#history) |
| `vocabulary-chapters-v1.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-details-map-20261023.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-formulas-20261025.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-lemmas-test-mode-20261023.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-new-20261022.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-print-and-phrases-20261024.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `vocabulary-print-two-pages-20261025.md` | [통합 설계: 단어장·PDF·개인 체크](../../design-development.md#vocabulary) |
| `world-navigation-profile-20261023.md` | [통합 설계: 지도·디지바이스·화면 수명](../../design-development.md#world) |

</details>

원문/학술 출처·실행 계약·운영 매뉴얼과 스크립트 입력/생성 대상은 사용처를 확인해 유지했다. JSON·법적 고지·코드·마이그레이션·사용자 데이터는 이동/수정하지 않았다.

### 콘텐츠 감사에서 남은 확인 항목

2026-10-13 독립 감사는 당시990문항 데이터와 실제 기본 선정표를 구분했다. 벽란도/별무반·동북9성/한국광복군 등의 선정표 누락, 연결문항4개의 제목 답노출, 강수·KAPF·사사오입·OECD 등 회상 공백 후보를 지적했다. 이번 문서 정리는 후속 코드/콘텐츠의 전수 재검사가 아니므로 이를 현재 미수정 또는 모두 해결이라고 단정하지 않는다. source-map과 질문/정답/정답보기 출현을 분리해 재대조해야 한다.

연결 보기 품질 감사의239그룹 중 실제 확인해 반영한10프로필과 나머지228신규문항은 구분한다. 이후 운영/seed를 이번에 검증하지 않았다. 미식별 오답 그림 `exam-72-23-option-3`, `exam-76-27-option-2`, `exam-78-26-option-3`의 정확한 작품명·작가는 당시 원본 문제지에 없어 미확인이었다. 정답 그림의 작가로 오답 작품을 추정하지 않는다. `image-option-verification.json`, `connection-choice-audit.json` 및 보존된 검수 자료를 기준으로 추가 확인한다.

통합으로 현재 트리에서 제거한 Markdown은86개, 유지한 상세 계약/운영/출처 Markdown은27개다. 기존 JSON은 전부 제자리에 유지했다. 새 기획3문서와 버전3문서가 기본 읽기 경로다.

## 10/27 얼음섬 지형 클릭·확대 후속

부제 `빙하`를 제거하고 실제 얼음섬 실루엣을 포인터 진입 대상으로 추가했다. 이름표는 같은 진입 경로와 키보드 접근을 유지한다. 원본 PNG4개는 SHA256 불변이며, SVG 클립으로 지형만 분리하고 별도 레이어를 확대한다. 시각 레이어는 확대 중 빈 틈이 나지 않도록 외곽을 감싸고 클릭 영역은 더 세밀한 지형 윤곽으로 제한한다. 바다·다른 섬과 전체 지도는 확대/클릭 대상으로 확장하지 않는다.

375×667/390×844/360×640/1156×838/1440×900 실제 전체 index 및 합성 읽기 API에서6메뉴 비겹침·클릭영역·첫 터치 진입·Tab/Enter·지형 scale1.075/배경 transform 없음·reduced-motion·이탈 정리를 검사했다. 시간차 hover/기본/키보드 캡처의 픽셀을 확인했고, 최초 시각검수에서 발견한 확대 경계 틈을 보완 후 재검사했다. 실제 iPhone/Safari 검사는 아니다. 이 작은 지도 변경에서 실사용자 전투/답안/XP를 만들지 않았다.

별도로 문서 QA가 발견한 `index.html` 주석의 삭제된 문서 경로를 `docs/design-development.md#history`로 수정하고 앵커 존재를 확인했다. 주석 외 해당 코드 동작은 변경하지 않았다. 산출물은 작업 공간 `deliverables/map-ice-hit/qa.cjs`, `map-result.json`, `map-*-hover.png` 등이며 운영 커밋/자산 확인은 최종 작업 결과에 기록한다.

## 10/27 오전 피드백 최종 일관성 검수

운영 FE2fb8989/API2d9a2a7을 기준으로 요구사항을 대조했다. API 코드는 변경하지 않았다. 추가 수정은 (1) 낮은 창에서 지도 하단이 잘리던 표시 결함을 내부 스크롤로 보완, (2) 독립 QA가 O/X 위에서 발견한 “서버 판정 완료…” 기술 안내를 빈 상태로 정리한 것이다. 성공/판정/점수나 복구 한도를 바꾸지 않는다.

| 요구 | 실제 확인 근거 |
|---|---|
| 답 재선택·제출 잠금·접수 후 완료 | 단위 검사 + 전체 앱 두 참가자 지연/응답 유실/중복 클릭 |
| 파란○·빨간X, 공격 후 자동 다음 | 전체 공통 스크립트·Nest/PGlite/SSE와 실제 가시 프레임; 기술 안내 제거 후40요청·안내0·오류0·공격/자동다음/리뷰 통과 |
| 단계별 거품/3초 충전/크기·가슴/양손·피격·종료 |375px 좌우6단계12시나리오 시간차 캡처와3초·7거품·투사체 크기 검사 |
| HP 부드러운 감소·지연 바 | 전체 앱에서 실제 중간 width·뒤따르는 바·SSE 중 역증가 없음 |
| 0. 전투 오답·계정 분리·반복 출처 누적 | 실제 오답 화면 재풀이·타 계정404 + 격리 DB250검사 |
| 문법 정리·4화면 헤더 |375/390/1280 전체 index,3개 현행 노트·풀이 진입·제목/뒤로/스크롤 |
| 플레이어 Script 내부·4행 목록·배속 순환 | 같은3규격,56곡·실제 Audio.play/currentTime·Enter/Space·트랙 전환/저장값 |
| 전투 LC 조작 UI없음·1× | 실제 로컬 음원 currentTime증가·hidden/controlsfalse·기본/실제rate1·서버마감 |
| 봇 제출 완료 후 판정·XP0·리뷰 | 실제 로컬 전체 앱 두 사용자 독립 봇 경기·승패/기권 XP0·리뷰/MyPage 재진입 통과 |
| 대기실 문구·새로고침 아이콘·중복 내비 제거 |3규격 fixture·실제 초대/과목 즉시갱신 및 전체 앱 |
| 준비전 나가기·진행중 도주 | 두 브라우저8케이스·XP없는 취소/양쪽 복귀·재매칭·진행 이후 기권 |
| 기록 승패색·실제XP·KST·복기하기 |3규격 카드 및 전체 앱 종료 리뷰/MyPage 재열람 |
|6메뉴·영어섬·준비중·부제제거·지형 확대 |기본5규격·지형 hit-test/keyboard/reduced-motion; 추가948×318/844×390/320×568 내부 스크롤 접근 |
| 버전 문서·기존 경로/개인 기록 보존 | plan/progress/report와 링크/앵커·diff·원격 이력 대조; API/이미지/콘텐츠/권한 불변 |

기본 API 단위257개 중254통과/3기존 원본자료 의존검사 제외다. 제외된 것은 전체54 LC 원본 결합,48개 원문 문항 결합,12개 원문 지문 대조 검사이며 이번 실행에 비공개 입력이 없어 skip됐다. 이를 콘텐츠 전수 검증 통과로 세지 않는다.

최초 좁은 지도 검사는 메뉴 잘림으로 실패했고 수정 후8규격에서 접근 가능함을 확인했다. 봇 첫 실행은 앱 문제가 아니라 옛 `결과·문제 리뷰` 버튼 selector를 찾다 종료해 현재 `복기하기` 이름으로 테스트만 고쳐 재실행했다. 실패를 성공으로 합산하지 않는다.

산출물은 작업 공간 `deliverables/final-consistency/`에 분리한다. 실제 iPhone/Safari/VoiceOver·네이티브 PostgreSQL 다중 프로세스·장기 백그라운드/메모리 압박은 미검증이다. 실제 사용자 답안·XP·진도/계정·비밀번호/권한을 시험용으로 바꾸지 않았다.

최종 안내 제거 후 전체 앱 회귀는 wire40건·조기 연결종료0·두 참가자 기술문구0·브라우저오류0이다. 봇 재시작 검사는 미판정 문항 도중이 아니라 결과 표시 중이므로 그 범위를 확대하지 않는다. 별도 독립 QA의 고정본2fb8989에는 당시 지도 낮은 화면 보완이 없었으며, 해당 보완은 이번 담당자8규격 검사로 구분한다. 운영 테스트에서는 실제 대결/XP를 만들지 않고 배포 SHA·정적 자산 해시·health와 지도 픽셀만 읽기 확인한다.

## 10/27 여섯 섬 상호작용 통일

이전 얼음섬 전용 구현을 6개 섬으로 확장했다. 실제 해안·건물·나무 외곽을 포함하는 PC/모바일별 오목 경로를 사용하고 볼록 껍질을 제거했다. 바탕의 같은 영역은 제외해 원래 지형의 중복 잔상을 막으며, 지형과 캐릭터가 함께 살짝 떠오른다. 원본 지도 PNG 및 API·개인 기록은 변경하지 않는다.

첫 시각 검수에서 링크 두 섬에 공통 hover 배경이 끼어드는 결함을 발견했다. 투명 지형 span이 같은 이름표 동작을 호출하도록 고쳤으며, 실패한 검사는 최종 통과로 합산하지 않는다. 최종 섬별 검사표와 운영 결과는 검수 완료 후 기록한다.

| 섬 | 비정형 지형/제목 동작 | PC hover·focus | 모바일 지형 첫 탭 | 상태 |
| --- | --- | --- | --- | --- |
| 역사숲 | 같은 기존 한국사 경로 | 통과 | 통과 | 이동 가능 |
| 영어섬 | 같은 기존 TOEIC 경로 | 통과 | 통과 | 이동 가능 |
| 얼음섬 | 같은 기존 배틀 경로 | 통과 | 통과 | 부제 없음 |
| 무지개마을 | 진입하지 않음 | 통과 | 비활성 유지 | 준비 중 |
| 명예의 전당 | 같은 기존 전당 경로 | 통과 | 통과 | 이동 가능 |
| 건의 문의 | 같은 기존 문의 경로 | 통과 | 통과 | 외부 전송 없음 |

실제 전체 index/common scripts와 합성 읽기 API를 사용해 375×667·390×844·360×640·1156×838·1440×900 5규격과 948×318·844×390·320×568 3규격을 검사했다. 지형 6개 hit, 라벨 비겹침·44px 이상, 캐릭터 4개 배회, keyboard/터치 이동, 배경 transform 없음, reduced-motion의 6개 transform 없음·애니메이션 정리, 이탈 후 정리를 통과했다. PC 6개 hover 및 모바일 6개 focus 캡처의 픽셀을 확인했다. 원본 PNG 4개의 SHA256은 기준 a18efff와 같으며 실제 iPhone/Safari 검사는 아니다. 첫 비활성 label 테스트는 Playwright의 disabled click 대기로 실패해 실제 터치 입력으로 바로잡았으며, 그 실패 실행을 성공으로 합산하지 않는다. 운영 SHA·자산 hash·health는 배포 후 최종 결과 보고로 구분한다.

## 10/27 대기실 목록 간소화

375×667·390×844·1280×900 합성 대기실에서 사람0+봇1은 카드1개, 사람3+봇1은 카드4개, 한국사 실제 빈목록은 카드0개·허위 참가자/빈문구 없음으로 검사했다. 한국사에는 봇을 숨기고 빠른 과목 토글 후 최종 선택과 일치했다. 수동 새로고침 연타는1회 요청, 바쁜 상대의 초대 버튼 비활성 및 접근 가능한44px 갱신 아이콘도 유지했다. 실제 모바일 캡처를 확인했다. 서버/XP/초대 처리 로직은 변경하지 않았으며 이 작은 UI 변경에서 운영 대결·답안·XP를 만들지 않았다.

## 10/27 Part6 전투·복기 정돈

원자료 대조상 Jabari Prize는 Part6 원문135~138 묶음이며 Part5 혼합이 아니다. 기존 일반 오답노트는 앱번호·원문번호가 있지만 지문 stem이 반복됐고, 전투·복기는 번호도 없이 stem만 보여 혼동을 키웠다. 전투 쪽에 Part6 전용 표시를 적용해 공통 지문1회, 원문번호와 지문 [번호] 연결, 번호별 보기·내답·정답·해설을 보존한다. 단일 전투 오답에도 전체 지문과 원문 빈칸 번호를 유지한다. Part5·7 질문을 전역으로 숨기지 않는다. 원문/보기/정답/해설·서버·사용자 기록은 변경하지 않는다.

최종 Part6 UI12시나리오(131~146 네 묶음×375/390/1156), Part5·7 회귀6, 기존 오답노트 비교3 및 관련 표시/제출/개인오답 단위 검사가 통과했다. 작은 모달의 원문번호별 O/X2×2격자와 지문 내부 스크롤·선택/명시제출·복기4해설·단일 오답 전체문맥을 실제 캡처로 확인했다. 합성 API 검사이며 실제 iPhone/운영 기록 검사는 아니다. 초기 fixture의 숨김 버튼 수·스크롤 컨테이너·빈 이벤트 배열 기대 오류는 바로잡아 재실행했고 실패를 통과로 합산하지 않았다. 자동 승인 심사에서 원격 목적지 승인 부족을 이유로 commit/push 명령이 실행 전 거절되어 당시 운영은7188553이었다. 이후 보완 승인으로 한 번 재시도해4fe4de3을 커밋·push했고 Vercel 완료·운영자산6개 일치·health200을 확인했다.

## 10/27 관리자·문의 로그인 복원

실제 api-client·portal-ui와 합성 HttpOnly 쿠키를 써 기존 직접Render 주소401과 같은프록시 수정 후 관리자/회원/게스트12시나리오를 비교했다. 회원관리403은 로그인상태를 유지하고 게스트401은 숨기지 않는다. 관리자 갱신9.3초도 조기실패가 없다. 추가5시나리오에서 legacy503/10초timeout후1회 복원, remember모드503/timeout의 결과불명 재전송금지·중립안내·힌트보존, 메인/관리자/문의3탭 갱신동시1개·회전쿠키순서·힌트보존을 확인했다. 실제 운영 계정·비밀번호·세션·권한을 시험하지 않았고 API/보안정책은 그대로다. 새 로그인 디자인과 수동 진화는 이 복구 커밋에 섞지 않는다.

## 10/27 통합 로그인 장면과 스크롤 안내 정리

전체 index/common scripts와 합성 인증 응답으로320/375/390/768/1280px5규격을 검사했다. 한 장면 안의 폼·두 캐릭터·기존 배경, 로그인 제출1개·회원가입폼아래·아이디저장UI없음·90일유지옵션, Enter1회 요청·실패 입력/체크 보존·alert·회원가입/로그인 복귀·가로 넘침없음·모션축소를 확인했다. 모바일450px높이 축소와 입력focus/스크롤도 확인했으나 실제 가상키보드/아이폰 검사는 아니다. 기존 합성 쿠키 재시작3규격에서reload·503세션유지·네트워크힌트/복구·로그아웃·확정401·비밀번호/토큰미저장을 재검사했다. 제출·배속 회귀 단위 검사도 통과했다. 초기 배경 스타일 충돌과 진행메시지를 최종오류로 취급한 fixture기대 문제를 수정 후 재실행했으며 실패를 성공으로 합산하지 않았다. 원본 이미지·API·세션/권한/기간은 바꾸지 않는다.


## 10/27 개발 기간 무료 프리미엄

개발기간 정책은 HANQ_DEVELOPMENT_PREMIUM_OPEN=false로 해제할 수 있다. 운영 기본은 개방이며 테스트 기본은 기존 정책을 유지한다. 회원의 active는 실효 접근, paidExpiresAt/entitlementActive는 기존 유료권 상태로 구분한다. 새 구매 및 테스트 이용권 발급은 막고 기존 결제 확인·권리 이력은 보존한다. 프런트는 회원가입/마이페이지에 개발기간 무료 안내를 표시한다. 기존 관리자 검사와 개인 기록 소유자 검사는 변경하지 않았다. 테스트는 합성 계정이며 실사용자 데이터나 결제·권한을 수정하지 않았다. 실제 iPhone은 미검증이다.


## 10/27 전투 백그라운드 진행 복구

독립 QA가 운영 기준6bea699/15def62에서 렌더러 중단 시 다음 ready 정체·60초 후 자료 준비 무효, 숨김 중 복구 창 만료 후 복귀 미시도를 재현했다. 원인은 비LC 다음 문제까지 클라이언트 연출/ready ACK에 의존한 서버 전이 및 만료 recoveryEnd가 복귀 재시도를 차단한 분기다. 수정은 서버 문제 시각과 표시 연출을 분리하고 정상 스트림을 보존한다. 최초 양쪽Ready, LC의 양쪽 다운로드/해시·메타데이터 준비, 실제 단절의 서버10초 유예, 도주/점수 규칙은 유지한다. 실제 OS Alt+Tab/iPhone 실기기는 아직 검증하지 않았다. 수동 진화·관리자 reset·새 스키마는 포함하지 않았다.


## 10/27 동시 대결 신청

기존 서버는 직렬화된 두 번째 교차 신청을 battle_busy409로 거절했고 FE는 이를 연결 실패로 표현했다. 같은 두 명·같은 과목은 현재 방으로 수렴시키고 새 requestId는 비공개 state에 보존한다. 동일 ID 재전송은 종료된 원래 방을 반환하며 자동 새 경기나 수락을 만들지 않는다. 다른 상대 경기/다른 과목은409로 유지하고 FE는 신청 충돌 안내로 구분한다. 수락 직후 도착한 시작 전 취소도 XP0 취소로 수렴한다. 0점 감사 행은 남기며 실제 XP 적용량은0이다. 권한·스키마·실사용자 기록 변경은 없다. 네이티브 Postgres 병렬 접속은 미검증이며 PGlite 실제 SQL 트랜잭션+HTTP동시 요청 검사다.


## 10/27 전투 학습 본문 글꼴

기존 전투는 페이지 전체 게임 글꼴을 상속해 영어 학습 본문도 디지털 글꼴로 보였다. 새 battle-study-type.css는 학습 콘텐츠/복기만 기존 TOEIC CBT의 실제 스타일로 분리한다. 실제 스타일·렌더러의 Part6 12시나리오에서 지문·문항·보기 computed family/size/line-height/weight를 기존 CBT와 대조했고, 긴 지문 스크롤·재선택·제출·OX·복기를 확인했다. terminal 테마 강제 스타일도 활성화했다. 별도 한국사/Part5/7 회귀를 기록한다. 실제 iPhone 미검증이며 새 폰트 자산이나 원문 데이터 변경은 없다.


## 10/27 최초 준비와 선착순 신청 보완

첫 Ready 전에도 LIVE5초/GRACE10초를 적용해 두 창의 정상 지연 진입을 도주로 오판할 수 있었다. 초기 ready/index0/start없음은 자료 준비로 분리하며 준비 마감60초 후 materials_unavailable 무효0만 허용한다. 이미 시작한 경기에는 기존 판정을 유지한다. 선착순 매칭은 lobby advisory lock 획득/트랜잭션 접수 순서로 첫 요청의 요청자·수락자를 확정한다. 늦은 교차 요청의200 응답은 최초 초대 상태일 뿐 새 신청 생성이나 자동 수락이 아니다. 기존 사용자의 과거 경기/XP는 수정하지 않았다.


## 10/27 정적 전투 능력치 간격 축소

능력치 데이터만 줄였다. 같은 단계는 대략 10~11타, 한 단계 높은 쪽이 아래를 공격하면 대략 5타로 검사됐다. 이는 피해 공식을 조정하기 위한 목표가 아니라 결과 기록이다. 극단에서는 워그레이몬→깜몬 피해 71로 한 번에 이길 수 있고, 반대는 피해 1로 380타다. 기존 최소 1 피해식을 유지한다. LUK 기본률과 공격 단계 나눗셈, 단계별 XP 보상과 성장 임계는 그대로다. 파닥몬 계열은 기존 단계 매핑을 유지하고 같은 서버 정적 표를 읽는다. 전투 툴팁은 서버 스냅샷을 사용하며 랭킹/마이페이지에 별도의 HP/ATK/DEF 표를 추가하지 않는다. 실제 사용자 기록은 변경하지 않았다.


## 10/27 전투 닉네임과 디지털 격자

현재 전장은 Phaser/canvas 없이 DOM/CSS로 그린다. 이전 배경은 낮은 대비와 짙은 문제 모달에 가려 거의 보이지 않았다. 새 배경은 불투명 검정 바탕에 초록 벽/원근 격자를 직접 둬 일반·공격·결과에서 보이게 한다. 기존 서버 background ID는 바꾸지 않는다. 흐름은 CSS transform 한 레이어로 제한하고 reduced-motion에서는 정지한다. 이름은 textContent로 렌더링하며 이메일 형태는 탐험가로 대체한다. 툴팁은 배경 알파0.62, 전체 opacity1이며 focus/터치/바깥 닫기는 그대로다. API·계정·점수·시간·문제 데이터는 변경하지 않았다. 실제 iPhone은 미검증이다.


## 10/27 한국사 CBT 회차 최초 보상과 XP 바

신규 정책 식별자는 round-first-score-bands-v1. 첫 최종완료를 계정·회차 기준으로 판정하고, 실제 적용 XP와 원래 정책량을 저장한다. 과거 완료는 이미 사용한 회차로 취급하되 기존 결과·원장은 수정하지 않는다. 60점은+3, 기존0하한 유지. 속도감지·보상보류·회수는 추가하지 않았다. 실제 사용자 기록 변경 없이 합성 검증했으며 네이티브 PostgreSQL 동시 부하 및 실기기 iPhone은 미검증이다.


## 10/27 공격 재질과 충돌 환경 반응

불규칙한 불꽃 외곽/고온코어, 기계 패널/분사와 연기, 갈색 균열과 화염 코로나를 코드 기반 층으로 나눴다. 충전 구와 투사체는 같은 전장 기준 크기를 공유한다. 검수에서 발견한 바닥 효과 위치는 실제 대상 발밑 좌표로 보정했다. 기존 피해·회피·서버 시간·보상·3초 충전은 변경하지 않았다. 실제 로컬 Nest·PGlite·SSE+전체 앱 두 브라우저에서 지연 입장과 숨김17초 후 복귀/자동 진행/피해1회/XP쓰기0 회귀 통과. 합성 인증·문제 은행을 사용했으며 운영 사용자 기록 및 물리 iPhone/OS AltTab은 시험하지 않았다.


## 10/27 관리자 총 XP 표시·조정

조정은 과거XP를 고치지 않고 신규 admin-adjustment 원장으로 누적한다. 입력은0제외±1,000,000 정수/사유300자/예상총XP/요청UUID이며, 현재총XP가 달라지면409로새확인을요구한다. 계정잠금·요청잠금으로한번만반영하고 실제delta는0하한까지, 변경전후·관리자·사유·시각을append-only감사표에보존한다. migration046_admin_xp_adjustments.sql은 조정표와기존growth원장nullable참조/검증분기만추가하며역사값·권한/RLS·인증정책은바꾸지않는다. 보류중진화migration046은운영미적용이므로이번번호와같이배포하지않는다. 나중진화재개시새번호로검토해야한다. 실사용자XP조정은하지않았고실물iPhone/네이티브PG병렬부하는미검증이다.


## 10/28 공격 실루엣·유동 재질 정리

새 battle-materials 시각 모듈은 절차적 Canvas2D로 구면 표면·화염·미사일 기체를 그린다. 판정·제한시간·HP·XP는 변경하지 않는다. 30fps 상한, 모바일 해상도 제한, 공유 재질 atlas와 종료 시 dispose를 사용한다.

실제 대조에서 태양의 비행 폭은 약 192.39px로 유지됐고, 화염구의 가로·세로는 같았으며, 기수·핀·분사 연기가 있는 미사일은 상대 방향으로 이동했다. 지면 반응과 단계별 흔들림, HUD 고정을 보존했다. 새 JS의 lint 오류는 0개이며 기존 battle-island.js의 추천 규칙 lint 12개는 변경 전후 동일하다. API 소스는 바꾸지 않았고 빌드·단위 267개 통과/기존 조건부 3개 건너뜀, 기존 SSE·답 제출·종료 검사도 통과했다.

합성 인증·프로필과 실제 로컬 Nest·DB·SSE로 검사했다. 운영 사용자 XP 수정, 실물 iPhone 시험, 홈서버 전환은 하지 않았다. 근접 공격·migration047·수동 진화·관리자 추가 개편은 포함하지 않았다.

## 10/28 세계 아트·입장 연출 로컬 묶음

`192ad57` 이후의 세계 배경/입장 리뉴얼은 로컬에서 구현·검수했으며 개별 원격 push/배포하지 않았다. 목적지별 새 게임 아트와 투명 전경·점진 로딩 포스터, 약5초 cinematic과 건너뛰기/취소, 내부 배경·지명 정리를 포함한다. API/진화/초대/전투/공격 FX와 독립된 FE 묶음이다. 10개 관점의 발견·수정·재검증 및 한계는 progress의 ‘야간 세계 아트·5초 입장 리뉴얼’에 기록했다. 부모의 통합 승인 후 한 번에 최종 배포·운영 자산 검증이 필요하다.

## 10/28 독립 통합 검수 인계

FX·대전/수동 진화 FE·세계 아트를 별도 로컬 체크아웃에 합쳤다. PC 태양 잘림, 320px 초대 모달 넘침, 만료 후 초점과 배경 inert 복구, 변경 자산 캐시 버전을 보완했다. 새/기존 API에 전체 index를 연결한 4조합, 세계 전환 39케이스, 모달 8조합, 기록 7시나리오, 역사섬 재생 전환 12결과를 직접 확인했다. API 단위 280 pass·3 skip 및 실제 독립 연결 PostgreSQL 경합 검사를 통과했다. DB에서는 테이블을 제거하지 않고 중복 점유 검사만 추출했으며 가역 통합 후보를 설계했다.

배포 완료를 의미하지 않는다. 새 API runner offline, 구 FE 탭의 필수 sessionId 호환, 양쪽 오답 약공격/동시 KO 무승부 누락, 역사섬 상단 MyPage 아이콘을 사용자 ‘플레이어’로 볼지 여부와 운영 잔존 원인, 학습/Beta 후속 통합이 남았다. 전달된 요구별 구현 근거·미확인·우선순위는 progress의 전체 요구 추적표에 기록했다. 부모 최종 신호 전 원격 push/배포 없음.

후속 원문 확인 후 양쪽 오답 약공격·동시 KO draw와 구 FE sessionId 호환을 로컬 구현했다. 실제 PG에서 draw 원장2행·XP변동0·동시 재조회·재접속·봇·기록을, 실제 전체 FE+API에서390/1440 두 경우 제출→draw→복기를 확인했다. 원격 배포와 무지개섬052 최종 통합은 아직 별도다. 역사섬 피드백의 의미를 단정하거나 MyPage 단추를 삭제하지 않았다.

## 무지개섬 Beta 로컬 전달

무지개섬 구경 화면은 구 API에서도 열 수 있고, 실제 수령·장착·진화는 일치하는 새 컬렉션 계약을 받은 뒤에만 열린다. 서버 성공을 흉내 내거나 브라우저 XP를 임의로 늘리지 않는다. 구현과 실제 로컬 검수 내역은 progress의 무지개섬 항목에 기록했다. 부모 통합 검수 전 원격 push·배포는 보류했다. API migration052가 미배포인 운영에서 수령 잠김은 의도한 제한이며 기능 완료로 오인시키지 않는다.

## 10/29 통합 재개 결과

무지개섬 최종 패치와 약공격/draw·구탭 호환을 통합해 검수했다. 1차 운영 FE0b10015와 이후 로컬 변경을 분리했고, 새 유년기 약공격 분류를 보완했다. 상세 현재 상태와 남은 항목은 progress의10/29 추적표를 따른다. 새 API 배포는 runner Offline으로 막혀 있으며 이 통합본은 추가 push/배포하지 않았다.

## 10/29 전용 캐릭터·PWA 로컬 전달

FE 통합 기준 `a9565996c5370fd26a611731f366610efab1a4a3` 뒤에 추가하는 후속이다. 48포즈/단계별 전용 기술과 수동 앱 업데이트 안내를 구현했다. 공용 피해/시간·약공격/draw·API052/XP 모델은 유지했다. 변경 소유 범위는 신규 시각/PWA 모듈과 자산/스크립트, `battle-island.js`의6개 시각 연결, index 로딩, Vercel 버전 빌드/응답 헤더, 관련 문서다.

검수 결과는 progress의42전투·6PWA·6전체 앱 및 회귀 기록을 따른다. WebKit 픽셀을 직접 확인했으나 Safari 앱 UI 연결은 시간 초과로 불확실했고 실물 iPhone은 검증하지 않았다. 특히 이전 설치 앱에 새 코드가 처음 도달하는 경로는 이 패치만으로 성공을 보장하지 않는다. 새 안내가 로드된 이후의 시작/복귀 비교와 사용자 수동 적용을 검수한 것이다. 로그인/사이트 데이터 삭제, 강제 새로고침, 운영 쓰기는 하지 않았다.

부모 최종 통합 전 로컬 commit/patch/bundle만 전달한다. 새 API가 미배포인 운영에서 알 수령·장착 제한은 유지된다. Windows runner Offline으로 API 배포는 별도 차단 상태이며 Render 재개나 Windows 설정 변경을 시도하지 않았다.


## 10/29 전용 포즈/PWA 독립 통합 결과

1f64e39를 a956599 위에 통합했다. 초기 요청을 놓치는 업데이트 알림 순서, 지연 atlas의 충전 자세 복구, WebKit의 깨진 대기 초상화, 구 API에서 신규 약공격 규칙을 설명하던 문구를 재현·보완했다. 세부 재현/검증과 요구별 남은 일은 progress의 독립 통합 표를 따른다. MyPage·출석·관리자 그래프의 요청 범위에서 추가 코드 누락은 발견하지 않았다. 역사섬 플레이어의 실제 지칭 대상은 여전히 미확인이다.

새 API와 실물 iPhone/Safari의 최초 PWA 갱신은 완료로 표시하지 않는다. 서버 배포는 별도 안전 준비 이후에 조율하고, FE도 학습 담당 전달물을 합친 큰 묶음 배포 전까지 로컬에 보존한다. 이번 검수에서 원격 push·배포·운영 사용자/DB 변경은 하지 않았다.


## 10/29 휠·기록 배경 후속 전달

고정 기기 본문 밖(상단/테두리/주변 그림)의 휠이 멈추는 문제를 Chrome·WebKit에서 재현하고 미소비 세로 입력만 본문으로 전달하도록 수정했다. 모달과 입장 연출의 배경 잠금, 중첩 스크롤, 키보드 보호는 유지한다. MyPage 흰 기록 첨부는 이전 CSS로 재현됐고, 현재 공개 CSS는 새 녹색 팔레트와 일치했다. 남은 흰색 선언을 정리하고 스타일 URL을 갱신했다. 사용자 탭의 구버전 유지 여부는 추정으로 구분한다.

코드는 `device-shell.js`, 기록 부분 `account-ui.css`, 두 HTML의 자산 버전 참조 및 회귀 테스트/문서만 변경했다. 인증·PWA·API·DB 변경은 없고 개별 push/배포하지 않았다. 최종 통합 담당이 로그인/무지개 수정과 합쳐 배포할 수 있는 독립 로컬 커밋이다. 실물 iOS touch swipe는 미검증이며 상세 검수와 기준본의 기존 실패는 progress에 기록했다.


## 10/29 랭킹 행 후속

중복된 ‘나의 발자취’ 요약을 제거했다. 탐험가 목록의 금·은·동 행은 배경 재질과 메달로 구분하고, 본인 행은 별도 테두리/배지로 표시한다. 모바일의 이름/캐릭터/XP 간격과 줄바꿈을 정리했다. 단 한 번의 은은한 반사광과 reduced-motion을 지원하며 순위·XP·API는 변경하지 않았다.

앞선 `f7ba51f`를 포함한 로컬 커밋/패치를 전달하며 원격 push·배포는 통합 담당의 큰 묶음에 맡긴다. QA는 합성 사용자만 사용한 Chromium/WebKit 3폭의 60사례와 기존 순위/캐릭터/휠 검증이다. 실제 화면은 작업폴더 evidence/hall-rows에 보존한다.

## 10/29 게임 UI 묶음

무지개섬은 카드 목록이 아닌 한 장면의 게임 공간이 되었고 알을 장면 안에서 고른다. 실제 수령·장착은 서버 컬렉션 API 배포 전까지 잠긴다. 역사숲·영어섬은 지도 안 정박지로 학습 목적지를 고르고, 얼음섬 정상 연결 문구는 제목 옆 상태등으로 바뀌었다. 로그인 유지 선택 잠금, 휠 스크롤·기록 배경, 랭킹 금·은·동 행을 함께 묶었다. 순위·정답·XP·데미지·전투 시간·API 계약은 바꾸지 않았다.

다음 업무: 새 컬렉션 API 배포 후 실제 수령·장착 운영 검증, 역사섬 플레이어 대상 사용자 확인, 실물 iPhone/Safari 검수, 기존 실패 테스트(사설 자료 의존·Part7 group membership) 정리.

## 10/29 기차 선로·단어장

무지개섬 기차가 배경의 실제 선로를 따라 기관차·객차별로 돈다. 단어장은 인쇄용 단어장처럼 단어·뜻·예문의 위계를 분명히 하고 한글 본문을 읽기 쉬운 글꼴로 바꿨으며, 상단을 필터 토글·개수 배지·눈 아이콘으로 정리했다. 순위·정답·XP·전투·API·체크 저장 방식은 바꾸지 않았다.

다음 업무: 실물 iPhone/Safari 확인, 오래된 단어장 브라우저 QA 픽스처 정리, 휴대폰 가로 화면에서 기기 화면 높이가 작은 기존 배치 개선 검토.

## 10/29 사이트 전체 대전 초대

어느 화면에서든 대전 신청을 받고, 얼음섬 목록이 HanQ 접속자 전체와 상태를 보이도록 FE·API를 준비했다. FE는 서버 지원을 확인한 때만 켜지므로 현재 운영에서는 보이는 변화가 없다. API는 집 Windows runner offline으로 배포하지 못했고, 배포 후 운영에서 두 계정 검수가 남았다. 백그라운드 탭은 브라우저 타이머 제한으로 오래 숨겨지면 접속 목록에서 빠질 수 있고, 복귀 시 다시 나타나며 서버 상태를 다시 읽는다.

## 2026-10-30 · 아구몬 투명 아이콘

기존 승인된 agumon-idle-sprite.png 첫 얼굴을 참조해 built-in imagegen으로 아구몬 얼굴 원본을 생성했다. 초록 배경이 들어간 코로몬 아이콘을 대체하는 버전별 16/32/180/192/512 PNG, favicon.ico, root apple-touch-icon을 연결했다. 기존 코로몬 원본은 보존했다. main/문의 페이지 favicon·apple-touch 링크와 manifest를 같은 아구몬으로 통일하고 manifest/root fallback의 must-revalidate header를 추가했다. Service Worker는 없으며 학습·인증 localStorage와 IndexedDB를 지우지 않는다.

Chrome/WebKit에서 실제 PNG 크기·투명 모서리·alpha 비율·앱 크기 흰 치아 보존, ICO payload, 두 페이지 링크·manifest·캐시 설정을 검사했다. 흰/어두운/체크무늬 바탕 16/32/64/180/192 화면을 직접 검수했다. 프롬프트·도구·원본·출처는 agumon-icons-20261030.json에 기록했다. 이 작업은 로컬 검수이며 실물 휴대폰 설치 검증이 아니다.

[Chrome 공식 지침](https://web.dev/articles/maskable-icon)은 maskable에 불투명 배경과 safe zone을 요구한다. 사용자가 요청한 투명 원본을 유지하며 purpose:any만 제공하고 투명 파일을 maskable이라고 표시하지 않는다. Android가 설치 아이콘에 자체 흰 배경을 추가할 수 있다. [WebKit15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/)의 iOS apple-touch 우선순위와 [Apple Web Clip 규칙](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)을 확인했다. [WebKit17.2](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)도 macOS의 시스템 배경/간격 추가를 명시한다. 따라서 PNG alpha가 실물 iOS/Android 홈 화면 전체의 투명도를 보장한다고 보고하지 않는다.

## 2026-10-30 · 세 단계 검토·최종 통합

1차는 실제 API/격리 PostgreSQL의 구매·장착 원자성, 0Coin 검증, 기존 XP/원장 보존·계정합계, 60초 전후 경계와 오프라인 복구를 검토했다. 2차는 두 상점 장면·곰/기차·보관함·캐릭터·투명 아구몬 아이콘 및 모바일/키보드/축소 모션 검토다. 3차는 수정 후 실제 외부 CSS·실제 Nest/PostgreSQL 화면과 최종 소스 회귀를 다시 검토했다. 같은 검사에 이름만 붙여 세 번으로 세지 않는다. 상세 근거는 작업폴더 evidence/three-review-passes.json에 구분했다.

최종 실제 API 검사는 Chrome/WebKit320/390/1440 여섯 조합의 응답 유실 재시도·서버 시각·실제60초·새로고침/오프라인/계정 전환을 통과했다. 두 계열의 UI 구매·장착·부화 후5단계 진화, 성장기/최종 단계 네 번의 실제 연습 문제 제출·전투도 확인했다. 양쪽 모션 background URL200 및 새 파닥몬 전투 자산 사용을 검사하고, 상대가 실제 보이는 픽셀과 보라색 귀날개·진화 단계별 체형을 직접 확인했다. 합성 인증 어댑터/범위 밖 빈 패널은 운영 인증·학습 데이터 검증과 구분한다.

API 최종 후보af24744faf4474520425f8fc63e4568c2b931e9f의 Actions41000373858은 typecheck·unit278pass/3skip·build·lint와 실제 image 제작이 모두 성공했다. 전체 로컬 API 단위는289pass/3skip/실패0이다. 기존 통합66개 중60pass/6baseline fail은 그대로 보고한다. FE 최종 통합 커밋은 이 검수 이후 후보 branch에 올리고 정확한 SHA의 CI/Preview를 확인하며, production 배포로 확대하지 않는다.

현재 Windows의 installed deploy.cmd는48개 동등 schema image-only 계약이며 새54개 schema 릴리스를 처리할 adapter/bootstrap·승인 manifest 설치가 필요하다. 이미지 제작 경로는 준비됐지만 실제 Windows 계약/UID·readonly mount 호환성과 관리자 설치를 우회하지 않는다. 운영 API·DB·FE는 아직 이 후보로 바꾸지 않았다. 내부 QA 이미지는 로컬에만 보관했으며 새 Library 업로드는 없다.

## 2026-10-30 · 프론트 단독 운영 반영 범위

이번 릴리스는 두 상점 장면·곰 순찰/기차·기존 계약 기반 캐릭터 모션·아구몬 투명 아이콘 및 My Page의 보관함/옷장 준비 중 안내다. API client는 f418f96 운영본과 동일하며 API/DB/보안 설정을 변경하지 않았다. 새 구매·부화·장착·개별 XP는 활성화하지 않는다. 전체 기능 후보는 FE a111e8d 및 API987be57 후보 branch에 보존돼 집에서 Windows 경로 검증·설치 후 별도로 배포한다.

정확한 SHA의 CI 및 Vercel Production 성공과 hanq.vercel.app app-version을 마지막 단계에서 확인한다. 인증된 운영 테스트 계정이 없어 실사용자 계정으로 로그인·출석·구매하지 않는다. 현재 로컬 검사와 실제 공개 운영 스모크를 구분한다. 기존 test-mypage의4 baseline 실패와 실제 휴대폰 설치 미검증은 유지하며 현재 UI의 성장기록/기록 소유권/출석·XP는 별도 최신 회귀와 두 엔진에서 검사했다.

## 2026-10-30 · 보관함 디자인과 검수된 장면 부분 배포

사용자 정정에 따라 이미지 전달 대신 운영 My Page에 실제 카드 디자인을 제공한다. 현재 표시되는 파트너만 기존 계정 정보로 보여 주며 추가 두 자리는 준비 중인 빈 슬롯이다. 점수는 계정 XP로 명시하고 새로운 소유·개별 XP·장착 결과를 만들지 않는다. 새 동작 단추는 비활성이고 강제클릭에도 새API 호출이 없다. 기존 파트너 영역의 보관함 링크가 실제 디자인으로 이동한다.

함께 반영하는 장면은 행복의 마을 명칭, 회전/반전 없는 기차 역정차·짧은 왕복과 곰 가림 방지다. 새 참고 다섯 장은 다운로드 실패로 아직 실제 픽셀을 확인하지 못했다. 왼쪽 놀이동산/오른쪽 큰 나무 둥지/아기 디지몬 새 구도까지 완성했다고 보고하지 않는다.

API/DB/auth/CORS는 변경하지 않는다. 전체 기능 FEa111e8d/API987be57 후보는 보존한다. 캡처 업로드 요청은 실행 전에 취소됐으며 새 Library 업로드0이다. 실제 운영 로그인/계정 쓰기/휴대폰 설치 검증은 하지 않았다. 정확한배포 SHA·CI·Vercel·공개도메인 GET 스모크는 최종 작업 결과와 로컬 evidence/inventory-operating-release에 기록한다.

## 2026-10-30 · 최종 구현 상태 정정

이전 참고 전송 차단/새 구도 미완료 기록 이후 사용자가 study-app에 로컬 이미지를 제공했다. 다섯 장 모두 직접 확인했고, 이제 왼쪽 놀이동산·오른쪽 큰 나무/알·중앙 아기 NPC3마리의 새 구도까지 구현했다. 원본을 배경으로 붙이지 않고 자체 게임 스타일의 새 배경2종을 만들었다. 곰·알·기차·아기는 실제 별도 레이어다.

이번 운영 대상은 이 시각 구성과 준비 중인 실제 My Page 보관함 카드다. 새 알 구매/서버60초부화/개별XP저장/장착은 여전히 운영 미개방이며 API/DB/auth/CORS는 변경하지 않는다. 최종3차 검토와 해당SHA의 CI·Production·공개도메인 스모크 근거는 작업폴더 evidence/happiness-final-release에 남긴다. 실사용자 계정으로 운영 쓰기 QA하지 않는다. 새 Library 업로드0, 내부 스크린샷은 로컬 검수용이다.

## 2026-10-30 · My Page/마을 후속 릴리스 범위

보관함 안내 아이콘, 오른쪽 옷장 슬라이드와 뒤로/초점 복귀, 보관함 위 출석 카드, 간결한 기록 건수/가운데 페이지 이동, 작은 관리자 전용 하단 링크를 제공한다. 달력·중복 링크·수동 새로고침·상시 동기화 설명은 화면에서만 제거했다. 자동동기화와 실패 안내·기록 소유권·실제 보상·10자 비밀번호 검증은 유지한다.

기존 행복의 마을 그림은 유지하고 잎/풀 바람, 큰 나무의 느린 빛/입자, 알가게 곰의 넓어진 실제 동선, 상점별 말풍선, 두 아기의 공 주고받기를 추가한다. 세 차례 검토는 코드/계약 보존, 두 엔진6화면의 전체64초 모션·My Page 및27역할 화면, 최종 단위/회귀·정확한 CI/Production 검증으로 구분한다. 배포 식별과 공개 서빙 파일 비교는 최종 결과에 기록한다.

API/DB는 이번에도 변경하지 않으며 알 구매·60초 부화·신규 장착·개별 XP는 운영 준비 중이다. 전체 기능 후보 FEa111e8d/API987be57은 보존돼 있다. 운영 인증 테스트 계정이 없어 실제 사용자 로그인/출석/비밀번호/구매 쓰기를 하지 않는다. 실물 iPhone 설치 아이콘은 미검증이다. 캡처는 로컬 검수용이며 새 Library 업로드0이다.

## 행복의 마을 전진 동선 후속

추가 상점 판을 제거하고 아기 캐릭터를 다섯으로 늘렸다. 곰 발걸음과 기차를 전진/정지/페이드 아웃/재등장 방식으로 바꾸어 화면에서 후진하거나 돌아가는 동작이 보이지 않도록 했다. 화면에 보이지 않는 동안 출발점으로 복귀한다. 알 구매 등 서버 의존 기능은 이전처럼 준비 중이다. 배포 및 실제 운영 SHA는 실행 결과에서 별도로 확인한다.

## 재연결 · 새 API 연결 프론트 후보

서버 계약이 확인된 계정에는0Coin 알 구매·개별 XP/보관함·장착·자동 부화 결과를 연결한다. 기존 미지원 응답은 실패를 숨기지 않고 재확인 안내로 처리한다. 구매 확정은 confirmed receipt 후에만 표시하고 같은 계열은 보유 중으로 표시한다. 전체 기능 후보의 시각 장면으로 덮어쓰지 않고 최신 행복의 마을 동선과 그림을 유지했다.

함께 반영하는 화면은 판매점 hover/focus/active 투명 배경, 팝업 복귀 시 장면 재생성 방지, 퍼펫몬 명칭, My Page 제목 배경·계정/개별XP 분리·옷장 슬라이드, 명예의 전당/얼음섬 전용 장면 배경이다. 검수는 계약/데이터 보존, 실제 브라우저 상호작용과 모션, 최종 회귀/CI·배포의 세 그룹으로 구분한다. 정확한 SHA·CI·Production·공개 파일 근거는 최종 실행 결과에 남긴다. 운영 테스트 계정이 없어 실제 사용자 구매/장착/출석은 실행하지 않았고 Mac의 API 읽기 요청 시간 초과 한계를 남긴다.


## 2026-11-03 · 섬 장면·통합 프로필·Growth UI 검토 후보

상태: **구현/로컬 검수 완료, 검토 브랜치 push 대상, 운영 미반영**. 사용자의 자연스러운 장면 움직임·날씨·사진과 정보 통합 요청을 FE에서 처리했다. 규칙 `hanq-collaboration-2026-11-01-v5`. 운영 main 이동과 배포는 통합 담당의 기존 CI/CD 순서로 조율한다.

- 작업: `/Users/handonglee/Documents/Codex/2026-11-03/task/fe-scene`, branch `codex/island-scene-review-20261103`.
- 원격 기준: `061de840b05eeea34cee19d21fce4988d915e7a8`. 최초 원격 조회·fetch로 확인했으며 기존 checkout은 수정하지 않았다.
- 섬 장면 `222ee7a`, 통합 MyPage `bf49fd5a03864a4011943614d3f53634ada460a9`, 느린 원화 위치 고정 `6889171`, 문의/외곽 `e9c4a79`, Growth 호환 통합 `593719ad7d19e75711a243d87714b2d23b089875`, 문의 대비 `e3aeaa2eb87790e0d22326925ca615813783fad9`로 경계를 나눴다. 문서 후속 커밋과 최종 CI SHA는 최종 인계 증거에서 별도로 확인한다.
- 소유: `island-harbors.js/.css`, `world-scene.js`, `account-ui.js/.css`, `characters.js`의 성장 XP 위치, `hall-of-fame.js/.css`, `my-records.js`, FE `api-client.js`의 공개 프로필 GET 어댑터, `admin-xp.js`, `admin-dashboard.css`, `portal-ui.js`, 문의 HTML의 장면 include와 관련 검사.
- 제외: 영어 Practice/LC/audio/player 제품, dependencies·lockfile, API/DB·migration·권한·infra, 전체지도 원화·click masks, 실제 계정 데이터. 기존 header 측정 알고리즘/router/XP 계산을 유지했다. 후속 account 수정은 기존 Back 콜백의 최소 위임과 account 전용 여백/중복 표시 범위다.

### 1. 요구·화면 구조 검토

영어섬/역사숲 원화는 고정한다. 독립 구름·수면 파문·안개·빛·숲의 잎과 150초의 맑음→구름→약한 비→개는 흐름을 CSS로 합성한다. 원화 전체의 포인터 이동을 제거했고 메뉴 hit 영역은 애니메이션하지 않는다. 원화 decode 전부터 실제 자산 크기(모바일 900×1200, desktop 영어 1671×941/역사 1672×941)를 사용해 메뉴를 배치한다. 320px 가장자리에서도 전체 터치 영역을 내부로 제한한다.

MyPage는 별도 풍경 배너와 큰 세로 사진을 없애고 실제 장착 파트너·닉네임·성장 XP·진화 진행을 같은 정원 카드 안에 배치한다. 기존 DOM IDs/진화 단추/출석/보관함/계정 설정/기록과 실제 파트너 idle을 유지한다. Hall 공개 프로필은 보유 파트너 그림과 XP를 같은 행에 표시하며 같은 종류의 알도 소유 개체 수만큼 표시한다. 문의는 풍경 안에 제목과 작성 폼을 결합한다.

| 사진/배경 host · 실제 source | 결정·사유 |
|---|---|
| `.island-harbors .harbor-chart` · `island-harbors.js/.css` | 원화 그대로 + 주제별 독립 장면 레이어, 가독성 있는 고정 목적지 표지 |
| `.ac-hero` · `account-ui.js/.css`, `world-scene.js` | 풍경·실제 파트너·정보 통합, detached account banner 제거 |
| `#hallHost`, `#battleHost` · `world-cinematic.css`, `world-scene.js` | 기존 통합 그림을 보존하고 pointer-free 장면 추가; 대전 판정/타이머에는 관여하지 않음 |
| 문의 `.device-content` · `inquiries/index.html`, `world-scene.js` | 별도 postcard 제거, 입력/검색/목록과 배경을 한 책상으로 통합 |
| `body::before` · `game-world.css`, `world-immersion.css`, `world-cinematic.css` | 원화 고정, visible desktop 외곽의 구름/조명만 공유 레이어로 변화. 1180px 이하 외곽 레이어 display:none과 offscreen pause |
| 로그인·역사 hero·전환 `.world-scenery` · `world-scene.js` | 원화 보존, 공유 atmosphere 적용. 종료/비가시 수명은 기존 WorldScene 상태와 intersection을 사용 |
| 학습 내부 `.world-island-banner` · `device-shell.css` | 기존 hidden 규칙 보존. 읽기 화면에 새 사진 배너를 추가하지 않음 |
| 전체지도 · `world-map.js/.css` | 원화·mask·기존 배회 애니메이션 보존 |
| 행복의 마을·캐릭터 sprite/atlas·battle effect | 기존 자연스러운 idle/scene 수명·원본 등록 좌표 보존 |
| `.ha-player` · `audio-player-ui.css` | 동시 Practice/player 담당 소유 경계. 파일 수정 없음; 후속 미확인 항목으로 남김 |
| 교재/문항/해설/출처의 그림 | 의미 자료 보존, 장식 모션 적용 안 함 |

CSS raster reference의 전수 파일/행/자산 목록은 작업 evidence의 `background-inventory.json`, 화면·소유 경계는 `checkpoint.json`에 있다.

### 2. 원문·시대·답안/source revision 검토 경계

FE가 먼저 찾은 기존 후보 PDF는 144쪽·35,449,421바이트, SHA-256 `35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442`로 기존 semantic manifest의 원본과 일치했다. 메타데이터는 79회 대비 최종 v2(2026-06-23)이다. PDF 8–10쪽을 실제 렌더/텍스트로 확인하고 기존 선사시대 학습·빈칸 36문항의 오프라인 baseline을 확보했다. 새 판본이라고 표시하거나 답안을 임의 갱신하지 않았다. 이후 별도 역사 담당이 확인한 새147쪽 자료는 별도 revision의 작업 범위이며 이 FE에서 원문을 다시 검증하거나 현재 경로로 활성화하지 않았다.

**한국사 source-data·문항·revision·독서 renderer/CSS 수정 없음.** 별도 역사 담당 `01a19cd8-488d-7211-aeed-c9f2aade2012`에 데이터 소유를 인계하고 FE는 해당 파일을 더 수정하지 않는다. 이 FE 검수가 전체 144쪽 또는 모든 답안의 대조 완료를 뜻하지 않는다. 기존 기록/점수/XP를 삭제·초기화하지 않았다.

### 3. 학습·기록·XP/Hall 계약 검토

Growth UI의 이전 `ca0113` worktree는 account CSS를 제외한 제품 7개 파일의 원본이 현재 기준과 같음을 확인한 뒤 해당 패치만 선별했다. account CSS는 활동 children layout 부분만 추가해 새 sanctuary 구조를 보존했다.

- Hall: JWT GET/실제 32자리 `profileRef`가 있을 때만 프로필 API 요청. old987의 ref 없는 행은 새 endpoint를 요청하지 않는다. public DTO를 투영하며 email/소유 UUID/개인 답안은 표시하지 않는다. lastSigninAt/null, 개체별 XP와 합계, 최근 공개 활동 최대 3개를 검증한다. 같은 `digitama` 2개를 dedupe하지 않는다.
- MyRecords: 실제 shape 기준 새 `pageSize:10` 활동/children와 old987의 pageSize/children 없는 20행 fallback을 유지한다. total/snapshot/KST/필터/문제·해설 및 modal Back/Forward/초점/펼침 상태를 보존한다.
- 관리자: selected-partner workflow는 검토된 기존 패치를 보존하되 **배포 readiness 기본 비활성**이다. 현재 `/ops` HTML에는 `hanq-partner-xp-api=056-reviewed` meta가 없으므로 개체 endpoint probe나 선택 XP UI를 만들지 않는다. API capability 필드를 가정한 것이 아니며, schema056/BE 배포 검증 뒤 통합 담당이 별도 릴리스로 켜야 한다. 현재 운영987에 상시404 probe를 하지 않는다. 기존 계정 XP 기능은 보존한다.
- CAS/동일 requestId/명시 확인/음수 방지 흐름은 합성 API로 검사했다. 저장 ack 후 refresh 실패는 저장됨/조회 실패로 분리하고 GET 재시도만 제공한다. 실제 운영 XP 쓰기는 하지 않았다.

### 4. 모바일·접근성·모션·회귀 검토

- `qa-island-scene.cjs`: Chromium/WebKit ×320/355/390/1440, normal/reduced-motion, 고정 원화·표지 hit·키보드/focus·각 메뉴 이동·Back/Forward·성장 dialog Escape/초점 복귀·긴 닉네임·재진입·offscreen/global pause **28개 통과**.
- `qa-scene-assets.cjs`: 두 엔진/두 섬, 지연 이미지 decode 전후 버튼 좌표 동일/취소 focus **4개 통과**. 각 2초 headless desktop 표본 121프레임·long task 0; 실제 휴대폰 성능 보장은 아니다.
- `qa-inquiry-scene.cjs`: 두 엔진 ×4폭, 문의 폼 16px 입력/overflow/통합 배경·synthetic 입력 유지 **8개 통과**, 전송0.
- `qa-growth-shell.cjs`: 최신 전체 앱에서 두 엔진 ×4폭, 공개 profile·동일 종류 알2개·활동 children·modal Back/Forward/초점 **8개 통과**.
- `qa-integrated-account-edges.cjs` **6개**, `qa-mypage-activities.cjs` **36개**, `qa-hall-public-profile.cjs` **6개 통과**. 모두 synthetic/local이다.
- 기존 header readability/parent navigation/global navigation/map shell/map header/header refinement/UI lock/final review/baby blink/poyomon seam browser 검사 통과. 글자를 줄이거나 XP를 숨기지 않았다.
- 기존 auth/profile/remember-session/characters/account/mypage/collection/XP/header/UI lock/기록·전투수명·문법·단어·디바이스 관련 소스 검사와 새 Growth 단위 검사 통과. 기존 `test-device-scroll`은 exit0/21 assertions 통과하나 JSDOM의 `requestAnimationFrame` 없는 fixture 경고를 출력한다. 해당 hardware 코드는 수정하지 않았다.
- 정적 build는 clean 제품 커밋에서 1,632 runtime 파일의 반복 manifest/full SHA/공개·비공개 경계를 통과했다. 원문 PDF와 개인 자료는 public tree나 공유 ZIP에 넣지 않았다.

PNG만으로 모션 완료를 주장하지 않는다. `motion-0/2`는 실제 2초 간격, weather PNG는 150초 CSS 타임라인의 0/65/90/138초를 Web Animations로 샘플링한 정지 프레임이다. 코드·computed animation·offscreen pause를 별도로 검사했다. 실제 iPhone/Safari·운영 서버 실연결은 미검증이다.

### 5. 최종 SHA CI·배포 검토 경계

첫 후보 `bf49fd5a03864a4011943614d3f53634ada460a9`는 검토 브랜치 push와 원격 SHA를 확인했다. 첫 검수 ZIP은 Library `libfile_543c62a2d3048191869bd08df5e106fe` v0, 21,774,119바이트, SHA-256 `f702139d68fcd55215e81416a59a5df7ac5a4c68933beca33ed1079460737563`이다. 합성 baseline/후보390·desktop과 장면 시퀀스·목록·결과만 포함한다.

최종 정확 SHA의 필수 CI는 push 후 결과를 별도 인계한다. 운영 main·Vercel·홈서버 배포·DB056은 이 작업에서 이동/실행하지 않았다. 운영 반영은 루트의 실제 픽셀 검수와 기존 CI/CD 순서 조율 뒤 수행하며, BE 확정 SHA·schema056 검증 없이는 선택 개체 XP readiness를 켜지 않는다. 남은 source-data 대조·빈칸 갱신은 별도 역사 작업, 실BE 연결은 Growth/통합 담당의 범위다.


기존 `qa-island-harbors.cjs` 추가 검토: 기준061의 320px 버튼 잘림은 새 위치 clamp로 해결했다. 기존 wheel fixture의 900px spacer는 flex-shrink로373px가 되어 scrollHeight=clientHeight=645였으며, 실제 crop 원화 좌표는 화면 밖을 가리킬 수 있었다. fixture의 shrink를 막고 실제 지도 viewport 안에서 wheel을 보내도록 바로잡았다. 현재 제품 라벨 Vocabulary/Practice/Grammar/Listening을 정확히 검사하도록 갱신하며 기존 hit/중첩/keyboard/route/scroll assertions는 보존했다. 제품 코드는 이 검사 정정으로 바꾸지 않았다.


2026-11-03 test-only 후속: `qa-island-harbors.cjs`는 현재 `.github/workflows/ci.yml`의 필수 job에서 호출하지 않는 수동 섬 회귀다. 그래도 장면 릴리스의 관련 검사를 유효하게 유지하기 위해 라벨/scroll fixture를 정정하고 실제 overflow와 화면 내 wheel 좌표 assertion을 추가했다. 기존 target/keyboard/route/wheel assertion을 삭제·완화하지 않았다. 검사/PDF 설명 정정 자체는 runtime을 바꾸지 않는다. 이후 루트의 실제 PNG 검수로 추가 승인된 account 수정은 아래에 별도로 기록한다. 새147쪽의 실제 SHA/안전 메타데이터는 별도 역사 담당의 인계 문서로 확인했고 원문 재처리나 해당 worktree 쓰기는 하지 않았다.


### 루트 픽셀 검수 후 account 최소 수정 · 2026-11-03

- 같은390px에서 섬 header는380px/60px, account는374px/108px였다. account shell의 좌우 여백11px와 섬8px의6px 차이가 동일한131px 프로필을 두 번째 행으로 밀었다. account host `#acRoot`가 있는700px 이하 화면의 가용 폭만 맞췄다. 헤더 측정 JS/글자 크기/XP/실제44px 타깃/중앙 브랜드는 유지한다. 필요한 좁은 폭·긴 이름·큰XP의 두 줄은 허용한다.
- `index.html`의 account 진입에서 기존 `bindHeaderParent`를 재사용해 `#acBack`의 원래 callback을 헤더에 위임했다. 직접 진입 fallback 또는 원래 진입지가 역사숲임을 확인한 경우에만 같은 `#acHome`을 alias로 표시하고 빈 행을 숨긴다. 기존 history.state에 목적지 동일성 boolean만 보존해 Forward 복원에서도 판정이 바뀌지 않게 하며 이동 자체는 기존 callback이 맡는다. 이전 학습 화면 복귀와 역사숲 이동이 다르면 후자를 보존하고 실제 목적지를 표시한다. 일반 라우터/다른 모듈의 parent 소유권은 바꾸지 않는다.
- `qa-account-header-parent.cjs`: Chromium/WebKit ×320/355/390/1440. 정상/긴닉네임·큰XP/글자·hit 검수, 직접root/main alias/toeic-records, Back/Forward와 snapshot, 별도 역사숲 목적지, disabled·성장 modal·초점, 합성 password 저장 대기 중 native 이탈과 늦은ack, 공통 저장 이탈 취소/대기/승인 후 기존callback1회 검증. 모든 API는 fixture이며 운영 쓰기는0이다.
- 기존 필수 `qa-header-parent-navigation.cjs`의 성공 경로가 새 account 회귀를 별도 child process로 실행하고 실패를 전파한다. workflow/인프라 파일은 수정하지 않고 기존 header-parent CI에 account 검증을 포함한다. 기존 header readability/parent, 섬, Growth shell 관련 회귀를 같은 최종 후보로 다시 실행한다. 새 정확 SHA의 필수 CI와 루트의 실제 PNG/실API 검수 뒤에만 main FF·운영 반영을 조율한다. 새147 dataset 완성은 이번 장면·프로필·문의 릴리스의 선행조건으로 묶지 않는다.
- `media/api-client.js` blob `c773725643ff129155a2954f05e5a6e06a78c0cc`, `media/admin-xp.js` blob `632e9728655910fe0d70e80a8d2d38b9a44427f6`은 잠금7d81724와 동일하다. selected XP 기본 비활성/개체probe0과 합성old987 검증 한계를 유지한다.

### 자연 시간 날씨 추가 검수

시간 이동·재생속도 변경 없이 영어/역사섬에서 각각 약150.13초의 한 주기를 실행했다. 0/55/65/75/78/81/90/120/138/150초에서 실제 UTC/경과 시간/opacity/animationTime/고정 메뉴 좌표를 읽고 PNG를 저장했다. 55초에는 구름opacity 약0.629·비0,90초에는 구름0.7·비0.44,138초에는 비0·일광 약0.681로 점진 변화했다. reduced-motion의350ms 간격 PNG는 byte-identical이었다. 테스트용 host를 viewport 밖으로 옮긴 실제 intersection에서 CSS 시계가500ms 동안 동일했고 복귀 후 이어졌다. 제품 원화나 메뉴를 움직이는 애니메이션을 추가한 것이 아니다. 별도 `natural-weather-cycle/result.json` 및 자연 시간 PNG는 앞선 Web Animations 시간 이동 검수와 구분한다.

최종 장면 후보의 사용자 버전은 루트가 승인한 `0.2.10-beta`다. RELEASE_VERSION·CHANGELOG·README를 함께 갱신하며, source HTML의 development marker는 유지하고 정식 static build가 정확 커밋 SHA·release meta·JS/CSS build query를 생성한다. review branch push와 운영 배포는 별개이며 main FF 및 실제 도메인 확인은 루트 검수/실 API 조율 뒤에 진행한다.

필수 compact CI에서 기존 `qa-ui-final-review.cjs`의 계정 직접 진입 기대(전체 지도→subjects)가 이번 승인된 native Back 위임(뒤로→history)과 충돌했다. 제품 코드를 다시 바꾸지 않고 해당 account 계약을 갱신하며 native callback 위임·같은 버튼 숨김·실제 목적지·Back/Forward 복원을 추가 검증한다. 다른 route/hit/XP/그룹/원화 assertions는 그대로 보존한다. 최초 e165fc2 CI의 compact 실패와 브라우저 설치 지연 뒤 Practice15분 취소는 근거에 남기고 새 test-only 정확 SHA의 전체 필수 CI로 다시 확인한다. 보호 계약의 잘못된69 요약은 원래28파일행+3tree(63leaf), ci-tools중복2를 제외한89개 경로(87불변·승인예외 index/RELEASE_VERSION2개)의 전수 목록으로 정정했다.

### 2026-11-03 물·배 장면 보정 후보

규칙 `hanq-collaboration-2026-11-01-v5`. Chrome 1440×1000, 390×844, 320×740, 844×390의 두 섬과 저사양 합성 환경에서 물 frame/배 transform 변화, reduced-motion 정지·복귀, offscreen 정지를 실제 렌더링으로 검증했다(9건). 기존 `qa-island-harbors.cjs`는 Chrome/WebKit 28건 통과: 버튼/keyboard/route-back/스크롤/레이아웃 보존. 실제 모바일 기기 성능은 미확인이다. `qa-living-water.cjs`와 작업 evidence의 시간차 PNG/GIF/WebM·pixel-motion.json이 내부 움직임 근거다. 원화·경로·ID·학습 저장 계약을 보존했다. 정확 SHA CI·부모 통합·운영 버전/SHA/자산 검수는 별도다. 운영 브랜치를 독자 통합하거나 배포하지 않았다.

### 2026-11-03 장면 정지 재현과 건물 핫스팟 후보

재현 전: 1440→390 전환 후 frame 9→9, ready=false지만 mode=active가 유지됐다. 이전 canvas의 이벤트 리스너를 제거하고 generation/target을 검사해 새 장면의 중단을 방지한다. GPU 중단·미지원 대체 경로는 실제 물 픽셀 변화와 고정 건물 픽셀을 검사하며, 단순 frame 카운터 증가만 성공 기준으로 쓰지 않는다. `qa-palace-hotspots.cjs`는 실제 로컬 HTTP 캐시, 반복 resize, 1778×1122 DPR2 조건, GPU 중단/미지원, reduced-motion 명시적 재생, 건물 중앙 터치·키보드·모듈 로드 실패 복구를 검증한다. 실사용자 브라우저 설정은 미확인이다. 기존 `qa-island-harbors.cjs`의 route/back/keyboard/스크롤·모바일 검수와 `qa-living-water.cjs`의 실제 시간 진행·픽셀 캡처도 별도 유지한다. 정확 SHA CI·운영 증거는 해당 실행 결과로 대조하며 이 후보 기록만으로 배포 완료를 선언하지 않는다.

중간 후보 05d2ecba의 CI 41590207383은 새 움직임 버튼이 `.toeic-travel-map button`의 학습 목적지 4개에 섞여 단어장 UI 회귀에서 실패했다. 제품의 장면 제어를 map 바깥의 형제 요소로 분리하고 기존 검사 파일은 완화하지 않았다. ResizeObserver 위치 갱신은 rAF로 묶고 버튼은 max-content 폭으로 고정해 순환 알림을 제거했다. 그 후 qa-vocabulary-redesign은 Chromium/WebKit 320/390/1440 전체 통과했다. 확정 건물 배치·실제 HTTP 캐시·이전 host의 늦은 모듈 로드·GPU 중단/미지원·키보드/터치 17건씩을 두 엔진에서 통과했다. 이 단락은 로컬 검수이며 새 정확 SHA CI·운영 결과는 별도다.

### 2026-11-03 Mac 고궁 통합 검수 결과

규칙 `hanq-collaboration-2026-11-01-v5`. 원격 main `3d7f149123ee21b1f106ef5900a85e07057ff03c` 위에 원래 후보 두 커밋만 cherry-pick했고, 제품 차이는 원래 `d2fd012`와 동일한 장면 JS/CSS 세 파일이다. 교재·문항·학습 진행·API·DB·헤더·workflow·버전은 변경하지 않았다. `qa-palace-hotspots.cjs`에 320×568과 macOS WebKit Option+Tab을 추가했다. 후자는 macOS 기본 Tab이 버튼을 건너뛰는 플랫폼 동작을 반영하며 실제 다음 버튼 focus와 Enter 라우트 assertion은 유지한다. Chrome/WebKit 각18건 모두 통과, `qa-island-harbors.cjs`28건과 `qa-living-water.cjs`9건 통과. 320·1440·650×320 가로 PNG를 직접 확인했고 간판·건물 클릭영역·배·정지 버튼의 겹침을 확인했다. static build 및 CD16 tests, 메뉴83 assertions, 지도 정렬도 통과했다. 작업 evidence의 `chromium/results.json`, `webkit/results.json`, `harbor-regression/qa-results.json`, `living-water/results.json`과 PNG가 근거다.

GitHub 연결 검색은 저장소 권한 오류422를 반환했고 Chrome은 로그아웃 상태의404였다. Git clone/push 권한을 CI 조회 성공으로 해석하지 않는다. 필수 exact-SHA CI를 확인하지 못해 production main 갱신·배포는 보류한다. 운영 반영은 성공 CI와 현재 main 재확인 후 통합 담당이 수행하고 실제 도메인의 `/app-version.json`·세 장면 자산을 대조해야 한다.

후속 확인: 검토 후보 `8e7dcb907b380664258f6d2c55206c61ef3e1dae`의 원격 push와 동일 SHA를 확인했다. CI combined status 조회는404이며 연결 앱의 설치 계정 목록에 대상 조직 `hddooo`가 없었다. CI 상태가 실패라는 뜻이 아니라 이 환경에서 읽지 못한 것이다. 첫 push는 자동 승인 검토가 대상·payload의 사용자 승인을 확인하지 못해 실행 전 거절했고, 사용자 이력에서 `hddooo/file-island-web`의 명시적 지정과 이번 전체 적용 요청을 확인한 뒤 동일 행동을 한 번 재시도해 성공했다. 추가 권한·토큰·보안 설정은 변경하지 않았다.

### 2026-11-03 저녁 궁 캠핑장 조사 (미구현)

기존 `#history`의 세 건물·라우트·모바일 메뉴를 보존하려면 궁 지도에 캠핑장을 덮는 것보다 역사섬의 별도 쉬어가기 장면을 추가하는 편이 자연스럽다. 진입 UI와 route 연결 위치는 통합 담당이 결정하며 현재 후보에는 추가하지 않았다. 배경 시안은 메타데이터로 저녁 캠핑장·중앙 불·의자·강·먼 사원 구도를 확인했으나 원본 이미지 내려받기는 두 번 모두 실패했다. 픽셀을 보거나 조선 궁의 형태·구체 좌표를 검수했다고 주장하지 않는다.

실제 구현은 고정된 조선 궁·의자·지형 plate와 독립 불꽃/연기/구름/캐릭터 레이어를 사용한다. 불은 bounded Canvas2D 또는 shader로 매 프레임 불꽃 윤곽·입자·불티를 바꾸고 연기와 주변 조명은 별도 위상으로 움직일 수 있다. 하늘은 독립 구름/별 레이어, 강은 새 원본에서 측정한 물 mask로 갱신한다. 기존 낮 고궁의 물 좌표를 재사용하거나 전체 그림을 흔들지 않는다. 이미 불·연기·캐릭터가 합성된 한 장은 중복이 생기므로 깨끗한 plate와 별도 투명 소품이 필요하다.

캐릭터는 `patamon-hover-idle-v1.png`의 등록된6프레임 날갯짓을 재사용할 수 있다. 유년기는 `collection-life`의 검수된 실루엣·깜빡임·짧은 도약과 마을의 독립 이동/휴식 궤적을 재사용할 수 있지만 전신 달리기 프레임은 아니다. 저장소의 아구몬4프레임은 idle/손짓·깜빡임이므로 달리기로 표현하지 않는다. 자연스러운 발걸음 달리기를 요구하면 캐릭터별 새 run-cycle atlas·발 접점·정면/좌우 등록이 필요하다. 포요몬 머리를 나누는 rig는 금지한다. 장식 캐릭터는 소유·XP·부화·장착 판정과 연결하지 않는다.

새 장면은 숨긴 탭·화면 이탈·offscreen에서 정지하고 저전력 버퍼/프레임 제한·축소 모션·명시적 재생을 유지해야 한다. 다음 검수는 시간차 픽셀로 불꽃/구름 변화와 궁/의자 고정, 캐릭터 발 접점·진입/이탈·중복 실루엣, 320/390/1440·낮은 가로 화면·Chrome/WebKit을 확인한다. 이 조사는 장면 구현·새 아트 승인·운영 적용이 아니다.

추가 요구는 더 어두운 밤과 산 부근의 오로라다. 산의 고정 실루엣 뒤 하늘에만 독립 shader 띠를 배치해 색·윤곽·광량이 느리게 흐르게 할 수 있다. 궁·의자·모닥불·캐릭터를 포함한 화면 전체를 이동시키지 않으며, 새 캠핑장 위치와 아트 분리는 아직 미확정이다.

### 2026-11-03 영어섬·고궁 공동 통합 후보

별도 `codex/islands-combined-20261103` worktree에서 고궁 Mac 최종 후보 `d57da20`에 영어섬 검수 후보 `b140a81`을 merge했다. 두 후보 모두 결과의 ancestor이며 기존 검토 브랜치는 그대로다. `b140a81`은 고궁 `7b391f8` 위에 영어섬 `7d353f1`의 제품 변경을 이미 옮긴 후보이므로 `7d353f1`을 또 적용하지 않는다. 제품 파일 충돌은 없었고 progress 문서 끝의 충돌만 양쪽 기록을 전부 유지해 해결했다. 결합 runtime은 영어섬 검수 후보와 바이트 동일하며 한국사 데이터·교재 렌더러·원화·API·DB·버전·workflow는 이 통합에서 추가 수정하지 않았다.

결합본 검사: `qa-english-island.cjs` Chrome/WebKit10건, `qa-palace-hotspots.cjs` Chrome18·WebKit18건, `qa-island-harbors.cjs`28건 모두 통과하고 pageerror0이다. 학습 진행67·메뉴83 assertions 및 정적 빌드1640 runtime 파일/정확 SHA/private 제외 검사도 통과했다. 영어섬은 기존 핀을 숨기고 건물 자체를 native 버튼으로 쓰므로 공통 회귀 검사의 영어 핀 좌표/클릭을 실제 건물 중앙으로 갱신했다. 역사섬 핀과 모든 기존 레이아웃·목적지·focus·Back·중복 방지·진도 fixture·스크롤 assertion은 보존했다. macOS WebKit만 Option+Tab을 사용한다. 이 테스트 수정 전 결합본의 `pinHit:false` 실패를 기록하며 assertion을 삭제하지 않았다. 증거는 작업 evidence의 `combined-english/results.json`, `combined-palace-chrome/results.json`, `combined-palace-webkit/results.json`, `combined-harbors/qa-results.json`이다.

운영 통합 순서는 이 결합 후보의 정확 SHA CI 성공 확인 → 최신 main과 차이 재확인/필요한 통합·재검수 → 한 통합 담당자의 main 갱신 → CD 성공과 실제 도메인 build SHA/자산 대조다. GitHub 앱의 hddooo 접근 부재는 계속되어 현재 CI·main 배포는 미확인/미실행이다. 캠핑장·오로라는 이 제품 후보에 포함하지 않았고 별도 쉬어가기 장면 조사로만 유지한다.

### 2026-11-03 결합 후보 CI 접근 확인과 영어 메뉴 이름 복구

새 로그인·권한 추가 없이 기존 개인 Chrome `Blockmonkey` 프로필에서 hddooo Actions에 접근했다. 앞선404는 연결 앱/회사 Chrome의 접근 한계이며 개인 Chrome의 기존 권한과 구분한다. 후보 `df493c78effe858f8ed2ab8b7f088105934a0c35`의 [CI49](https://github.com/hddooo/file-island-web/actions/runs/41597827259)는 한국사·인증 job이 통과했으나 compact UI에서 실패했다. 실패 로그는 `qa-vocabulary-redesign.cjs`가 기존 `Practice · 파트별 실전 문제` 접근성 이름을 찾지 못한 것이며, 영어섬 간판 모듈이 native aria-label을 장소 이름으로 덮은 것이 원인이다.

제품의 기존 네 학습 목적지 aria-label을 그대로 두고, 새 장소는 고유 ID의 hint와 aria-describedby에 추가하며 title/시각 간판은 보존한다. 기존 CI assertion은 바꾸지 않았다. 영어섬 QA에는 원래 네 접근성 이름과 장소 설명 연결을 전 화면에서 검증하는 assertion을 추가했다. 영어섬 Chrome/WebKit10건을 통과했으며, 원래 실패한 단어장/PDF/계정 체크/네 메뉴 검사는 변경 없이 동일 명령으로 재검증한다. 최종 정확 SHA CI와 main/CD/운영 검증 상태는 후속 실행 결과를 기준으로 한다.

후속 `f34a1da`의 [CI52](https://github.com/hddooo/file-island-web/actions/runs/41598528039)는 인증·한국사·Practice·헤더4개 job을 통과했으나 compact UI의 `qa-map-shell-polish.cjs`에서 긴 간판 viewport 보존 검사에 실패했다. 영어 건물 좌표는 그대로 두고 간판 중심만 지도 경계 안으로 보정하며, 간판 크기 관찰로 글꼴/텍스트 변경에도 재배치한다. 긴 표제는150px 안에서 줄바꿈한다. 기존 CI 스크립트는 수정하지 않았고 로컬 두 엔진6개 원래 시나리오 및 긴 이름을 추가한 영어섬10건을 통과했다. 앞선 단어장/PDF/계정 체크/네 메뉴도 두 엔진320/390/1440 전체 통과했다. 실패·수정·후속CI를 각각 구분하며 통과하지 않은 CI를 승인 근거로 쓰지 않는다.

### 2026-11-03 역사섬 비·나뭇잎 우산 조사 (미구현)

기존 atmosphere에는 맑음→구름→비→갬의150초 로컬 순환, 독립 빗방울·잎·구름 레이어와 offscreen/문서숨김/저전력/축소 모션 정지가 이미 있다. 실제 기상 API가 아니다. 역사섬에는 아직 비에 반응하는 캐릭터나 나뭇잎 우산 자산이 없다. 승인된 건물 메뉴 후보를 바꾸지 않고 별도 장면 모듈에서 구현한다.

비의 강도·구름·캐릭터 반응은 하나의 pause 가능한 장면 시계를 공유해야 한다. 비가 시작되기 전 작은 초록 잎을 올리고 비가 그치면 잠시 후 내리게 해 별도150초 타이머의 위상 어긋남을 피한다. 등록된 유년기 실루엣과 마을의 이동/휴식·도약 궤적을 재사용하고 잎은 캐릭터의 머리/손 anchor에 붙여 보행과 함께 움직인다. 큰 머리/뿔·더듬이를 자르거나 가리지 않으며 포요몬은 연속된 머리를 보존한다. 잎 위 튀는 작은 방울과 발 아래 물결은 독립 입자이며 메뉴·원화 전체는 움직이지 않는다.

필요 자산은 투명한 초록 잎 앞/측면과 잎자루, 캐릭터별 머리/손·접지·가림 순서 등록이다. 실제 달리기/잎을 손으로 집어 드는 동작은 기존 idle atlas에 없으므로 새 run/hold/lift 프레임 없이는 완전한 전신 동작으로 주장하지 않는다. 유년기의 짧은 도약과 별도 잎 overlay부터는 가능하다. 장식 actor는 pointer-events:none으로 건물 메뉴를 막지 않으며 실제 소유·XP·부화·장착 계약에 연결하지 않는다. reduced-motion에서는 정지된 휴식 pose와 일관된 날씨 상태를 제공하고 명시적 재생·정지는 같은 장면 시계에 적용한다. 우산/비 동기화, 그림자·발 접점, 건물 클릭, 모든 진입/이탈·resize·화면숨김 복귀를 두 엔진과320/390/1440·가로에서 검수해야 한다. 이 조사는 자산 생성·구현·배포 완료가 아니다.


### 2026-11-03 영어섬 디지몬 후속 검토 후보

별도 `codex/islands-residents-20261103`은 결합 메뉴의 접근성 이름 복구·긴 간판 보정을 보존하고 영어 담당의 `1934d728e8c23784f004106b275d015e340db0a4` 한 커밋만 적용했다. 원래 영어 메뉴 `7d353f1`은 중복 적용하지 않았다. 메뉴 후보 `f6f3095`를 ancestor로 보존하는 merge이며 메뉴 우선 배포 후보는 변경하지 않는다. 실제 아구몬·코로몬·파닥몬의 기존 등록 프레임을 사용하는 장식 레이어/설정만 추가했고 학습·음원·소유·XP·기록을 변경하지 않았다. 새 이미지는 만들지 않았다.

긴 간판/접근성 보정을 포함한 후속 후보에서 `qa-english-residents.cjs` Chrome/WebKit10건(실제 프레임 변화·고정 actor·간판 hit·정지/재개·축소 모션·offscreen·detach·decode 실패/복구·기록 fixture 보존) 및 정적 빌드1642 runtime 파일 검사를 통과했다. 작업 evidence의 `islands-residents-long-label/results.json`과 PNG가 근거이며 아직 검토 후보다. 먼저 메뉴 후보의 필수 CI·main·CD·운영 대조를 끝내고 이 후보의 정확 SHA CI를 확인해 별도로 운영 통합한다. 역사섬 캠핑·비/우산·오로라 구현은 포함하지 않는다.


### 2026-11-03 Joseon source diagram and emphasis follow-up

Reviewed source60/61 government relations and timeline render with selectable text, bounded shapes/lines, readable source colours and internal scrolling. Source73's office/map relationship remains intact, and source66's map belongs to the original war row. Orange and yellow source styles require exact-source audit metadata. The172-item quiz digest is unchanged. Linux regression and actual-source tests pass, as does real JWT/PostgreSQL storage against the final sparse candidate. No operating member data or running backend service was changed. This unit is not production deployment: full human page review, current CI integration, operating root verification and parent release inspection remain.


### 2026-11-03 Source prompt emphasis preservation

Original underlines can now survive both the reading page and functional blank prompt through source-bound display metadata outside the quiz JSON. Every range must match native question IDs and literal text in the selected edition. Markup cannot change source text or answers. Six additional outlined study/answer labels were recovered in the private candidate. Existing642-question and actual172-question regression plus real JWT/PostgreSQL verification pass; all quiz bytes and canonical digests are preserved. This is a prepared local source/frontend unit, not operating deployment.

### 2026-11-03 compact CI budget correction

- English source a3e7f7b feature CI passed all seven jobs, but main run 41683902917 and history feature run 41684282727 exhausted the existing 25-minute compact job budget. Logs showed passing matrices through the final review, with no assertion error before cancellation. Deployment did not run.
- Keep every original browser command and source-contract assertion; split the browser sequence at qa-rainbow-viewport into compact-ui-regression and compact-scene-regression. Both remain required by static-build, each with the original 25-minute limit. Node 24, action pins and permissions are unchanged.
- Validate the new groups locally under Linux Node 24 with CPU quota 2, explicit hardwareConcurrency 2 and synthetic API/network isolation before publishing a new exact-SHA CI run. This is a CI-only correction; release remains 0.2.12-beta.

- Additional local timing witness: WebKit 390px long-label fitting was still pending after the old fixed 60ms wait (x=-6.109375), then settled on the next frame (x=15.990623). Only this QA wait now uses two actual animation frames; the original bounds and overflow assertions remain unchanged. The full six Chromium/WebKit map matrices passed with this correction.
- Linux two-CPU validation of all nine scene commands passed (measured command time 557.919s; tail-four and front-five were executed as two batches). Original commands/assertions were retained. Local collection used installed Playwright Chromium because Chrome channel is absent in the offline image; the hosted CI still uses its original channel.

- Local compact UI validation is complete: the original first seven scripts, corrected six map-shell matrices, and both original header scripts all passed in separate isolated batches. Header checks took 227.758s. Existing static-build reproducibility (1,642 runtime files) and app-version/deployment-header tests also passed. The exact new-SHA hosted CI and operating deployment remain pending at this commit.

- This pipeline correction is merged into the history candidate while retaining release 0.3.0-beta and the required history evening regression. No history runtime asset changed in this merge.

### 2026-11-03 reduced-motion handoff and CI diagnostics

- Final artifact preflight found active-to-reduced water frames stopping before the static plate/control state synchronized. Independent cold English/history Chromium fixtures confirmed it; the native event-dispatch cause is unconfirmed. A running frame now calls the existing synchronization path before exiting on reduced motion. No new animation loop or drawing-buffer preservation is added.
- The added active/reduced/resume and screenshot-pixel regression passed all ten English matrices on Windows Chrome/WebKit and ten on offline Linux Node 24 with two CPUs. Existing water/boat/economy checks passed nine cases per Windows engine. The in-memory candidate override also passed four full history artifact preflight cases, including static plate, resume, menus and English roundtrip.
- CI a77 compact UI passed; compact scene passed in 24m06s after slow Ubuntu dependency downloads. CI ca2217 compact UI passed in 13m34s, but final review timed out waiting for .world-map. The same history source passed all ten independent Linux final-review matrices (90 route pages, 139.216s); that timeout cause remains unconfirmed. Keep the original 30-second wait and all 44 assertions, adding route progress plus synthetic HTML/PNG/state on failure.
- Increase browser job total allowances to 25 minutes (40 for the two compact groups) so observed dependency-download time does not consume their test time. All original test commands remain required; runner labels, Node 24, action pins and permissions are unchanged. Reuse the existing pinned artifact action to preserve only synthetic final-review diagnostics on failure.
- Publish only the new verified source revision. Its hosted CI and operating version/hash/browser verification remain pending at this commit; the English release is still 0.2.12-beta.

- The common water handoff fix is merged into this history candidate while retaining release 0.3.0-beta. The expanded history water regression must pass before publication.


### 2026-11-03 expanded history water regression complete

- Tested history runtime commit 3f47665a84ad0e07f56ebde4f7a0cdbdf113385d with the expanded QA: Windows Chrome/WebKit 12 cases and offline Linux Node 24 / two CPUs Chromium/WebKit 12 cases all passed, errors zero. Normal eight-core and explicit two-core fixtures, module failure/remount retry and all original menu/lifecycle checks were retained.
- Every one of the twenty normal scene cases now verifies reduced water state, hidden moving surface, frames stopped for 200ms and frame growth after motion resumes. All 32 original assertion calls remain; four water assertions were added. Forty screenshots and separate result JSONs are retained in the task evidence.
- Final candidate remains 0.3.0-beta, including English water handoff fix 85dfeee. Build the new exact commit, run all eight hosted jobs, then publish main only after the English unit is deployed and verified. Operating deployment is still pending at this commit.

### 2026-11-03 align browser CI with the validated OS

- English 85dfeee CI diagnostics captured a WebKit page process crash when starting the 768px subjects matrix after the 320px/390px matrices had passed. The failed page could not return DOM/HTML because the target had crashed.
- The original, unchanged 44 assertions and ten final-review matrices passed again in a controlled single-container Ubuntu 24.04.5 / Node 24 / two-CPU / 7GiB-memory run: 90 route pages, 136.002s, peak cgroup memory 1,836,122,112 bytes, zero OOM/OOM-kill/page-crash counters. Earlier parallel shared-VM experiments are excluded. The crash cause remains unconfirmed; neither OOM nor an OS defect is asserted.
- Pin only the six browser QA jobs to the Ubuntu 24.04 family used by the validated local environment. Static-build and auth-contract remain on ubuntu-latest. No test command, assertion, wait, matrix or browser reuse lifecycle changes. This removes the observed local Noble / hosted Resolute OS difference before the next required CI run.
- Official references: [GitHub standard hosted labels](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) include ubuntu-24.04 with the same private-repository two-CPU/eight-GB resources; [Playwright 1.64.1 Docker images](https://playwright.dev/docs/docker) support Noble. Node version, browser lock, action pins and permissions remain unchanged.
- Runtime source is byte-identical to 85dfeee; release remains 0.2.12-beta. New exact-SHA CI and operating deployment are pending at this commit.

- History retains release 0.3.0-beta and its expanded 24-case water regression. Runtime/QA bytes are unchanged since 0660afb; only the browser-job OS labels and records differ.


### 2026-11-04 Joseon summary preparation (0.3.1-beta)

The verified new-edition summary can retain its chapter step and load source-bound clues/answers through existing member manifest and quiz reads. Default/explicit79 and unready/unknown selections retain existing behavior. Literal question IDs, text, answers, events and canonical digest are validated; classification summaries also retain their original subitem and choice context. Summary reads never call progress APIs, and account changes discard stale responses. Isolated real API storage and Windows/Linux app navigation pass. The frontend preparation preserves the current production gate; actual81 activation still requires operating API/root/member verification.
