# 홈 프론트 CD 설치 검토안

2026-11-02 실행 상태: 명시 승인 후 전용 repo runner `file-island-web-cd`를 등록했고 GitHub에서 Idle을 확인했다. `FileIslandWebGitHubRunner`는 현재 사용자 로그온 시 숨김으로 시작하는 지속 작업이다. 전용 controller 파일 해시 검증·Linux 볼륨 bootstrap·프론트 readonly volume mount 전환·동일 12e5778 설치 재배포 검수도 통과했다. NPM HTTPS vhost의 프론트 version/API health 200을 정상 인증서 검증으로 확인했다. 자동 CD 완료는 아직 선언하지 않으며 활성 workflow의 main CI→CD→실제 새 SHA 검증이 남아 있다. Windows PowerShell 7은 전역 설치돼 있지 않아 기본 PowerShell 5와 명시 UTF-8 출력으로 workflow를 구성했다. API/NPM/DB/파일 서버 설정은 변경하지 않았다.

현재 `fileisland-web-candidate`는 전용 Linux release volume의 `current`를 read-only로 제공하며 기존 `12e57783038dd4f299d2ac7a2804392dc0262985`가 유지된다. 새 repo push → main CI → 홈 프론트 자동 CD의 마지막 실행 검증을 진행 중이다. 승인된 runner/controller/volume/mount만 설치했고 API controller·DB·파일 서버·056·NPM 설정과 저장소는 변경하지 않았다.

## 실행 흐름

1. 기존 `Frontend contract checks`의 모든 job과 정적 build가 성공해야 artifact `frontend-static-<전체 SHA>`가 생긴다.
2. 승인 후 활성화할 `home-frontend-cd.yml.disabled`는 **이 repo의 main push가 발생시킨 성공 CI**만 받는다. repository/head repository/branch/event/workflow path/conclusion을 제한하고, 다운로드 전후 main HEAD를 재검사한다. PR·fork·실패·취소 CI는 배포하지 않는다.
3. 전용 Windows runner가 정확 CI run의 artifact 하나만 고정 SHA의 공식 download action으로 받는다. archive digest 불일치도 오류다. 배포 controller는 checkout/다운로드한 코드가 아니라 별도 설치·검토한 로컬 코드다. artifact 안의 JS나 스크립트는 실행하지 않는다.
4. Node verifier가 전체 SHA·릴리스·HTML meta·app-version·파일 크기와 SHA256·정확한 파일 집합을 검사한다. 경로 탈출/Windows ADS/예약 이름/숨김·비공개 경로/심볼릭 링크/중복 및 대소문자 충돌/초과 파일을 거절한다.
5. 짧게 실행되는 writer는 기존 검증 image, read-only 입력, **프론트 전용 Linux 볼륨만 RW**, 프론트 네트워크만 사용한다. 복사한 바이트를 다시 해시 검사한 뒤 `current` 심볼릭 링크를 동일 파일시스템의 rename으로 교체한다. 파일을 라이브 폴더에 하나씩 덮어쓰지 않는다.
6. 새 `/app-version.json` 바이트와 `/` 해시를 내부 frontend HTTP로 검증한다. 실패·정상 TERM 시 이전 링크로 되돌린다. 동시 배포 lock, 이전 CI run ID 거절, 검증한 동일 SHA 재배포를 지원한다. 이전 릴리스는 자동 삭제하지 않는다.
7. Nginx 후보는 기본 root를 `/srv/releases/current`로 바꾸고 `media/...?...build=<SHA>` 요청을 보관된 `releases/<SHA>`에서 읽는다. 이전 HTML이 새 JS를 같은 파일명으로 받는 것을 막는다. 없는 SHA의 자산은 404이며 새 자산으로 fallback하지 않는다. HTML/version cache·기존 API 오분기 503·비공개 경로 404·상대 redirect를 유지한다.

## 설치 전에 root가 승인/배정할 정확한 변경

| 대상 | 설치 변경 | 범위·영향 |
|---|---|---|
| GitHub `hddooo/file-island-web` | repo 전용 self-hosted **Windows X64** runner, label `file-island-web-cd` 등록·지속 실행 | 새 등록/서비스 및 로컬 Docker 실행 접근 필요. 이 runner를 PR 작업에 배정하지 않는다. repo의 신뢰된 main workflow가 Windows 사용자와 Docker 권한으로 실행된다는 승인 범위다. 기존 API runner/controller 재사용 금지 |
| Workflow token | 이 CD job에 `actions: read`, `contents: read` | 정확 CI artifact 다운로드와 main HEAD 읽기에만 사용. job 기본 GITHUB_TOKEN이며 새 PAT/배포 SSH secret은 요구하지 않는다. 등록 token은 승인된 GitHub UI의 정상 경로에서만 사용하고 GCM/쿠키에서 추출하지 않는다 |
| Controller | `C:/Users/INNOGRID/Documents/Codex/2026-11-02/task-3/home-front-cd-controller` | `deploy.cjs`, `verify-artifact.cjs`, `release.sh`, `bootstrap.sh`, config 및 runtime 파일을 제시한 해시와 대조하여 복사. API controller 폴더/작업과 분리. Node 24는 고정 action이 runner job의 tool 경로를 준비 |
| Docker volume | **`fileisland-web-releases`** 새 전용 볼륨 | 현재 검증된 12e5778 artifact로 빈 볼륨만 bootstrap. API·DB·정적 파일 서버 볼륨은 mount하지 않는다. 재시도 시 기존 비어 있지 않은 볼륨을 덮어쓰지 않는다 |
| 기존 프론트 컨테이너 | 같은 `fileisland-web-candidate:8080`, 같은 `fileisland-npm-review`, host port 0 유지. artifact bind를 위 볼륨의 read-only mount로 바꾸고 release Nginx 후보 적용 | 초기 설치 시 해당 프론트 컨테이너만 재생성하는 짧은 중단 가능. 현재 Compose와 bind 경로는 복귀용으로 보존. NPM/API/DB/기존 파일 서버/056는 변경하지 않는다. 재생성 후 NPM의 컨테이너 DNS 재해석을 단일 담당과 확인 |
| Workflow 활성화 | 검수·등록·bootstrap·내부 HTTP 검증 후 `.github/workflows/home-frontend-cd.yml`로 이동 | main에 설치된 뒤부터 다음 성공 CI의 자동 배포가 가능. 코드 push만으로 연결 완료라고 표시하지 않는다 |

운영 설정 설치 전에 root에게 파일별 SHA256 manifest와 테스트 결과를 전달한다. 위 항목은 이 문서 작성만으로 승인된 것으로 취급하지 않는다. 현재 운영 frontend mount는 그대로다.

설치 파일별 해시는 `scripts/home-frontend-cd/installation-sha256.json`에 고정한다. 파일을 내려받거나 복사한 뒤 이 값과 대조해야 하며, 운영에서 내려받은 artifact의 manifest와 controller 설치 manifest는 별개다.

## 설치 순서 및 복귀

- 원격 정확 SHA CI 결과를 정상 Actions 읽기 경로에서 확인하고 CD 소스를 검토한다. 현재 connector 404를 로컬 통과로 대체하지 않는다.
- 별도 controller 폴더를 만들고 코드·config·runtime 파일을 제시된 해시로 설치한다. `config.example.json`의 대상은 프론트 전용 volume/network/health 주소로 고정되어 있다.
- 승인된 `docker volume create fileisland-web-releases` 이후 **현재** artifact를 `writeControls()`로 검증한다. 네트워크 없는 일회성 writer에 artifact/control/`bootstrap.sh`를 read-only로, 새 FE volume만 RW로 mount하여 `bootstrap.sh 12e57783038dd4f299d2ac7a2804392dc0262985`를 실행한다. 다른 볼륨을 초기화하거나 강제 삭제하지 않는다.
- bootstrap 성공 후 `runtime/compose.yaml.disabled`를 명시적으로 사용하여 프론트만 재생성한다. NPM에서 root/version/assets/API 분기를 읽기 검수한다. 설치 실패 시 보존한 기존 Compose/bind 설정으로 프론트만 복귀하고 볼륨·이전 파일은 유지한다.
- runner를 repo 범위·전용 label로 등록한 뒤 비활성 workflow를 main에 활성화한다. **새 main push → CI 성공 → 해당 run artifact 다운로드 → 새 current SHA HTTP 확인**을 실제 한 번 관찰해야 자동 배포 연결 완료다.

배포 중 일반 오류와 TERM은 테스트한 rollback 경로다. 전원 손실·Docker daemon 강제 종료·SIGKILL처럼 trap 자체가 실행되지 못한 경우에는 lock/journal을 남기며 자동으로 lock을 지우지 않는다. `current`는 이전 또는 전체 검증한 새 릴리스 중 하나지만 HTTP 검수 완료 여부는 별도다. root가 current/last-successful-run/deployment-journal과 HTTP 상태를 확인한 뒤 복구해야 한다. acknowledgement가 불확실한 배포를 맹목적으로 재시도하지 않는다.

## 검수 범위

- Windows Node 단위: artifact identity/해시/추가 파일/경로 탈출/ADS/예약 이름/대소문자 충돌/metadata 거절. Windows symlink 생성 권한 문제로 해당 항목은 Linux에서 별도 실행한다.
- Linux Node 단위: symlink 거절 포함 전체 단위 검사.
- 기존 캐시 image의 `--network none` + tmpfs 통합: 빈 볼륨 bootstrap/기존 store 거절, 복사 후 변조 거절, 전환 후 health 실패 rollback, 성공 atomic switch·이전 build 자산 유지, stale run 거절, 동시 실행 거절·TERM rollback, 동일 SHA 재배포.
- 실제 12e5778 artifact 1,632개+manifest를 새 verifier로 검증. 운영 volume/controller/runner는 만들거나 설치하지 않고 검사한다.
- runtime Compose와 Nginx 후보의 구문 검사. 실제 GitHub workflow_run 이벤트·private artifact 다운로드·운영 mount 전환은 승인/설치 전이므로 아직 검수하지 않았다.

2026-11-02 로컬 결과: Linux 단위 7/7, Linux 통합 7개 시나리오 통과. Windows 단위는 6 통과/1 Linux symlink 항목 제외이며 해당 항목은 Linux에서 통과했다. 비활성 workflow YAML·정책 검사, 내장 PowerShell parser의 두 실행 블록 구문 검사, runtime Compose 및 Nginx 구문 검사도 통과했다. 실제 현재 artifact 1,632개와 manifest를 검증했다. 모든 Docker 검수는 캐시 image의 일회성 network-none 컨테이너와 합성 tmpfs에서 수행했고 운영 설치는 하지 않았다.

근거: [workflow_run 조건과 권한](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run), [공식 artifact 다운로드 action](https://github.com/actions/download-artifact), [고정 v8 action runtime/입력](https://github.com/actions/download-artifact/blob/9000827ccba6bdab643e8b6fd33ac0654aef8333/action.yml).

### Windows CI shell correction

Main CI `41461786562` succeeded. Automatic CD `41464689065` failed before artifact download because the default Windows PowerShell shell dot-sourced a temporary `.ps1` while script execution is disabled. The existing `12e57783038dd4f299d2ac7a2804392dc0262985` frontend remained HTTP 200. No execution policy is changed. The two run steps now invoke an installed Node helper using the ordinary `cmd` shell; it preserves main-head checks before download and deployment, fixed GitHub API scope, UTF-8 outputs, and the installed artifact verifier/deployment controller. Automatic deployment validation remains pending until a new exact-SHA CI and CD complete.
