# HanQ 전체 기획

> 2026-10-30 현재 릴리스 범위: 직접 확인한 사용자 로컬 참고5장을 재해석한 행복의 마을(왼쪽 놀이동산·오른쪽 큰 나무 알 둥지·아기 디지몬3마리), 선로에 맞는 역정차/짧은 왕복, 곰 가림 방지와 My Page 카드 보관함을 반영한다. 현재 파트너·계정XP와 빈 준비 중 슬롯만 표시하며 알 구매/60초 부화/새 장착·개별XP 저장은 닫혀 있다. API/DB/auth/CORS 변경과 새 Library 업로드는 없다. 전체 기능 후보 FEa111e8d/API987be57은 보존한다. 정확한 운영 SHA·CI·Production 검증은 최종 결과를 기준으로 한다.

한국사와 TOEIC 학습을 파일섬의 지도·파트너 성장·퀴즈 대결로 연결한다. 이 파일은 두 저장소에 공통인 제품 범위의 기준이다. 서버 세부 계약은 [API 개발 설계](https://github.com/blockmonkey1992/hanq_api/blob/dev/docs/design-development.md)를 따른다.

## 현재 구현

- 여섯 섬 지도: 역사숲, 영어섬, 얼음섬, 무지개마을·준비 중, 명예의 전당, 건의·문의. 네 구역의 캐릭터는 분리된 투명 걷기 프레임으로 배회한다.
- 한국사 학습·문제풀이 및 TOEIC 오답노트·플레이어·문법노트·단어장. 로그인한 사용자는 게시된 같은 TOEIC 자료를 보되 제출 답안·정오답·진도는 개인별이다.
- 얼음섬 대결: 처음 한 번 양쪽 Ready, 서버 기준 카운트다운, 문제 제출·판정·공격, 자동 다음 문제, 종료 확인 후 통계·해설 리뷰. TOEIC 연습 상대는 XP 변동이 없다.
- 개인 배틀 기록과 `0. 전투 오답`에서 다시 복습한다. 실제 배틀 XP는 서버 확정값을 표시한다.

## 계획과 제한

전투 효과음, 무지개마을 알·부화·파트너 상실은 구현 범위에 들어오지 않았다. XP0 때문에 기존 파트너를 제거하지 않는다. 실제 iPhone/Safari, 장기 모바일 백그라운드 재생의 성공을 Chromium 검사만으로 보장하지 않는다. 배틀 서버 다중 인스턴스화는 별도 설계가 필요하다.

## 문서 입구

- [FE 개발 설계](design-development.md), [사용자 흐름](design-userflow.md)
- [버전 계획](versions/v0.1.0/plan.md), [진행 상태](versions/v0.1.0/progress.md), [결과·한계](versions/v0.1.0/report.md)
- 기존 상세 문서: [학습 진행 계약](learning-progress-contract.md), [플레이어](design-development.md#audio), [단어장](toeic-notebook.md), [문법 구조](design-development.md#grammar)

중복된 날짜별 설명은 버전 결과로 통합하고 실행/출처 JSON·QA는 필요한 경로에 유지한다. 예전 문서의 UI/전송 방식 설명과 최신 문서가 다르면 현재 코드·배포 커밋과 최신 결과 기록으로 확인한다.

## 무지개섬 Beta — 2026-10-28

무지개섬은 기차놀이 트랙, 작은 곰인형, 노란 곰 수호자가 알을 돌보는 놀이동산이다. 지도에서는 준비중 대신 Beta로 열고, 장면 구경과 실제 서버 수령을 구분한다. 서버 컬렉션 계약을 확인하기 전에는 수령·장착을 잠근다. 파피몬/파닥몬 계열 알은 각각 한 번 받을 수 있으며, 디지몬별 XP와 한 마리 장착 상태는 서버가 저장한다. [성장 규칙/API 기준](https://github.com/blockmonkey1992/hanq_api/blob/dev/docs/design-development.md#무지개섬-컬렉션-beta--2026-10-28-로컬-설계)을 따른다.

### 공식 자료 확인과 HanQ 설정의 경계

2026-10-28에 Bandai Digimon Web·Toei 공식 소개와 에피소드 자료를 확인했다. 일부 옛 페이지는 직접 열 때403/점검 페이지로 응답해 공식 도메인의 검색 색인도 함께 사용했다. 전체 매체에 하나의 강제 진화 경로가 있다고 주장하지 않는다. 아래는 HanQ에서 선택한 어드벤처 중심 경로다.

| 계열 | 채택 경로 | 공식 근거 |
| --- | --- | --- |
| 파피몬/Gabumon | 알 → 푸니몬(Punimon) → 뿔몬(Tsunomon) → 파피몬 → 가루몬 → 워가루몬 → 메탈가루몬 | [Tsunomon 도감](https://digimon.net/reference_en/detail.php?directory_name=tunomon), [Tsunomon→Gabumon](https://www.toei-anim.co.jp/tv/dejimon/chara/tsunomon.html), [Gabumon 소개](https://www.toei-anim.co.jp/tv/dejimon/chara/gabumon.html), [Garurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/garurumon.html), [WereGarurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/w-garurumon.html), [MetalGarurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/m-garurumon.html) |
| 파닥몬/Patamon | 알 → 포요몬(Poyomon) → 토코몬(Tokomon) → 파닥몬 → 엔젤몬 → 홀리엔젤몬(MagnaAngemon) → 세라피몬 | [알에서 Poyomon](https://www.toei-anim.co.jp/tv/dejimon/episode/summary/14/), [Poyomon→Tokomon](https://www.toei-anim.co.jp/tv/dejimon/episode/summary/15/), [Tokomon](https://www.toei-anim.co.jp/tv/dejimon/chara/tokomon.html), [Patamon](https://www.toei-anim.co.jp/tv/dejimon/chara/patamon.html), [Angemon](https://www.toei-anim.co.jp/tv/dejimon/chara/enjemon.html), [HolyAngemon](https://www.toei-anim.co.jp/tv/dejimon/chara/holyangemon.html), [Patamon의 궁극체 Seraphimon 공식 확인](https://digimon.net/topic/detail.php?id=870) |

설명 속 노란 곰인형과 장난감 마을은 **Monzaemon(もんざえモン)**에 부합한다. [공식 도감](https://digimon.net/reference_en/detail.php?directory_name=monzaemon)은 곰인형 모습의 퍼펫형·백신·완전체(영문 Ultimate)로 소개하며, [Toei 6화](https://lineup.toei-anim.co.jp/ja/tv/dejimon/episode/6/)가 장난감 마을과 연결한다. 공식 [MonMonMemo91](https://digimon.net/topic/detail.php?id=1091)은 Monzaemon→ShinMonzaemon 진화를 소개한다. [한국어 도감의 신퍼펫몬](https://digimon.net/reference_ko/detail.php?directory_name=shinmonzaemon)은 궁극체다. 전단계까지 하나의 고정 경로로 단정하지 않는다.

다만 원작 시작의 마을에서 어린 디지몬을 돌보는 역할은 [Toei 12화의 Elecmon](https://lineup.toei-anim.co.jp/ja/tv/dejimon/episode/12/)이다. 따라서 무지개섬의 노란 곰이 알을 지키는 설정과 작은 곰인형·기차 보육원은 사용자 요청을 반영한 HanQ 재구성이다. 화면의 이야기 안내에도 이를 구분했다. 아트는 imagegen으로 만든 팬 표현이며 공식 라이선스 아트라고 표시하지 않는다.

### 전용 기술 표현 — 2026-10-29 로컬 후속

단계는 XP 합계로 추정하지 않고 서버가 지정한 실제 캐릭터 ID를 따른다. 파피몬부터 세라피몬까지 아래 기술을 표현한다. 한글 표기는 공식 일본어 기술명의 음역이며 한국 방영판 명칭을 보증하지 않는다.

| 캐릭터 | 화면 기술 | 공식 확인 |
| --- | --- | --- |
| 파피몬 | 쁘띠 파이어 · 작은 푸른 불꽃 | [Toei Gabumon](https://www.toei-anim.co.jp/tv/dejimon/chara/gabumon.html) |
| 가루몬 | 폭스 파이어 · 푸른 화염 | [Toei Garurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/garurumon.html) |
| 워가루몬 | 카이저 네일 · 세 발톱 | [Toei WereGarurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/w-garurumon.html) |
| 메탈가루몬 | 코큐토스 브레스 · 얼음 결정 | [Toei MetalGarurumon](https://www.toei-anim.co.jp/tv/dejimon/chara/m-garurumon.html) |
| 파닥몬 | 에어 샷 · 공기 고리 | [Toei Patamon](https://www.toei-anim.co.jp/tv/dejimon/chara/patamon.html) |
| 엔젤몬 | 헤븐즈 너클 · 빛의 주먹 | [Toei Angemon](https://www.toei-anim.co.jp/tv/dejimon/chara/enjemon.html) |
| 홀리엔젤몬 | 헤븐즈 게이트 · 빛의 문 | [Toei HolyAngemon](https://www.toei-anim.co.jp/tv/dejimon/chara/holyangemon.html) |
| 세라피몬 | 세븐 헤븐즈 · 일곱 빛 구슬 | [Toei 캐릭터 소개](https://www.toei-anim.co.jp/tv/digimon/character/) |

뿔몬의 산성 거품은 위 도감, 토코몬의 거품은 위 Toei 소개, 포요몬의 산성 거품은 [공식 Beatbreak 소개](https://www.toei-anim.co.jp/tv/digimon_beatbreak/character/digimon/d0703.php)에서 확인했다. 푸니몬의 기술 원문은 공식 페이지 점검/검색 결과 부족으로 직접 확인하지 못했으며 화면의 일반 `거품`은 HanQ의 유년기 표현으로 둔다. 유년기에 성장기 이후 기술을 대입하지 않는다. 양쪽 오답의 몸통박치기·약공격과 정답 기술 표현은 기존 서버 이벤트에 따라 구분한다.

## 설치 앱 새 버전 안내

시작과 앱 복귀 때 배포 버전을 확인해 `새 버전 적용`을 제안한다. 사용자가 누를 때만 다시 열며, 풀이·전투·재생·작성·저장 중에는 적용을 잠근다. 브라우저와 설치 앱이 달라 보인 원인을 캐시로 확정하지 않는다. 이미 열린 옛 설치 앱이 이 코드를 최초로 받는 과정과 실물 iPhone 동작은 별도 확인 대상이다.
