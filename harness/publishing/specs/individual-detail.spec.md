---
feature: individual-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 64:8735
  relatedNodeIds:
    - 157:11525
    - 610:14132
    - 970:26390
requires_functional_test: true
paths: src/pages/species, src/pages/feeds, src/entities/feed, src/entities/individual, src/entities/observation, src/shared/ui
---

# 개체관리 · 개체 상세 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일은 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 개체 상세`(`311:12784`).
- 상세 화면 기준: `64:8735` (`individual detail`)
- 카드 케밥 메뉴 열림: `157:11525` — `kebab menu`(`157:11661`, component set `141:9597`)
- 개체 삭제 확인 모달: `610:14132` — `common / 딤 + 삭제 확인 모달 (관찰 기록 포함)`(`610:14140`)
- 첨부 hover: `970:26390` — `attachment popover`(`970:26527`)
- 구성 컴포넌트: `basic info`(`127:9270`) / `individual / 성별 뱃지`(`161:11782`) / `section header` plain(`127:9302`) /
  `observation list`(`127:9224`) / `back`(`1:10470`) / `kebab`(`39:8668`)
- 추출 캐시: `harness/artifacts/publishing/individual-detail.figma.txt`
- 공통 브리프: 개체관리 7개 spec 공통 기준(라우트·데이터 모델·mock 소유권·컴포넌트 이름)을 따른다.
  이 spec 은 **`entities/observation/model/mock.ts` 를 명세한다.**
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context` 를 기준 프레임 `64:8735` 전체와, related 프레임의 달라지는 영역
(`157:11661` 케밥 메뉴, `610:14140` 삭제 모달, `970:26527` 첨부 팝오버, `970:26393` 표 — 기준과 같음)과
성별 뱃지 component set(`161:11782`)에 호출했다. 좌표는 `get_metadata`, 구분선·아이콘 색은 SVG 에셋 원문으로 확인했다.

- **yot 실측 확인**: 화면 골격(뒤로가기·카드·섹션 헤더·표 y 좌표), 카드 내부(사진·이름·뱃지·라벨/값 행),
  `먹이 급여 기록 확인하기` 버튼과 카드 케밥 위치, 표 컬럼 폭·헤더 52·행 92·구분선 `#848491`,
  첨부 chip 규격과 `외 N개`·`—` 표기, 카드 케밥 메뉴 규격·위치, 개체 삭제 모달 문구·규격, 첨부 팝오버 규격, 성별 뱃지 3종 색.
- **Figma 근거 없음(게이트 ② 결정으로 채움)**: 관찰 0건 빈 상태 문구, 행 케밥 메뉴 위치(이 feature 에 행 케밥 열림 프레임 없음),
  관찰 삭제 확인 모달 문구, 삭제 실패·삭제 성공 토스트(개체관리 Figma 에 삭제 토스트 프레임 없음 — task-list 규격 승계),
  첨부 팝오버의 화면 위치와 여닫는 규칙(`970:26390` 은 팝오버를 표 오른쪽 밖 `@1632,585` 에 두었다),
  `먹이 급여 기록 확인하기` 이동 대상·비활성 표현, 없는 id 처리, 접근성·반응형 절 전체.

## 목적

운영 관리자가 종 상세에서 개체 한 마리를 열어 사진·성별·출생연도·기타정보를 확인하고,
앱에서 기록된 관찰 및 특이사항을 최신순 표로 훑으며 첨부 파일을 내려받는다.
필요하면 케밥으로 개체를 수정·삭제하거나, 관찰 기록을 열어 보거나 수정·삭제한다.

## 범위

- 포함: 개체 조회, 프로필 카드(사진·이름·성별 뱃지·출생연도·기타정보), `먹이 급여 기록 확인하기` 버튼(최신 급여 기록 상세로 이동),
  카드 케밥(수정·삭제), 개체 삭제 확인 모달·결과 토스트, `관찰 및 특이사항 N건` 섹션 헤더,
  관찰 표(날짜·관찰자·제목·첨부), 첨부 다운로드와 `외 N개` 첨부 팝오버, 행 클릭 이동, 행 케밥(수정·삭제),
  관찰 삭제 확인 모달·결과 토스트, 페이지네이션, 관찰 0건 빈 상태, 없는 개체 처리, 관찰 상세에서 삭제 후 돌아왔을 때 토스트
- 제외:
  - **관찰 기록 등록** — 관찰은 모바일 앱에서 작성한다(앱 섹션 `1:755` 의 `개체 선택`·`대상 개체`, `observation list` 설명
    `어드민 추가 불가`). 이 화면 섹션 헤더에는 등록 버튼이 없다(`section header` plain 변형).
  - 먹이 급여 상세 화면 자체(`feed-detail`), 개체 수정 폼(`individual-form`),
    관찰 상세·수정(`observation-detail` / `observation-edit`), 종 상세(`species-detail`)
  - 실제 API 연동(`/api` 스킬 담당 — Notion API 명세 DB 에 개체·관찰 API 없음, 2026-09-15 확인)
  - 직원 권한별 케밥 숨김(범위 밖 — 결정 사항)
  - 사이드바 변경(`sidebar.spec.md` 소유), 검색·정렬 UI, 행 다중 선택

## 라우트와 진입

라우트는 개체관리 공통 라우트다(모든 개체관리 spec 동일).

- `/species/:speciesId/individuals/:individualId` → 이 화면.
- 진입: 종 상세(`/species/:speciesId`) 개체 표의 행 클릭(`species-detail`).
  개체 수정 저장 성공 후(`individual-form`), 관찰 상세 `뒤로가기`·관찰 상세 삭제 성공 후(`observation-detail`)에도 이 화면으로 온다.
- `뒤로가기` → `/species/:speciesId`(종 상세). 편집이 없으므로 이탈 확인은 없다.
- 카드 케밥 `수정` → `/species/:speciesId/individuals/:individualId/edit`(`individual-form`).
- 개체 삭제 성공 → `/species/:speciesId` 로 이동하고 종 상세가 `데이터 삭제에 성공했습니다` 토스트를 띄운다.
- 관찰 행 본문 클릭 → `/species/:speciesId/individuals/:individualId/observations/:observationId`(`observation-detail`).
- 행 케밥 `수정` → `/species/:speciesId/individuals/:individualId/observations/:observationId/edit`(`observation-edit`).
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout` 이 전역 렌더하므로 페이지는 본문만 담당한다.

## 동작 (behavioral spec — source of truth)

### 조회

- `/species/:speciesId/individuals/:individualId` 진입 → `뒤로가기`, 프로필 카드, `먹이 급여 기록 확인하기` 버튼,
  카드 케밥, `관찰 및 특이사항 N건` 섹션 헤더, 관찰 표 1페이지가 보인다.
- 불러오는 중 → `개체를 불러오는 중입니다.` 를 표시한다(`TaskDetailPage` 패턴).
- 없는 개체 id, 또는 개체가 경로의 `:speciesId` 종에 속하지 않으면 → `개체를 찾을 수 없습니다.` 와
  `종 상세로 돌아가기`(`/species/:speciesId`) 링크를 표시한다(Figma 근거 없음 — 결정 사항).
  기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴(`<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크)을 따른다.
  `:speciesId` 종도 없으면 링크 대상인 종 상세가 `종을 찾을 수 없습니다.` 를 보인다.
- 진입 시 관찰 표는 항상 1페이지에서 시작한다.

### 프로필 카드

- 사진 — 개체 대표 사진 1장(`photo.url`)을 180×180 정사각으로 잘라(object-fit cover) 보여준다.
- 이름 — 개체명(`name`)을 카드 제목으로 보여준다.
- 성별 뱃지 — 이름 오른쪽에 `IndividualSexBadge` 로 `♂ 수컷` / `♀ 암컷` / `? 미상` 을 보여준다(Figma `161:11782`).
  종 상세 개체 표와 같은 컴포넌트다.
- 출생연도 — `{birthYear}년` (예: `2019년`).
- 기타정보 — `note` 를 그대로 보여준다. 줄바꿈은 보존하고 길면 줄을 바꿔 이어 쓴다(카드 높이가 늘어난다).
  - **기타정보가 없으면 행은 두고 값 자리에 `—` 를 `colors.textFaint` 로 표시한다**(Figma 는 값이 있는 경우만 그렸다.
    빈 값 기호는 같은 화면 첨부 칸 `—`(`127:9223`)에 맞춘다).

### 먹이 급여 기록 확인하기

- 버튼은 카드 오른쪽 위, 카드 케밥 왼쪽에 보인다.
- 화면 진입 시 이 개체의 급여 이력(`GET /feed-log/admin/history/{animalManageId}`)을 조회한다.
- 이력이 있으면 클릭·Enter → 가장 최근 급여 기록 상세 `/feeds/:feedLogId` 로 이동한다.
  급여 상세는 그 기록과 이 개체의 급여 이력 전체를 보여준다. 급여 상세의 `뒤로가기` 는 이 개체 상세로 돌아온다.
- 이력을 불러오는 중이거나, 이력이 없거나(404 포함), 조회에 실패하면 `aria-disabled="true"` 로 두고 클릭·Enter 해도 반응이 없다. 초점은 받을 수 있다.
- 시각은 Figma 외형 그대로 둔다(누를 수 없을 때도 흐리게 처리하지 않는다).

### 카드 케밥 메뉴

- 카드 오른쪽 위 `⋮` 클릭 → `수정` / `삭제` 두 항목이 열린다(Figma `157:11661`).
- 바깥 클릭 또는 `Escape` → 메뉴가 닫히고, `Escape` 로 닫으면 초점이 `⋮` 로 돌아온다.
- `수정` → 메뉴가 닫히고 `/species/:speciesId/individuals/:individualId/edit` 로 이동한다.
- `삭제` → 메뉴가 닫히고 개체 삭제 확인 모달이 열린다.
- 카드 메뉴와 행 메뉴는 동시에 하나만 열린다. 하나를 열면 다른 메뉴는 닫힌다.

### 개체 삭제

- 확인 모달(Figma `610:14140`): 제목 `정말 삭제하시겠습니까?`,
  본문 `등록된 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`, 버튼 `취소` / `확인`.
  기존 `DeleteConfirmationDialog` 를 재사용하고 본문은 `description` prop 으로 넘긴다(게이트 ② 채택).
- `취소` / `Escape` → 모달이 닫히고 초점이 카드 `⋮` 로 돌아온다. 아무것도 삭제되지 않는다.
- `확인` → 개체를 삭제하고 `/species/:speciesId` 로 이동한다. 종 상세가 `데이터 삭제에 성공했습니다` 토스트를 띄운다.
- 개체의 관찰 기록도 함께 삭제된다(모달 문구 근거). mock 은 소속 개체가 없는 관찰을 조회에서 빼는 방식으로 표현한다 — 데이터 절 참고.
- 삭제 실패 → 모달을 닫고 이 화면에 `데이터 삭제에 실패했습니다` 토스트를 띄운다. 화면은 그대로 둔다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

### 관찰 및 특이사항 섹션 헤더

- 제목 `관찰 및 특이사항` 과 건수 `N건` 을 보여준다. `N` 은 **이 개체의 전체 관찰 수**다(현재 페이지 행 수가 아니다).
- 등록 버튼은 없다(관찰은 앱에서 작성한다).
- 관찰이 삭제되면 건수가 바로 줄어든다.

### 관찰 표

- 컬럼은 `날짜` / `관찰자` / `제목` / `첨부` 네 개와 헤더 텍스트 없는 케밥 칸이다.
- `날짜` — `observedAt`(`YYYY-MM-DD`)을 `YYYY.MM.DD` 로 표시한다(예: `2026.06.01`).
- `관찰자` — `observerName`. `제목` — `title` 한 줄. 칸 폭을 넘으면 말줄임(`…`)한다(고정폭 칸).
- **정렬은 날짜 최신순 고정**이다. 같은 날짜는 `id` 가 큰 쪽이 먼저다. 관찰 표에는 검색·정렬 UI 가 없다 (2026-09-15 Figma·저장소 근거 판단: Figma 3행 `2026.06.01` → `2026.05.10` → `2026.04.22`, `observation list` 에 검색바·정렬 아이콘 없음).
- 한 페이지 10행이다(개체관리 공통 — task-list 결정 승계). 10건을 넘으면 표 카드 안 아래에 페이지네이션을 보인다.
- 페이지 번호 클릭 → 해당 페이지 행으로 바뀐다. 1페이지에서 `이전 페이지`, 마지막 페이지에서 `다음 페이지` 는 비활성이다.
- 행 본문 클릭 또는 행에 초점을 두고 Enter → 관찰 상세로 이동한다.
- 관찰이 0건이면 → 표 헤더는 두고 행 자리에 `등록된 관찰 기록이 없습니다` 를 표시하고 페이지네이션을 숨긴다.
  섹션 헤더는 `관찰 및 특이사항 0건` 이다. 추가 안내 줄은 없다 (2026-09-15 Figma·저장소 근거 판단: `observation list` 설명 "어드민 추가 불가" — 등록 안내를 두지 않는다).

### 첨부 칸

- 첨부가 1개 이상이면 첫 번째 파일 chip(확장자 아이콘 + 파일명 + 다운로드 아이콘)을 보여준다.
- 첨부가 2개 이상이면 chip 오른쪽에 `외 N개` 를 보여준다. `N` 은 첫 파일을 뺀 나머지 개수다(예: 3개 → `외 2개`).
- 첨부가 없으면 `—` 를 `colors.textFaint` 로 보여준다.
- 파일명이 칸 폭을 넘으면 말줄임하고, 다운로드 버튼의 접근 가능한 이름에 전체 파일명을 둔다.
- **chip 클릭 → 그 파일을 내려받는다. 행 이동은 일어나지 않는다.** chip 전체가 다운로드 버튼이다(표 안 24px 아이콘만으로는 터치 영역이 작다).
- **`외 N개` 에 마우스를 올리거나 키보드 초점을 두면 첨부 팝오버가 열린다**(Figma `970:26390` 이름 `attach hover`).
  팝오버에는 **첫 파일을 포함한 첨부 전체**가 chip 으로 세로 나열된다(`970:26527` 은 chip 3개 — `외 2개` 행과 수가 같다).
  - 팝오버 chip 클릭 → 그 파일을 내려받는다. 행 이동은 일어나지 않고 팝오버는 열린 채로 둔다.
  - `외 N개` 클릭은 행 이동을 일으키지 않는다.
  - 포인터가 `외 N개` 와 팝오버를 모두 벗어나거나(mouseleave), 초점이 둘 다 벗어나거나(blur), `Escape` → 팝오버가 닫힌다.
    `Escape` 로 닫으면 초점이 `외 N개` 로 돌아온다.
  - 팝오버는 한 번에 하나만 열린다. 케밥 메뉴를 열면 팝오버는 닫힌다.
  - 위치는 `외 N개` 바로 아래 왼쪽 정렬이다(Figma 위치 `@1632,585` 는 표 밖이라 따르지 않는다).
  - 여닫는 규칙 전체 (2026-09-15 Figma·저장소 근거 판단: Figma `970:26390` 이름 `attach hover`, 트리거는 `외 N개`).
- 첨부 칸 안 컨트롤에서 Enter / Space 를 눌러도 행 이동은 일어나지 않는다.
- 다운로드는 mock 경계다 — 실제 파일 소스가 없으므로 기존 `AttachmentList` 와 같이 파일명을 이름으로 가진 임시 파일을 내려받는다.
  `fileKey` 로 서버 파일을 받는 동작은 `/api` 스킬 담당이다.

### 행 케밥 메뉴

- 행 오른쪽 끝 `⋮` 클릭 → 그 행의 `수정` / `삭제` 메뉴가 열린다. 행 이동은 일어나지 않는다.
- 다른 행의 `⋮` 또는 카드 `⋮` 를 누르면 이전 메뉴가 닫히고 새 메뉴가 열린다. 동시에 하나만 열린다.
- 바깥 클릭 또는 `Escape` → 메뉴가 닫히고, `Escape` 로 닫으면 초점이 그 행 `⋮` 로 돌아온다.
- `수정` → 메뉴가 닫히고 `/species/:speciesId/individuals/:individualId/observations/:observationId/edit` 로 이동한다.
- `삭제` → 메뉴가 닫히고 관찰 삭제 확인 모달이 열린다.
- 메뉴 위치는 종 목록·종 상세 표의 행 케밥과 같다 — 트리거 하단 8px·우측 끝 정렬(`KebabMenu` 배치 옵션. 이 feature 에 행 케밥 열림 프레임 없음 — 미검증).

### 관찰 삭제

- 확인 모달은 `DeleteConfirmationDialog` **기본 문구**를 쓴다: 제목 `정말 삭제하시겠습니까?`,
  본문 `삭제하신 뒤에는 영구삭제되며` / `복구 할 수 없습니다`, 버튼 `취소` / `확인`
  (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 관찰 삭제 모달 프레임이 없다 — 기본 문구).
- `취소` / `Escape` → 모달이 닫히고 초점이 그 행 `⋮` 로 돌아온다. 행은 그대로 남는다.
- `확인` → 관찰을 삭제하고 모달을 닫는다. 표가 갱신되고 섹션 헤더 건수가 1 줄며 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
  이 화면에 머문다.
- 삭제 결과로 현재 페이지가 총 페이지 수를 넘으면 마지막 페이지로 당긴다(task-report 규칙 승계).
- 삭제 실패 → 모달을 닫고 `데이터 삭제에 실패했습니다` 토스트가 뜬다. 행은 그대로 남는다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

### 토스트

- 이 화면에서 뜨는 토스트는 두 가지다(표시 3초, 동시 1개 — 기존 `Toast`).
  - `데이터 삭제에 성공했습니다` — 관찰 삭제 성공, 또는 관찰 상세에서 관찰을 삭제하고 이 화면으로 돌아온 경우(`delete-success`)
  - `데이터 삭제에 실패했습니다` — 개체 삭제 실패, 관찰 삭제 실패
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
- 개체 삭제 성공은 `navigate('/species/:speciesId', { state: { toast: 'delete-success' } })` 로 종 상세가 띄운다.
- 수정 성공 토스트는 넣지 않는다(개체관리 공통 — 결정 사항).

## 화면 구조와 시각 규격

1920px 데스크톱 기준. 본문 너비 1320px, 좌우 중앙 정렬(x=300). 페이지 배경 `colors.background`.
좌상단 메뉴 버튼(`64:8736`, `36×36 @36,32`)은 기존 사이드바를 재사용한다.

1. **뒤로가기**(`back` `64:8798`, `@300,75` 1320×36): chevron 36 + `뒤로가기` 24px SemiBold `colors.textGuide`, gap 10.
   기존 `BackLink`(Figma `1:10470` 대응) 규격과 같다.
2. **프로필 카드**(`basic info` `129:9534`, `@300,144` 1320×295): 배경 `colors.surface`, radius 20px, padding 40px,
   가로 배치 gap 40, 세로 가운데 정렬.
   - 사진(`photo`): 180×180, radius 20px, object-fit cover, 카드 안 `@40,57.5`.
   - 정보 영역(`info`, `@260,40` 1020×215): 세로 gap 20.
     - 제목행(`titles`, h48): 이름 40px Medium `colors.text`(텍스트 111×48) + 성별 뱃지, gap 16.
     - 라벨/값 행: 라벨 칸 118px, 라벨 20px Medium `colors.textGuide`(h24), 라벨↔값 gap 16, 값 22px Medium `colors.textStrong`(h27).
       `출생연도` 행 h27(`@y68`), `기타정보` 행은 오른쪽 빈 칸이 h100 이라 행 높이 100(`@y115`) — 기타정보 여러 줄 자리로 본다.
     - Figma 는 행마다 `left`/`right` 498px 두 칸으로 나눴고 `right` 는 비어 있다. 값은 `left` 칸(값 폭 364px) 안에 그렸다.
   - 카드 높이 295 = padding 40 + 정보 215 + padding 40. 기타정보가 길면 늘어난다.
   - Figma 의 `basic info` 설명(`사진 260`, `1320×341`)은 인스턴스 실측(사진 180, 295)과 다르다 → 실측을 따른다.
3. **먹이 급여 기록 확인하기**(`link / 먹이 급여 기록` `949:26307`, `@1267,184` 245×52 — 카드 기준 `@967,40`):
   배경 `colors.accentBg`, radius 8px, padding 12/20px, gap 8, 라벨 18px Medium `colors.accent`, chevron-right 28px `colors.accent`.
   카드 인스턴스 밖 페이지 레벨 노드지만 카드 오른쪽 위에 겹쳐 놓였다 → 카드 액션 영역으로 구현한다.
4. **카드 케밥**(`kebab` `1198:14863`, `@1536,184` 44×52 — 카드 기준 `@1236,40`, 오른쪽 inset 40): 아이콘 32px `#848491`(`colors.textGuide`).
   버튼↔케밥 간격 24px.
5. **카드 케밥 메뉴**(`157:11661`, `@1440,244` 180×116): 케밥 하단(y236)에서 8px 아래, 오른쪽 끝이 카드 오른쪽 끝(x1620)과 맞는다.
   배경 `colors.surface`, 테두리 1px `colors.tableHeaderStrong`, radius 12px, 그림자 `0 8px 12px rgba(0,0,0,0.14)`,
   padding 8px 0, 항목 gap 4, 항목 h48 padding 12/20px, 20px Medium — `수정` `colors.textStrong`, `삭제` `colors.danger`.
6. **섹션 헤더**(`section header` plain `129:9530`, `@300,499` 1320×56 — 카드 아래 60px): 제목 `관찰 및 특이사항` 28px Medium
   `colors.textStrong` + 건수 `N건` 20px Medium `colors.textGuide`, gap 12, 오른쪽 spacer. Figma 건수는 `3건`.
7. **관찰 표**(`observation list` `129:9455`, `@300,579` 1320×416 — 섹션 헤더 아래 24px):
   배경 `colors.surface`, 테두리 1px `colors.border`(`#A1A1A1`), radius 20px.
   - 헤더행 h52, 배경 `colors.tableHeaderStrong`, 텍스트 20px, padding-left 40.
     Figma 헤더 글자는 `날짜` SemiBold `#36363F` / `관찰자`·`첨부` Medium `#36363F` / `제목` Medium `#000000` 로 섞여 있다.
   - 컬럼 고정폭:

   | 컬럼       | x    | 폭  |
   | ---------- | ---- | --- |
   | 날짜       | 0    | 200 |
   | 관찰자     | 200  | 180 |
   | 제목       | 380  | 560 |
   | 첨부       | 940  | 300 |
   | 액션(케밥) | 1240 | 80  |

   - 본문 행 h92, 첫 행은 헤더 아래 16px(`@y68`)부터. 행 사이 구분선 1px `colors.textGuide`(`#848491`), 좌우 inset 40(`@x40` w1240).
   - `날짜` 20px Medium `colors.textGuide`, `관찰자` 20px Medium `colors.textGuide`, `제목` 22px Medium `colors.textStrong`. 셀 padding-left 40.
   - 케밥 44×52 는 액션 칸 가운데(`@18,20`).
   - 페이지네이션(`@548,352` 224×32, 표 카드 **안**, 마지막 행 아래 8px, 카드 하단까지 32px):
     chevron 28, 번호 32×32 radius 24, 번호 gap 20, chevron↔번호 gap 16,
     활성 22px `colors.accent` + `colors.accentBg`, 비활성 18px `colors.pageMuted` — 기존 `DataTable` 규격과 같다.
     Figma 는 `3건` 인데 페이지 3개·2페이지 활성으로 그린 더미다.
8. **첨부 칸**(`127:9192`, 칸 안 padding-left 40, chip↔`외 N개` gap 8):
   - chip(`127:9193`, `상처사진.jpg` 기준 172×56): 테두리 1px `colors.textFaint`(`#AFAFBA`), radius 없음, padding 16/12px, gap 8,
     확장자 아이콘 20px + 파일명 16px Medium `colors.textStrong` + 다운로드 아이콘 24px(`#36363F`).
   - `외 N개`(`970:26381`): 16px Medium `colors.textGuide`.
   - 첨부 없음(`127:9223`): `—` 20px Medium `colors.textFaint`.
   - 칸 가용 폭 260px 에 chip + `외 N개` 가 들어가야 하므로 파일명은 말줄임한다(폭 값은 ③에서 실측 조정).
9. **첨부 팝오버**(`970:26527`, chip 3개 기준 204×216): 배경 `colors.surface`, 테두리 1px `colors.tableHeaderStrong`,
   radius 12px, 그림자 `0 8px 12px rgba(0,0,0,0.12)`, padding 16px, chip 세로 gap 8. chip 규격은 8번과 같다(172×56).
10. **개체 삭제 확인 모달**(`610:14140`): 딤 `rgba(0,0,0,0.5)`, 600×300 흰 카드 중앙, radius 20px.
    원형 아이콘 48×48(배경 `colors.dangerBg`, `!` 32px `colors.danger`) `@276,43`, 제목 28px `colors.text` + 본문 2줄 20px `colors.textGuide`
    (gap 12, `@y103`), 버튼 100×48 radius 8 — `취소`(테두리·글자 `colors.textGuide`, Medium) `@192,216` / `확인`(배경 `colors.text`, 흰 SemiBold) `@308,216`.
    기존 `DeleteConfirmationDialog` 와 차이: 제목 굵기(Figma Medium ↔ 기존 600), `취소` 테두리·글자색(Figma `#848491` ↔ 기존 `dialogBorder`/`text`),
    `확인` 굵기. 모달은 전 화면 공용이라 **기존 시각을 유지하고 문구만 바꾼다**(⑦ 육안 확인에서 판단).
11. **토스트**: 기존 `Toast`(우상단 `@1432,32`, 440×80). 개체관리 Figma 에 삭제 토스트 프레임은 없다.

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.
Figma 텍스트 폰트가 `Inter` 와 `Wanted Sans` 로 섞여 있지만 저장소는 `font.body` 하나만 쓴다.

### 신규 semantic color 토큰

없다. 사용 색은 전부 `tokens.ts` 에 있다
(`#848491` textGuide, `#36363F` textStrong, `#AFAFBA` textFaint, `#4952FF` accent, `#E8E9FF` accentBg, `#DDDDE3` tableHeaderStrong,
`#FF3131` danger, `#FFCECE` dangerBg, `#C6C6CE` pageMuted, `#A1A1A1` border, `#F5F5F7` background, `#000000` text).

- `yarn harness:map-tokens` 가 `#FFCB77` 을 new 로 보고했다. 이 값은 CSS 색이 아니라 **jpg 확장자 아이콘 SVG 에셋 내부 fill** 이다
  (figma.txt 의 에셋 색 주석에서 수집됨). 저장소 `src/features/create-resource/ui/assets/file-jpg.svg` 가 같은 fill 을 가진다 → 토큰이 아니다.
- `AttachmentChip` 은 이 아이콘 에셋(`file-*.svg` 를 `shared/ui/assets` 로 이동)을 쓰고, 기존 `AttachmentList` 텍스트 배지(`JPG`, `colors.fileJpg`)는 바꾸지 않는다(게이트 ② 채택).

## 데이터

```ts
// entities/individual (species-detail 이 mock 을 명세한다 — 여기서는 참조만)
type IndividualSex = 'FEMALE' | 'MALE' | 'UNKNOWN' // 암컷 / 수컷 / 미상
interface Individual {
  id: string
  speciesId: string
  name: string // 개체명
  sex: IndividualSex
  birthYear: number // 4자리, 표시 `{birthYear}년`
  note?: string // 기타정보 (선택) — 없으면 `—`
  photo: { fileName: string; fileKey: string; url: string } // 대표 사진 1장
}

// entities/observation (이 spec 이 mock 을 명세한다)
interface ObservationAttachment {
  fileName: string
  fileKey: string
}
interface Observation {
  id: string
  individualId: string
  title: string // 제목
  observedAt: string // YYYY-MM-DD, 표시 YYYY.MM.DD
  observerName: string // 관찰자
  content: string // 관찰사항 (이 화면에는 표시하지 않음 — observation-detail)
  attachments: ObservationAttachment[] // 첨부, 없으면 []
}
```

- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- 이 화면이 쓰는 쿼리(함수·키 이름은 각 mock 소유 spec 이름을 그대로 쓴다):
  - 개체: `['individuals', individualId]` — `getMockIndividual(individualId)` → `Individual | null` (`entities/individual`, species-detail mock 명세).
    `null` 이거나 결과의 `speciesId` 가 경로와 다르면 없는 개체로 처리한다.
  - 관찰 목록: `['observations', 'list', { individualId }]` — `getMockObservations(individualId)` (`entities/observation`).
    mock 은 그 개체의 관찰 전체를 최신순으로 돌려주고 **페이지 자르기는 페이지가 한다**(task-list 방식). 섹션 헤더 건수는 전체 길이다.
  - 개체 삭제: `deleteMockIndividual(individualId)`(species-detail mock 명세) — 성공 시 `['individuals', individualId]` 제거,
    `['individuals']`·`['species']`(마리수)·`['observations']` 무효화.
  - 관찰 삭제: `deleteMockObservation(observationId)` — 성공 시 `['observations', observationId]` 제거, `['observations']` 무효화.
- **관찰 mock 함수**(`entities/observation/model/mock.ts` — 이 spec 이 소유한다. 저장소 `getMockResources` · species-detail `getMockIndividual` 형식):
  - `getMockObservations(individualId): Promise<Observation[]>` — 날짜 내림차순, 같은 날짜는 id 내림차순. 삭제된 관찰 제외.
  - `getMockObservation(observationId): Promise<Observation | null>` — `observation-detail` / `observation-edit` 가 쓴다.
  - `updateMockObservation({ id, input }: { id: string; input: UpdateObservationInput }): Promise<Observation>` — `observation-edit` 가 쓴다.
    입력 형태(`UpdateObservationInput`)는 `observation-edit` 가 정한다. 수정값은 `observationStorageKey` override 로 저장하고
    조회 함수들이 반영한다(수정한 제목이 이 표에 보인다 — `entities/resource` `updateMockResource` 패턴).
  - `deleteMockObservation(observationId): Promise<void>` — 이 화면 행 삭제와 관찰 상세 삭제가 같은 함수를 쓴다.
  - query key: 목록 `['observations', 'list', { individualId }]`, 단건 `['observations', observationId]`(저장소 `['tasks', id]` 형식).
    변경 뒤 `['observations']` 접두를 무효화하고, 삭제 성공 시 단건 캐시를 먼저 제거한다(`TaskDetailPage` 규칙).
- **관찰 mock**(`src/entities/observation/model/mock.ts`, 총 12건, id 는 숫자 문자열, 공통 fixture 기준):

  | id | individualId | observedAt | observerName | title | attachments |
  | --- | --- | --- | --- | --- | --- |
  | 1 | 1 동식이 | 2026-06-01 | 김유영 | 얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음 | `상처사진.jpg`, `상처사진_측면.jpg`, `처치기록.pdf` |
  | 2 | 1 | 2026-05-10 | 김유영 | 배변상태 평소보다 조금 묽음 | `배변사진.jpg` |
  | 3 | 1 | 2026-04-22 | 김유영 | 식욕 정상, 활동량 양호 | 없음 |
  | 4 | 1 | 2026-04-08 | 이승현 | 체중 측정 결과 평소와 비슷함 | 없음 |
  | 5 | 1 | 2026-03-27 | 김수인 | 발톱 손질 완료 | `발톱손질.png` |
  | 6 | 1 | 2026-03-15 | 김유영 | 합사 개체와 다툼 흔적 없음 | 없음 |
  | 7 | 1 | 2026-03-02 | 이지아 | 등 부위 피부 건조 증상 관찰 | `피부상태.jpg`, `피부상태_근접.jpg` |
  | 8 | 1 | 2026-02-18 | 이승현 | 수영장 이용 시간 증가 | 없음 |
  | 9 | 1 | 2026-02-04 | 김유영 | 예방접종 후 특이반응 없음 | `접종기록.pdf` |
  | 10 | 1 | 2026-01-21 | 김수인 | 털빠짐 부위 감소 | 없음 |
  | 11 | 1 | 2026-01-07 | 이지아 | 겨울철 실내 적응 양호 | 없음 |
  | 12 | 2 미미 | 2026-05-28 | 김유영 | 귀 뒤 작은 딱지 확인 | `귀상태.jpg` |

  - 동식이 11건 → 한 페이지 10행이라 2페이지(1행)가 생겨 페이지네이션을 확인한다. 최신 3행이 Figma 3행과 같다.
  - **두리(개체 3)는 관찰 0건**이다 → 빈 상태 확인용. 미미(개체 2)는 1건, 기타정보 없음(공통 fixture) → `—` 확인용.
    species-detail 개체 mock 의 나머지 개체(4~26)는 관찰 0건이다. 성별 `미상` 표본은 체리(개체 7, 종 2).
  - 첨부 `외 N개` 표본: id 1(`외 2개`), id 7(`외 1개`). 첨부 1개: id 2·5·9·12. 첨부 없음: 나머지.
  - `content` 는 id 1~3 이 제목과 같은 문장이다(observation-detail `1323:15015` 관찰사항 값이 제목과 같다). 나머지도 제목과 같게 둔다.
    `fileKey` 는 `mock-observation-{id}-{순번}` 형식의 임의 문자열이다(다운로드 mock 은 파일명만 쓴다).
  - Figma 팝오버는 `상처사진.jpg` 를 3번 그렸다(더미). mock 은 파일명이 서로 다르게 둔다.
- localStorage 키 상수(기존 `resources` mock 규약 승계, 실제 API 연동 시 제거):
  - `observationStorageKey = 'toyvillage:observations'` — 수정한 관찰 override(`updateMockObservation`).
  - `deletedObservationStorageKey = 'toyvillage:observations:deleted'` — 삭제된 관찰 id 목록. 새로고침·화면 이동 뒤에도 삭제가 유지된다.
  - `observationFailStorageKey = 'toyvillage:observations:fail'` — 값 `'delete'` | `'update'` 를 넣으면 다음 해당 요청이 한 번 실패한다
    (`'update'` 는 `observation-edit` 의 수정 실패 주입이다).
  - 개체 삭제 실패 주입은 개체 mock 소유인 species-detail 이 정했다: `individualFailStorageKey`(`toyvillage:individuals:fail`) = `'delete'`.
- 연쇄 삭제(mock, 개체관리 공통): 연쇄 삭제 기록을 따로 쓰지 않고 조회에서 뺀다. `getMockIndividuals` / `getMockIndividual` 은 삭제된 개체와
  삭제된 종(`getMockSpecies(speciesId)` 가 `null`)의 개체를 빼고(`null`), `getMockObservations` / `getMockObservation` 은 소속 개체가 없는
  (`getMockIndividual(individualId)` 가 `null`) 관찰을 뺀다(`null`). entities → entities import 는 ESLint 가 허용한다. 실제 연쇄 삭제는 서버 책임이다.
- 클라이언트 상태: 열린 메뉴(카드 또는 행 id), 열린 첨부 팝오버 행 id, 삭제 모달 대상, 토스트, 현재 페이지는 페이지 로컬 상태다. 전역 상태로 올리지 않는다.

## 컴포넌트 구조/props

재사용 우선. 근거는 `harness/artifacts/publishing/individual-detail.component-map.md`.

- `IndividualDetailPage` — **신규**(`pages/species`). 조회·삭제 mutation, 메뉴·팝오버·모달·토스트·페이지 상태 소유.
- `BackLink { to }`(`shared/ui`) — **기존 재사용**. Figma `back`(`1:10470`) 대응 주석이 이미 있다.
- `IndividualProfileCard { name, sex, birthYear, note?, photo, actions? }` — **신규**(`entities/individual/ui`).
  Figma COMPONENT `basic info`(`127:9270`). 사진·이름·성별 뱃지·출생연도·기타정보를 그린다.
  `actions` 슬롯에 페이지가 `먹이 급여 기록 확인하기` 버튼과 카드 케밥을 넣는다(카드는 이동·삭제를 모른다).
  종 상세의 `SpeciesProfileCard`(`species basic info` `1191:14902`)와는 Figma 컴포넌트가 달라 합치지 않는다.
- `IndividualSexBadge { sex }` — **신규**(`entities/individual/ui`). Figma `161:11782`. **species-detail 과 공유**한다.
  - `MALE` `♂ 수컷` — 배경 `colors.accentBg`, 글자 `colors.accent`
  - `FEMALE` `♀ 암컷` — 배경 `colors.dangerBg`, 글자 `colors.danger`(Figma 설명은 `분홍` 이지만 값은 red 계열 토큰)
  - `UNKNOWN` `? 미상` — 배경 `colors.background`, 글자 `colors.textGuide`
  - pill: padding 6/16px, radius 100px, 20px, 기호↔라벨 gap 6, 높이 36.
- `SectionHeader { title, count?, unit?, action? }` — 공용(`shared/ui`). Figma `section header`(`127:9419`).
  develop 의 `feed-detail` 이 먼저 만든 `{ title, count }` 에 `unit`·`action` 을 더했다(2026-09-15 develop 병합 시 개발자 결정).
  이 화면은 plain 변형(`title="관찰 및 특이사항"`, `count={11}`), 종 상세는 with button 변형(`개체` / `3마리` / `+ 개체 등록하기`).
  props 이름은 species-detail spec 과 같다.
  같은 INSTANCE 가 두 화면 이상이라 공용으로 둔다(design-rules §1). 도메인 문구는 호출부가 넘긴다.
- `ObservationTable { rows, page, pageCount, onPageChange, onRowClick, renderAttachments, renderRowAction, emptyLabel }` — **신규**(`entities/observation/ui`).
  Figma COMPONENT `observation list`(`127:9224`). 내부는 **기존 `DataTable` 재사용**:
  `appearance={{ offsetTop: 24, headerBackground: 'tableHeaderStrong', dividerColor: 'textGuide' }}`(섹션 헤더↔표 24px — species-detail 과 같은 설정)
  (bordered·헤더 52·행 92·inset 40·페이지네이션 inside 는 기본값과 같다), 컬럼 `width` 200/180/560/300/80,
  케밥 칸 `variant: 'action'` + `align: 'center'`, 첨부 칸 `variant: 'action'`(칸 안 클릭이 행 이동을 일으키지 않게 — 기존 규칙 재사용).
  날짜·관찰자·제목 글자 규격은 `DataTable` 셀 variant(`date` 22px `textDate`, `text` 24px)와 달라 `render` 로 넘긴다.
  업무 `TaskTable` 의 `renderRowAction` 방식을 따른다.
- `ObservationAttachmentCell { attachments, observationTitle }` — **신규**(`entities/observation/ui`). 첫 chip + `외 N개` + 첨부 팝오버 + `—`.
- `AttachmentChip { fileName, onDownload, onRemove? }` — **신규 공용**(`src/shared/ui/AttachmentChip`, 게이트 ② 채택).
  유형 표시는 Figma `teenyicons` 아이콘(`features/create-resource/ui/assets/file-*.svg` 를 `shared/ui/assets` 로 옮겨 공유), 제거 아이콘은 Figma `healthicons:no-outline`(빨강 24px)이다.
  기존 `AttachmentList` 텍스트 배지·아이콘 다운로드 버튼은 바꾸지 않는다(`AttachmentList` 가 `AttachmentChip` 을 쓸지는 렌더 결과 불변을 조건으로 ③에서 정한다).
  기존 `AttachmentList` 안 `FileChip`(테두리 `textFaint`·높이 56·padding 12·파일명 16px·다운로드 24)과 같은 계열이라
  **표 칸·팝오버·관찰 상세·관찰 수정(`AttachmentField` 경유, `onRemove`)이 함께 쓴다**.
  이 화면(표 칸·팝오버)은 `onRemove` 없이 쓴다. 파일 다운로드 헬퍼(`downloadFile`, 현재 `AttachmentList` 비공개 함수)도 함께 옮긴다.
  `AttachmentList` 는 카드·라벨·빈 문구가 붙은 조회 전용 카드라 표 칸에 그대로 넣을 수 없다.
- `KebabMenu { open, onOpenChange, items, ariaLabel }`(`src/shared/ui`) — **기존 재사용 + 보강**(shared API 변경, 게이트 ② 채택).
  근거: 개체관리 케밥 메뉴(`39:9000`·`157:11656`·`157:11661`)가 모두 component set `141:9597` 이고 `KebabMenu` 가 그 set 의 구현이다
  (테두리 `tableHeaderStrong` · padding 8/0 · gap 4 · 항목 h48 · 32px `kebab.svg` `#848491` 일치).
  보강(개체관리 케밥 공통): ① `Escape` 로 닫을 때 초점을 트리거 `⋮` 로 되돌린다, ② 트리거 ref 를 노출한다
  (`onTriggerRef` — 삭제 모달이 닫힌 뒤 초점 복귀용), ③ 배치 옵션 — 메뉴를 트리거 하단 8px·우측 끝 정렬로 둔다
  (현재는 가장 가까운 positioned 조상의 `top: 0; right: 0`). 그림자 blur(기존 24px ↔ Figma 12px)는 기존 값을 유지하고 ⑦ 육안 확인에서 판단한다.
  `features/row-actions` 의 `RowActionMenu` 는 사용하지 않는다(통합은 범위 밖).
- `DeleteConfirmationDialog { pending, onCancel, onConfirm, description? }`(`src/shared/ui`) — **기존 재사용 + `description?: ReactNode` 추가**
  (shared API 변경, 게이트 ② 채택 — 미지정 시 기존 문구). 개체관리 문구: 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`
  (Figma `609:14119`), 개체 삭제 `등록된 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`(Figma `610:14119`), 관찰 삭제 기본 문구(프레임 없음).
- `Toast { variant, message, onDismiss }`(`shared/ui`) — 기존 재사용.

## 접근성

- 페이지 제목은 개체명(`h1`). 출생연도·기타정보는 라벨과 값을 프로그램적으로 연결한다(정의 목록 등).
- 사진은 `alt="{개체명} 사진"` 을 준다.
- 성별 뱃지의 기호(`♂` `♀` `?`)는 `aria-hidden`, 라벨 텍스트(`수컷`/`암컷`/`미상`)로 값을 전달한다.
- `먹이 급여 기록 확인하기` 는 버튼이다. 급여 이력이 없거나 불러오지 못하면 `aria-disabled="true"` 로 초점은 받고 활성화해도 아무 동작이 없다.
- 섹션 헤더는 `h2` 이고 건수를 heading 텍스트에 포함한다(`관찰 및 특이사항 11건`).
- 카드 `⋮` 이름 `{개체명} 개체 메뉴 열기`, 행 `⋮` 이름 `{관찰 제목} 관찰 메뉴 열기`. `aria-haspopup="menu"` / `aria-expanded`,
  메뉴 `role="menu"`, 항목 `role="menuitem"`, `Escape` 로 닫히고 초점이 `⋮` 로 돌아온다.
- 첨부 chip 은 `button`, 이름 `{파일명} 다운로드`. `외 N개` 는 `button`, 이름 `{관찰 제목} 첨부 {전체 개수}개 모두 보기`,
  `aria-expanded` 와 `aria-controls` 로 팝오버와 연결한다. 팝오버는 비모달 그룹(`role="group"`, 이름 `{관찰 제목} 첨부`)이다.
- 표 행은 키보드로 활성화할 수 있다(기존 `DataTable`). 행 안 컨트롤의 Enter/Space 는 행 이동을 일으키지 않는다.
- 삭제 확인 모달은 열릴 때 초점을 가두고 닫히면 모달을 연 `⋮` 로 초점을 되돌린다.
- 토스트는 `role="status"`(성공) / `role="alert"`(실패).
- focus-visible 은 색만이 아닌 outline 으로 표현한다. 컨트롤 터치 영역은 최소 44px.

## 반응형

- 980px 이하에서는 카드 padding 을 24px 로 줄이고, 사진을 정보 위로 쌓는다. 액션(`먹이 급여 기록 확인하기`·케밥)은 카드 오른쪽 위를 유지한다.
- 이름·값이 액션 영역과 겹치지 않게 제목행 오른쪽에 액션 폭만큼 여백을 둔다.
- 관찰 표는 좁은 화면에서 표만 가로 스크롤하고 페이지 전체는 가로 스크롤되지 않는다.
- 첨부 팝오버·케밥 메뉴는 화면 밖으로 나가지 않게 위치를 뒤집는다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

- S1: `/species/1/individuals/1` 진입 → 뒤로가기, 이름 `동식이`, 성별 `수컷`, 출생연도 `2019년`, 기타정보, `먹이 급여 기록 확인하기`, `관찰 및 특이사항 11건` 이 보인다.
- S2: 관찰 표 컬럼이 `날짜` `관찰자` `제목` `첨부` 이고 1페이지 10행이 최신순이며 첫 행 날짜가 `2026.06.01` 이다.
- S3: 첨부 3개 행은 `상처사진.jpg` chip + `외 2개`, 첨부 1개 행은 chip 만, 첨부 없는 행은 `—` 가 보인다.
- S4: 행 본문 클릭 → `/species/1/individuals/1/observations/:observationId` 로 이동한다.
- S5: 첨부 chip 클릭 → 그 파일명으로 다운로드되고 경로는 그대로다.
- S6: `외 2개` 에 마우스를 올리면 → 팝오버에 첨부 3개 chip 이 보인다.
- S7: 팝오버 chip 클릭 → 그 파일이 다운로드되고 경로는 그대로다.
- S8: `2 페이지` 클릭 → 11번째 관찰 1행이 보이고, 1페이지에서 `이전 페이지`·2페이지에서 `다음 페이지` 가 비활성이다.
- S9: `뒤로가기` → `/species/1` 로 이동한다.
- S10: 카드 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열린다.
- S11: 카드 메뉴 `수정` → `/species/1/individuals/1/edit` 로 이동한다.
- S12: 카드 메뉴 `삭제` → `등록된 관찰 기록도 함께 삭제되며` 문구의 삭제 확인 모달이 열린다.
- S13: 개체 삭제 모달 `확인` → `/species/1` 로 이동하고 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S14: 행 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열리고 행 이동은 일어나지 않는다.
- S15: 행 메뉴 `수정` → `/species/1/individuals/1/observations/:observationId/edit` 로 이동한다.
- S16: 행 메뉴 `삭제` → 모달 `확인` → 그 행이 사라지고 `관찰 및 특이사항 10건`, `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S17: 급여 이력이 있는 개체에서 `먹이 급여 기록 확인하기` 클릭 → 최신 급여 기록 상세 `/feeds/:feedLogId` 로 이동하고, 그 화면 `뒤로가기` → 개체 상세로 돌아온다.
- S18: 관찰 0건 개체(`/species/1/individuals/3`) → `관찰 및 특이사항 0건`, `등록된 관찰 기록이 없습니다`, 페이지네이션 없음.
- S19: 기타정보 없는 개체(`/species/1/individuals/2`) → 성별 `암컷`, 기타정보 값 `—`. 성별 미상 개체(`/species/2/individuals/7` 체리) → 성별 `미상`.
- S20: 카드·행 메뉴에서 바깥 클릭 / `Escape` → 메뉴가 닫히고, `Escape` 면 초점이 그 `⋮` 로 돌아온다.
- S21: 메뉴가 열린 상태에서 다른 `⋮` 클릭 → 이전 메뉴가 닫히고 하나만 열려 있다.
- S22: 팝오버가 열린 상태에서 `Escape` → 팝오버가 닫히고 초점이 `외 N개` 로 돌아온다.
- S23: 개체 삭제 모달 `취소` → 모달이 닫히고 상세 화면이 그대로 남는다.
- S24: 관찰 삭제 모달 `취소` → 모달이 닫히고 행이 그대로 남는다.
- S25: 개체 삭제 실패 → 상세 화면에 `데이터 삭제에 실패했습니다` 토스트가 뜨고 화면이 유지된다.
- S26: 관찰 삭제 실패 → `데이터 삭제에 실패했습니다` 토스트가 뜨고 행과 건수가 그대로다.
- S27: 2페이지의 유일한 행 삭제 → 1페이지로 당겨지고 페이지네이션이 사라진다.
- S28: 없는 개체 id / 다른 종의 개체 id 로 진입 → `개체를 찾을 수 없습니다.` 와 경로 종 상세로 가는 `종 상세로 돌아가기` 링크가 보인다.
- S29: 관찰 상세 삭제 성공으로 이 화면에 돌아오면(state `delete-success`) → `데이터 삭제에 성공했습니다` 토스트가 보인다.
- S31: 급여 이력이 없는 개체에서 `먹이 급여 기록 확인하기` 클릭 → `aria-disabled` 이고 경로가 바뀌지 않는다.
- S30: 키보드만으로 행 진입·첨부 다운로드·팝오버 열기·케밥 조작을 할 수 있고, 행 안 컨트롤의 Enter 는 행 이동을 일으키지 않는다.

## 결정 사항

- 라우트 `/species/:speciesId/individuals/:individualId` 와 하위 이동 경로는 개체관리 공통 라우트를 따른다 (2026-09-15 Figma·저장소 근거 판단: 사이드바 활성 판정 `pathname.startsWith(route + '/')`).
- 관찰 등록 수단을 두지 않는다 — 관찰은 앱에서 작성한다 (2026-09-15 Figma·저장소 근거 판단: `observation list` 설명 `어드민 추가 불가`, section header plain, 앱 섹션 `1:755`).
- `먹이 급여 기록 확인하기` 는 이 개체의 가장 최근 급여 기록 상세(`/feeds/:feedLogId`)로 이동한다. 개체 기준 급여 이력 화면을 따로 두지 않는다 — 급여 상세가 이미 그 개체의 급여 이력 전체를 보여준다. 이력이 없거나 불러오지 못하면 Figma 외형 그대로 `aria-disabled="true"` 다 (2026-09-17 개발자 결정, #119: 개체별 급여 이력 Figma 프레임 없음).
- 기타정보가 없으면 행을 숨기지 않고 `—` 를 보인다 (2026-09-15 Figma·저장소 근거 판단: 같은 화면 첨부 칸 빈 값 `—`(`127:9223`)).
- 관찰 표는 날짜 최신순 고정(같은 날짜는 id 내림차순), 검색·정렬 UI 없음, 한 페이지 10행이다 (2026-09-15 Figma·저장소 근거 판단: Figma `observation list` 에 검색·정렬 없음, `task-list` 10행).
- 첨부 chip 전체가 다운로드 버튼이다. `외 N개` 에 hover 또는 focus → `외 N개` 아래에 첨부 전체 팝오버, mouseleave·blur·`Escape` 로 닫힘, 팝오버 chip 클릭 = 다운로드, 행 이동 없음 (2026-09-15 Figma·저장소 근거 판단: Figma `970:26390` `attach hover`).
- 첨부 칸은 `DataTable` `action` 칸으로 두어 칸 안 클릭이 행 이동을 일으키지 않는다(`—` 빈 곳 클릭 포함) (2026-09-15 Figma·저장소 근거 판단: `DataTable` 기존 `variant: 'action'`).
- 관찰 0건 빈 상태는 `등록된 관찰 기록이 없습니다` 한 줄이다 (2026-09-15 Figma·저장소 근거 판단: `observation list` 설명 "어드민 추가 불가" — 추가 안내 없음).
- 관찰 삭제는 이 화면에 머물고, 개체 삭제는 종 상세로 이동한다 (2026-09-15 Figma·저장소 근거 판단: `task-list`(목록 삭제 머묾)·`task-detail`(상세 삭제 후 부모 이동) 규칙).
- `observation list` 설명의 `읽기 전용` 보다 행 케밥(`수정`/`삭제`)·관찰 수정 프레임(`1282:15007`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: 프레임 `157:11525`·`1282:15007` 이 컴포넌트 설명보다 구체적).
- `basic info` 설명(`사진 260`, `1320×341`)은 인스턴스 실측(사진 180, 295)과 달라 실측을 따른다 (2026-09-15 Figma·저장소 근거 판단: 인스턴스 `129:9534` 실측).
- 기타정보 값 폭·`DataTable` 헤더↔첫 행 간격·페이지네이션 여백·헤더 글자색은 `appearance` 확장 없이 기존 구현으로 두고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 공용 표 전체에 걸린다).
- `AttachmentChip`(신규 공용, Figma 유형 아이콘·빨강 24px 제거 아이콘)과 `SectionHeader`(신규 공용)를 채택하고, 기존 `AttachmentList` 는 바꾸지 않는다 (2026-09-15 Figma·저장소 근거 판단: design-rules §1 같은 INSTANCE 2곳 이상).
- 없는 id 는 `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크(종 `목록으로 돌아가기` · 개체 `종 상세로 돌아가기` · 관찰 `개체 상세로 돌아가기`)로 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage`·`EditTaskPage` not-found 패턴).
- 삭제 확인 모달은 `DeleteConfirmationDialog` 에 `description?: ReactNode` 를 추가해 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` · 개체 삭제 `등록된 관찰 기록도 함께 삭제되며`(둘째 줄 `삭제 후에는 복구할 수 없습니다`)를 쓰고, 관찰 삭제는 기본 문구를 쓴다 (2026-09-15 Figma·저장소 근거 판단: Figma `609:14119`·`610:14119` 문구, 관찰 삭제 프레임 없음).
- 케밥 메뉴는 `src/shared/ui/KebabMenu` 에 `Escape` 초점 복귀·트리거 ref 노출(`onTriggerRef`)·배치 옵션(트리거 하단 8px·우측 끝 정렬)을 보강해 쓴다 (2026-09-15 Figma·저장소 근거 판단: 케밥 메뉴 set `141:9597` 규격이 `KebabMenu` 와 일치, design-rules §1 같은 INSTANCE 2곳 이상 → 공용).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- 수정 저장 성공 토스트는 띄우지 않고 상세 이동으로 피드백을 대신한다 (2026-09-15 Figma·저장소 근거 판단: `task-edit`·개체관리 Figma 에 수정 성공 토스트가 없다).
- 종·개체 삭제는 모달 문구대로 하위 개체·관찰 기록을 함께 숨긴다. mock 은 조회 제외로 표현하고 실제 삭제는 서버 책임이다 (2026-09-15 Figma·저장소 근거 판단: 삭제 모달 문구 `609:14119`·`610:14119`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 사진 데이터는 `photo: { fileName: string; fileKey: string; url: string }` 이다. 종 1 `카피바라_2026.jpg`, 개체 1 `동식이_2026.jpg` 이고 나머지도 항목마다 다른 파일명을 둔다(이미지 바이트는 공용 에셋 1장 가능) (2026-09-15 Figma·저장소 근거 판단: 저장소 첨부 규약 `{ fileName, fileKey }` + 표시용 `url`, Figma 종 수정 chip `동식이_2026.jpg` 는 복사 오류).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 직원 권한별 케밥 숨김은 범위 밖이다 (2026-09-15 Figma·저장소 근거 판단: 웹은 관리자 로그인 전용(Notion `웹 관리자 로그인`), 직원은 앱을 쓴다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

- [ ] **사진 로드 실패 표시** — `page header` 에는 `no photo` 변형(`127:9291`)이 있지만 개체 상세는 `basic info` 를 쓰고, 저장소에도 사진 대체 표시 선례가 없어
      게이트 ② 목록에서 정하지 않았다. ③에서는 브라우저 기본 표시(빈 사진 영역)로 두고 디자인 확인 후 정한다. 시나리오 영향 없음.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 개체 기준 급여 이력 전용 화면, 직원 권한별 UI 분기.
