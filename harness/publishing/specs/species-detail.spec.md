---
feature: species-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 58:8717
  relatedNodeIds:
    - 157:11428
    - 158:11676
    - 71:8796
requires_functional_test: true
paths: src/pages/species, src/entities/species, src/entities/individual
---

# 개체관리 종 상세 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일은 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 종 상세`(`311:12783`).
- 상세 화면 기준: `58:8717` (`species detail`)
- 케밥 열림: `157:11428` (메뉴 인스턴스 `157:11656`) / 종 삭제 확인 모달: `158:11676`
  (모달 인스턴스 `158:11683`, 컴포넌트 `common / 딤 + 삭제 확인 모달 (하위 데이터 포함)` `609:14119`) /
  개체 0마리 빈 상태: `71:8796` (표 `130:9541`, 섹션 헤더 `130:9560`)
- 구성 컴포넌트: `species basic info`(`1191:14902`) / `section header`(`127:9419`) / `individual list`(`130:9534`) /
  `individual / 성별 뱃지`(`161:11782`) / `kebab`(`39:8668`) / `kebab menu`(`141:9597`) / `back`(`1:10470`)
- 참고(읽기만): 개체 삭제 모달 문구는 `common / 딤 + 삭제 확인 모달 (관찰 기록 포함)`(`610:14119`, `individual-detail` 의 `610:14132`).
  종 상세에는 개체 삭제 모달 프레임이 없다.
- 개체관리 7개 spec(`species-list` `species-form` `species-detail` `individual-detail` `individual-form`
  `observation-detail` `observation-edit`)은 라우트·데이터 모델·mock 소유권을 같은 값으로 적는다.
  이 spec 은 **`src/entities/individual/model/mock.ts` 를 명세한다.** 종 mock 은 `species-list` 가 명세한다.
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context` 로 `58:8717` 전체, related 프레임의 달라지는 영역(`157:11656` `158:11683` `130:9541` `130:9560`),
성별 뱃지 컴포넌트 세트(`161:11782`)를 조회했다. 프레임 배치는 `get_metadata` 로 확인했다.
원문은 `harness/artifacts/publishing/species-detail.figma.txt`, 색 대조는 `species-detail.token-diff.report.md` 다.

- **yot 실측 확인**: 화면 골격 좌표, 프로필 카드 레이아웃·글자 크기·색, 법정지정분류 뱃지, 섹션 헤더,
  표 컬럼 고정폭·헤더·검색바·행 셀 글자, 페이지네이션, 성별 뱃지 3종 색, 카드 케밥 메뉴 크기·위치·스타일,
  종/개체 삭제 모달 문구·규격, 빈 상태 문구·색. SVG 에셋의 fill/stroke 로 아이콘 색도 확인했다
  (행 구분선 `#848491`, 케밥 `#848491`, 검색·필터 아이콘과 부제 점 `#AFAFBA`).
- **미검증**: 행 세로 간격(Figma 행 y 가 133 / 233 / 341 로 불균일), 성별 뱃지 높이(36 은 padding·글자 크기로 계산한 값), 법정지정분류가 여러 개일 때의
  간격·줄바꿈(Figma 는 1개만 그렸다), 개체 행 케밥 메뉴 위치(종 상세 프레임에 없다 — `species-list` `39:8913` 승계),
  토스트 규격(`species-list` 소유 `71:8888` 승계), 로딩·없는 종·검색 결과 없음 화면(프레임 없음),
  접근성·반응형 절 전체(근거 프레임 없음).

## 목적

운영 관리자가 종 목록에서 한 종을 열어 종 프로필(사진·국명·영문명·학명·분류군·법정지정분류·세부분류)을 확인하고,
그 종에 속한 개체를 표로 훑어 검색·상세 진입·수정·삭제하거나 새 개체를 등록한다.
종 자체의 수정·삭제는 프로필 카드의 케밥으로 한다.

## 범위

- 포함: 종 조회, 프로필 카드, 카드 케밥(수정·삭제), 종 삭제 확인 모달, 개체 섹션 헤더(마리수·개체 등록 진입),
  개체 표(이름·성별·출생연도), 개체명 검색, 페이지네이션, 행 클릭 이동, 행 케밥(수정·삭제), 개체 삭제 확인 모달,
  개체 0마리 빈 상태, 삭제·생성 결과 토스트, 없는 종 처리
- 제외: 실제 API 연동(`/api` 스킬 담당 — Notion API 명세 DB 에 종·개체 API 가 아직 없다, 2026-09-15 확인),
  종 목록·등록·수정(`species-list` / `species-form`), 개체 상세·등록·수정(`individual-detail` / `individual-form`),
  관찰 기록 화면, 사이드바 변경(`species-list`·`sidebar.spec.md`), 행 다중 선택, 직원 권한별 케밥 숨김(범위 밖 — 결정 사항)

## 라우트와 진입

개체관리 공통 라우트(7개 spec 동일). 사이드바 활성 판정이 `pathname.startsWith(route + '/')` 라 한 prefix 아래 중첩한다.

| 화면      | 경로                                                                        | spec               |
| --------- | --------------------------------------------------------------------------- | ------------------ |
| 종 목록   | `/species`                                                                  | species-list       |
| 종 등록   | `/species/create`                                                           | species-form       |
| 종 상세   | `/species/:speciesId`                                                       | **species-detail** |
| 종 수정   | `/species/:speciesId/edit`                                                  | species-form       |
| 개체 등록 | `/species/:speciesId/individuals/create`                                    | individual-form    |
| 개체 상세 | `/species/:speciesId/individuals/:individualId`                             | individual-detail  |
| 개체 수정 | `/species/:speciesId/individuals/:individualId/edit`                        | individual-form    |
| 관찰 상세 | `/species/:speciesId/individuals/:individualId/observations/:observationId` | observation-detail |
| 관찰 수정 | `…/observations/:observationId/edit`                                        | observation-edit   |

- `/species/:speciesId` → 이 화면. 읽기 전용 상세다.
- 들어오는 길: 종 목록 행 클릭, 종 수정 저장 성공·종 수정 뒤로가기(`species-form`),
  개체 등록 성공·개체 등록 뒤로가기(`individual-form`), 개체 상세 뒤로가기·개체 상세 삭제 성공(`individual-detail`).
- 나가는 길: `뒤로가기` → `/species` / 카드 케밥 `수정` → `/species/:speciesId/edit` / 종 삭제 성공 → `/species` /
  `개체 등록하기` → `/species/:speciesId/individuals/create` / 행 클릭 → `/species/:speciesId/individuals/:individualId` /
  행 케밥 `수정` → `/species/:speciesId/individuals/:individualId/edit`.
- 진입 시 항상 검색어가 비어 있고 기본 최신순 1페이지에서 시작한다.

## 동작 (behavioral spec — source of truth)

### 조회

- `/species/:speciesId` 진입 → `뒤로가기`, 프로필 카드, 개체 섹션 헤더, 개체 표 1페이지가 보인다.
- 불러오는 중 → `종 정보를 불러오는 중입니다.` 를 표시한다(`TaskDetailPage` 패턴).
- 없는 `speciesId`(삭제된 종 포함) → `종을 찾을 수 없습니다.` 와 `목록으로 돌아가기`(→ `/species`) 링크를 표시한다
  (기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴(`<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크). 종의 부모는 목록이라 기존 문구 `목록으로 돌아가기` 를 그대로 쓴다).

### 뒤로가기

- `뒤로가기` 클릭 → `/species` 로 이동한다. 편집이 없으므로 이탈 확인은 없다.

### 프로필 카드

- 좌측에 대표 사진 1장, 우측에 제목·부제·정보 6항목을 표시한다. 편집 컨트롤은 없다.
- 제목은 국명이다(예: `카피바라`).
- 부제는 `{분류군} · {학명}` 이다(예: `포유류 · Hydrochoerus hydrochaeris`).
- 정보는 2열 3행이다 — 왼쪽 열 `국명` / `분류군` / `영문명`, 오른쪽 열 `학명` / `법정지정분류` / `세부분류`.
- 분류군 라벨: `MAMMAL` 포유류 / `REPTILE` 파충류 / `BIRD` 조류 / `FISH` 어류.
- `분류군` 값은 `{분류군 라벨} · {세부 분류의 ' - ' 를 ' · ' 로 바꾼 값}` 이다(예: 세부 분류 `설치목 - 천축서과` → `포유류 · 설치목 · 천축서과`, Figma `58:8717` 값) (2026-09-15 개발자 결정).
  세부 분류가 비면 분류군 라벨만 보인다(예: `조류`).
- `세부분류` 값은 세부 분류를 ` - ` 로 나눈 **마지막 조각**이다(예: `천축서과`). 세부 분류가 비면 `—` 를 보인다 (2026-09-15 개발자 결정).
- `법정지정분류` 값은 항목마다 뱃지 1개다. 여러 개면 저장 순서대로 가로로 나열하고, 넘치면 줄바꿈한다(뱃지 간격은 ⑦ 육안 확인).
- `법정지정분류` 가 비면 값 자리에 `—` 를 보인다(`세부분류` 빈 값 표기와 같다).

### 카드 케밥 메뉴

- 카드 우상단 `⋮` 클릭 → `수정` / `삭제` 두 항목이 열린다(Figma `157:11428`).
- 메뉴 바깥 클릭 또는 `Escape` → 메뉴가 닫힌다. `Escape` 로 닫으면 초점이 `⋮` 로 돌아온다.
- `수정` 클릭 → 메뉴가 닫히고 `/species/:speciesId/edit` 로 이동한다.
- `삭제` 클릭 → 메뉴가 닫히고 종 삭제 확인 모달이 열린다.
- 카드 케밥과 행 케밥을 합쳐 화면에서 동시에 하나의 메뉴만 열린다.

### 종 삭제

- 종 삭제 확인 모달(Figma `158:11676`): 제목 `정말 삭제하시겠습니까?`,
  본문 `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`, 버튼 `취소` / `확인`.
- `취소` 또는 `Escape` → 모달이 닫히고 아무것도 삭제되지 않는다. 초점이 카드 `⋮` 로 돌아온다.
- `확인` → 종과 그 종의 개체(관찰 기록 포함)를 삭제하고 `/species` 로 이동한다.
  종 목록이 `데이터 삭제에 성공했습니다` 토스트를 띄운다(토스트 표시는 `species-list` 소유).
- 삭제 실패 → 모달을 닫고 이 화면에 `데이터 삭제에 실패했습니다` 토스트를 띄운다. 화면은 그대로 둔다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

### 개체 섹션 헤더

- 제목 `개체` 옆에 `N마리` 를 표시한다. `N` 은 이 종에 등록된 **전체** 개체 수이며 검색어와 무관하다(Figma `개체 3마리` 는 전체 수).
- 개체를 삭제하면 `N` 이 바로 줄어든다.
- `개체 등록하기` 클릭 → `/species/:speciesId/individuals/create` 로 이동한다.

### 개체 표

- 컬럼은 `이름` / `성별` / `출생연도` 세 개와 헤더 없는 케밥 열이다.
- `이름` 은 개체명, `성별` 은 성별 뱃지(`♂ 수컷` / `♀ 암컷` / `? 미상`), `출생연도` 는 `{YYYY}년`(예: `2019년`)이다.
- 행 순서는 **기본 최신순**(최근 등록 = 개체 id 큰 순, 종 1 은 두리 → 미미 → 동식이)이다. 서버가 준 순서를 그대로 쓰고 정렬 버튼은 두지 않는다(API 연동 2026-09-16 개발자 결정: 정렬 제거).
- 한 페이지는 10행이다(`task-list` 결정 승계. Figma 는 3행만 그렸다).
- 페이지 번호 클릭 → 해당 페이지 행으로 바뀐다. `이전 페이지` / `다음 페이지` 는 한 페이지씩 이동하고,
  1페이지에서 `이전 페이지`, 마지막 페이지에서 `다음 페이지` 는 비활성이다.
- 결과가 한 페이지 이하면 페이지네이션을 숨긴다.
- 행 본문 클릭(또는 초점 후 `Enter` / `Space`) → `/species/:speciesId/individuals/:individualId` 로 이동한다.

### 검색

- 표 헤더 아래 검색바 placeholder 는 `개체이름 또는 국명을 입력해주세요` 다(Figma 그대로).
- 입력 → 개체명에 입력값(앞뒤 공백 제거)이 포함된 개체만 남기고 목록을 1페이지로 리셋한다(검색 대상은 개체명 — 결정 사항).
- 검색어를 모두 지우면 → 전체 개체가 다시 보인다.
- 개체는 있지만 검색 결과가 없으면 → 행 대신 `검색결과가 없습니다` 한 줄을 표시하고 페이지네이션을 숨긴다
  (tokens.ts `textFaint` 주석의 기존 문구).

### 빈 상태 (개체 0마리)

- 개체가 0마리인 종 → 섹션 헤더가 `0마리` 이고, 검색바는 그대로 보이며, 표 본문에
  `등록된 개체가 없습니다` / `오른쪽 위 [개체 등록하기]로 첫 개체를 추가해주세요` 두 줄을 표시한다. 페이지네이션은 없다(Figma `71:8796`).
- 0마리일 때는 검색어를 입력해도 같은 빈 상태 문구를 유지한다(검색할 개체 자체가 없다).
- 마지막 개체를 삭제해 0마리가 되면 → 같은 빈 상태로 바뀐다.

### 행 케밥 메뉴

- 행 우측 끝 `⋮` 클릭 → 그 행의 메뉴가 열리고 `수정` / `삭제` 두 항목이 보인다.
- 다른 행(또는 카드)의 `⋮` 클릭 → 이전 메뉴가 닫히고 새 메뉴가 열린다.
- `⋮` 클릭은 행 클릭 이동을 발생시키지 않는다.
- 메뉴 바깥 클릭 또는 `Escape` → 메뉴가 닫힌다. `Escape` 로 닫으면 초점이 해당 `⋮` 로 돌아온다.
- `수정` 클릭 → 메뉴가 닫히고 `/species/:speciesId/individuals/:individualId/edit` 로 이동한다.
- `삭제` 클릭 → 메뉴가 닫히고 개체 삭제 확인 모달이 열린다.

### 개체 삭제

- 개체 삭제 확인 모달: 제목 `정말 삭제하시겠습니까?`, 본문 `등록된 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`,
  버튼 `취소` / `확인`(`individual-detail` 모달 `610:14119` 문구 승계 — 종 상세 프레임 없음).
- `취소` 또는 `Escape` → 모달이 닫히고 행이 그대로 남는다. 초점이 그 행의 `⋮` 로 돌아온다.
- `확인` → 해당 개체를 삭제하고 모달을 닫는다. 행이 사라지고 섹션 헤더 `N마리` 가 줄며
  `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- 삭제로 현재 페이지가 비면 마지막으로 남은 페이지로 되돌린다(`task-list` 보정 승계).
- 삭제 실패 → 모달을 닫고 `데이터 삭제에 실패했습니다` 토스트가 뜬다. 행은 그대로 둔다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

### 토스트

- 이 화면에서 뜨는 토스트는 세 가지다.
  - `데이터 삭제에 성공했습니다` (성공) — 개체 행 삭제 성공, 또는 개체 상세에서 개체를 삭제하고 이 화면으로 돌아온 경우
  - `데이터 삭제에 실패했습니다` (실패) — 종 삭제 실패, 개체 행 삭제 실패
  - `데이터 생성에 성공했습니다` (성공) — 개체 등록에 성공해 이 화면으로 돌아온 경우
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
- 이 화면이 받는 state: `create-success`(개체 등록 성공, `individual-form`), `delete-success`(개체 상세 삭제 성공, `individual-detail`).
- 종 삭제 성공 토스트는 이 화면이 아니라 `/species` 에서 뜬다(`navigate('/species', { state: { toast: 'delete-success' } })`).
- 표시 시간은 3초, 동시 1개다.
- 종 수정 저장 성공으로 돌아왔을 때는 토스트를 띄우지 않는다(결정 사항).

## 화면 구조와 시각 규격

1920px 데스크톱 기준(프레임 높이 1264, 빈 상태 1164). 본문 너비 1320px, 좌우 중앙 정렬. 페이지 배경 `colors.background`.
좌상단 메뉴 버튼(`36×36 @36,32`)은 기존 사이드바를 재사용한다.
Figma 일부 텍스트가 `Inter` 로 지정돼 있지만 기존 `font.body` 로 둔다(글꼴 정리는 범위 밖).

1. 뒤로가기(`back` `1:10470`, 인스턴스 `58:8804`, `@300,75` 1320×36): chevron 36px + `뒤로가기` 24px SemiBold
   `colors.textGuide`, gap 10px. 기존 `BackLink` 재사용.
2. 프로필 카드(`species basic info` `1191:14902`, 인스턴스 `1191:14978`, `@300,144` 1320×340):
   배경 `colors.surface`, radius 20px, padding 40px, 사진↔정보 gap 40px.
   - 사진 260×260, radius 20px, `object-fit: cover`.
   - 정보 열(폭 940, 세로 gap 22px):
     - 제목 블록(gap 10px): 국명 40px Medium `colors.text`.
       부제 행(gap 12px): 분류군 24px Medium `colors.textGuide` + 점 4×4 원 `colors.textFaint` + 학명 24px Medium `colors.textGuide`.
     - 정보 3행. 행마다 2열, 열 gap 24px(열 폭 458). 항목은 라벨(폭 118, 20px Medium `colors.textGuide`) + gap 16px +
       값(22px Medium `#5C5C68` — 신규 토큰 `color.textValue`), 세로 가운데 정렬.
     - 법정지정분류 뱃지: padding 6/16px, radius 100px, 배경 `colors.warningBg`(`#FFE8C3`),
       글자 18px Medium `#8A5A00`(신규 토큰 `color.warningText`).
   - 케밥(`kebab` `39:8668`, 인스턴스 `1197:14842`): 카드 기준 `@1236,40`(페이지 `@1536,184`) 44×52,
     아이콘 32px `#848491`(`colors.textGuide`). 카드 우측 padding 40 안쪽 우상단.
3. 카드 케밥 메뉴(`kebab menu` `141:9597` › `수정·삭제` `39:8908`, 인스턴스 `157:11656`, `@1440,244` 180×116):
   우측 끝이 카드 우측 끝(x=1620)에 맞고, 케밥 하단(y=236)에서 8px 아래다.
   흰 배경, 테두리 1px `colors.tableHeaderStrong`, radius 12px, drop-shadow `0 8px 12px rgba(0,0,0,0.14)`,
   padding 8px 0, 항목 gap 4px, 항목 높이 48(padding 12/20px).
   - `수정` — 20px Medium `colors.textStrong`
   - `삭제` — 20px Medium `colors.danger`
4. 섹션 헤더(`section header` `127:9419` › `with button` `127:9297`, 인스턴스 `129:9447`, `@300,544` 1320×56 —
   카드 하단에서 60px): `개체` 28px Medium `colors.textStrong` + gap 12px + `N마리` 20px Medium `colors.textGuide`,
   세로 가운데. 우측 끝 `+ 개체 등록하기` — 배경 `colors.textStrong`, radius 53px, padding 12/16px,
   아이콘 32px + 라벨 24px SemiBold `colors.surface`, gap 8px. 기존 `LinkButton` 재사용.
   빈 상태 인스턴스는 variant `with button (empty)`(`130:9540`)이며 `0마리` 외 규격이 같다.
5. 개체 표(`individual list` `130:9534` › `default` `127:9160`, 인스턴스 `129:9365`, `@300,624` 1320×520 —
   섹션 헤더 하단에서 24px):
   - 카드 테두리 1px `colors.border`(`#A1A1A1`), radius 20px, 배경 `colors.surface`.
   - 헤더행 높이 52, 배경 `colors.tableHeaderStrong`, 글자 20px `colors.textStrong`, 셀 padding-left 40px.
     Figma 는 `이름` 만 SemiBold, 나머지 Medium 이다 — Medium 으로 통일한다(`DataTable` 헤더 단일 굵기).
   - 컬럼은 **고정폭**이다.

   | 컬럼       | x    | 폭  |
   | ---------- | ---- | --- |
   | 이름       | 0    | 520 |
   | 성별       | 520  | 300 |
   | 출생연도   | 820  | 420 |
   | 액션(케밥) | 1240 | 80  |
   - 검색바(`@39,75` 1240×50 — 헤더 하단에서 24px): 배경 `colors.background`, radius 44px, padding 12/16px,
     검색 아이콘 26px `#AFAFBA` + gap 8px + placeholder 20px Medium `colors.textFaint`.
     우측 슬라이더 아이콘 26px `#AFAFBA` → 기존 `DataTable.sort` 버튼(`filter.svg` 22×20)으로 렌더한다(크기 차이는 ⑦ 육안 확인).
   - 본문 행 높이 92, 첫 행 `@y=133`(검색바 하단에서 8px). 셀 padding 11/40px.
     `이름` 24px Medium `colors.textStrong`, `출생연도` 22px Medium `colors.textGuide`. 액션 셀(폭 80) 가운데에 케밥 44×52.
   - 행 구분선 1px `colors.textGuide`(`#848491`), 좌우 inset 40px(Figma x=39, 폭 1240).
     Figma 행 y 가 133 / 233 / 341 로 간격이 불균일하다(그리기 오차) → 행 높이 92 + 구분선으로 균일하게 둔다.
   - 페이지네이션은 **카드 안쪽** 하단 가운데(`@547,463`): chevron 28px, 번호 32×32 radius 24px, 번호 간 gap 20px,
     chevron↔번호그룹 gap 16px. 활성 22px `colors.accent` + 배경 `colors.accentBg`, 비활성 18px `colors.pageMuted`.
     Figma 는 `1 2 3` 중 `2` 활성으로 그린 예시다.
   - 카드 높이 520 은 3행 기준이다. 10행이면 카드가 그만큼 늘어난다.
6. 성별 뱃지(`individual / 성별 뱃지` `161:11782`): pill, 높이 36(padding 6px + 글자 20px 줄높이 24 — `individual-detail` 과 같은 값),
   padding 6/16px, radius 100px, 기호↔라벨 gap 6px, 20px.
   기호(`♂` `♀` `?`)는 Regular, 라벨은 Medium.
   - 수컷(`161:11771`) — 배경 `colors.accentBg`(`#E8E9FF`), 글자 `colors.accent`(`#4952FF`)
   - 암컷(`161:11776`) — 배경 `colors.dangerBg`(`#FFCECE`), 글자 `colors.danger`(`#FF3131`)
     (컴포넌트 설명은 "분홍" 이지만 값은 위와 같다)
   - 미상(`161:11781`) — 배경 `colors.background`(`#F5F5F7`), 글자 `colors.textGuide`(`#848491`)
7. 빈 상태(`individual list` › `empty` `130:9533`, 인스턴스 `130:9541`, 1320×420): 헤더행·검색바는 기본과 같다.
   검색바 하단에서 24px 아래(`@y=149`) 높이 240 영역 가운데에 두 줄, 줄 간격 12px:
   - `등록된 개체가 없습니다` — 22px Medium `colors.optionMuted`(`#9999A5`)
   - `오른쪽 위 [개체 등록하기]로 첫 개체를 추가해주세요` — 18px Medium `colors.textFaint`(`#AFAFBA`)
8. 종 삭제 확인 모달(`609:14119`, 인스턴스 `158:11683`): 딤 `rgba(0,0,0,0.5)` 화면 전체,
   카드 600×300 화면 중앙(`@660,354`), radius 20px, 흰 배경.
   - 원형 아이콘 48×48 `@276,43` — 배경 `colors.dangerBg`, `!` 32px `colors.danger`
   - 문구 블록 `@40,103` 폭 520, gap 12px, 가운데 정렬: 제목 28px Medium `colors.text`, 본문 2줄 20px Medium `colors.textGuide`
   - 버튼 100×48 radius 8px, `@y=216`, 간격 16px: `취소` `@192`(테두리 1px `colors.textGuide`, 글자 20px Medium `colors.textGuide`) /
     `확인` `@308`(배경 `colors.text`, 글자 20px SemiBold `colors.surface`)
   - 기존 `DeleteConfirmationDialog` 와 다른 점: 본문 문구, 제목 weight(기존 600), 취소 버튼 테두리·글자색
     (기존 `dialogBorder`·`text`), 최소 높이(기존 309). 문구 외 시각 차이는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다.
9. 개체 삭제 확인 모달: 8번과 같은 규격, 본문 첫 줄만 `등록된 관찰 기록도 함께 삭제되며`(`610:14119` 참고).
10. 토스트: 기존 `Toast`(우상단, 440 폭, 성공 아이콘 `colors.success`, 실패 아이콘 `colors.danger`). 개체관리 토스트 프레임
    (`71:8888`)은 `species-list` 소유이므로 이 spec 에서는 미검증이다.

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.

### 신규 semantic color 토큰 (게이트 ② 추가 확정)

| 값 | 토큰 | 용도 | 쓰는 spec |
| --- | --- | --- | --- |
| `#70707D` | `color.choiceMuted` | pill 미선택 글자(분류군·법정지정분류·성별). 기존 `optionMuted` 와 나란한 이름 | species-form, individual-form |
| `#5C5C68` | `color.textValue` | 종 상세 프로필 카드 정보 값 글자 | species-detail |
| `#8A5A00` | `color.warningText` | 법정지정분류 뱃지 글자(배경 `warningBg` 위) | species-detail |

- 드롭존 점선 테두리(Figma `#5C5C68`, `upload file` `1:10511`)에는 새 토큰을 만들지 않고 기존 업무 폼 구현(`AttachmentField` 드롭존 `colors.textGuide`)을 유지한다(확정).

나머지 색(`#848491` `#36363F` `#FFCECE` `#FF3131` `#E8E9FF` `#4952FF` `#F5F5F7` `#DDDDE3` `#AFAFBA` `#A1A1A1`
`#C6C6CE` `#000000` `#FFE8C3` `#9999A5`)은 `tokens.ts` 에 이미 있다. 토큰 이름은 개체관리 7개 spec 이 위 표 하나로 맞췄고 게이트 ② 에서 추가를 확정했다(2026-09-15).

## 데이터

```ts
// entities/species — species-list spec 이 소유한다(여기서는 조회·삭제만 쓴다)
type TaxonGroup = 'MAMMAL' | 'REPTILE' | 'BIRD' | 'FISH' // 포유류 / 파충류 / 조류 / 어류
interface Species {
  id: string
  koreanName: string // 국명
  englishName: string // 영문명
  scientificName: string // 학명
  taxonGroup: TaxonGroup // 분류군
  subClassification?: string // 세부 분류 (선택, 형식 `{목} - {과}` 예: `설치목 - 천축서과`)
  legalDesignations: string[] // 법정지정분류 (복수, 선택)
  photo: { fileName: string; fileKey: string; url: string } // 대표 사진 1장
  individualCount: number // 마리수 — 개체 수에서 파생
}

// entities/individual — 이 spec 이 소유한다
type IndividualSex = 'FEMALE' | 'MALE' | 'UNKNOWN' // 암컷 / 수컷 / 미상
interface Individual {
  id: string
  speciesId: string
  name: string // 개체명 (필수)
  sex: IndividualSex // 성별 (필수)
  birthYear: number // 출생연도 (필수, 4자리)
  note?: string // 기타정보 (선택)
  photo: { fileName: string; fileKey: string; url: string } // 대표 사진 1장 (필수)
}
```

- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- query key: 종 `['species', speciesId]`(species-list 명세), 개체 목록 `['individuals', 'list', { speciesId }]`, 개체 단건 `['individuals', individualId]`.
  개체 생성·수정·삭제 뒤 `['individuals']`·`['species']`(마리수 파생)를 무효화하고, 개체 삭제는 `['observations']` 도 무효화한다.
  종 삭제 뒤에는 `['species']`·`['individuals']`·`['observations']` 를 무효화한다.
- 섹션 헤더 `N마리` 는 개체 목록(검색 전) 길이로 계산한다. `Species.individualCount` 를 이 화면에서 따로 쓰지 않는다.
- 검색어·정렬·페이지 번호·열린 케밥 id(카드 포함)·삭제 대상(종 또는 개체 id)·화면 내 토스트는 페이지가 소유하는 로컬 상태다.
  전역 상태로 올리지 않는다. 검색·정렬·페이지 슬라이싱은 클라이언트에서 한다.
- 분류군·세부분류 표시 문자열은 `entities/species/model` 의 순수 함수(예: `formatTaxonGroupLine(species)`, `lastSubClassification(value)`)로 만든다.

### 개체 mock (`src/entities/individual/model/mock.ts`)

> API 연동(2026-09-17)으로 앱 mock 은 제거했다. 아래 데이터는 e2e 가짜 서버(`tests/e2e/support/animal-manage-api.ts`)가 그대로 준다.
> 섹션 헤더 마리수는 검색 결과 수가 아니라 종 상세의 `animalCount` 다.

공통 fixture(개체 1~3)에 페이지네이션·성별 `미상` 확인용 행과 `species-list` 종 mock(13종)의 나머지 종 개체를 더해
**총 26건**이다. 종 2(플라밍고)가 12마리라 2페이지(10 + 2)가 나온다. **종 `13` 피라냐만 0마리**다(빈 상태 확인용,
`species-list` mock 과 합의). 사진 `photo` 는 개체마다 `fileName` 이 다르다 — 개체 1 `동식이_2026.jpg`, 나머지 `{name}_2026.jpg`,
`fileKey` 는 `mock-individual-{id}`, `url` 은 ③에서 정한 공용 에셋 1장이다(이미지 바이트 공유 가능).

| id  | speciesId | name   | sex     | birthYear | note                          |
| --- | --------- | ------ | ------- | --------- | ----------------------------- |
| 1   | 1         | 동식이 | MALE    | 2019      | `알락꼬리여우원숭이와 합사 중` |
| 2   | 1         | 미미   | FEMALE  | 2020      | —                             |
| 3   | 1         | 두리   | MALE    | 2021      | —                             |
| 4   | 2         | 핑키   | FEMALE  | 2016      | —                             |
| 5   | 2         | 노을   | MALE    | 2016      | —                             |
| 6   | 2         | 산호   | FEMALE  | 2017      | —                             |
| 7   | 2         | 체리   | UNKNOWN | 2018      | —                             |
| 8   | 2         | 연지   | FEMALE  | 2018      | —                             |
| 9   | 2         | 자몽   | MALE    | 2019      | —                             |
| 10  | 2         | 딸기   | FEMALE  | 2019      | —                             |
| 11  | 2         | 봄비   | UNKNOWN | 2020      | —                             |
| 12  | 2         | 새벽   | MALE    | 2021      | —                             |
| 13  | 2         | 복숭아 | FEMALE  | 2022      | —                             |
| 14  | 2         | 분홍이 | MALE    | 2022      | —                             |
| 15  | 2         | 홍시   | UNKNOWN | 2023      | —                             |
| 16  | 3         | 반달이 | MALE    | 2015      | —                             |
| 17  | 3         | 곰순이 | FEMALE  | 2017      | —                             |
| 18  | 4         | 럭키   | MALE    | 2018      | —                             |
| 19  | 5         | 망고   | FEMALE  | 2020      | —                             |
| 20  | 6         | 레오   | MALE    | 2019      | —                             |
| 21  | 7         | 느림보 | UNKNOWN | 2012      | —                             |
| 22  | 8         | 용용   | MALE    | 2021      | —                             |
| 23  | 9         | 볼리   | FEMALE  | 2020      | —                             |
| 24  | 10        | 파랑이 | UNKNOWN | 2014      | —                             |
| 25  | 11        | 뒤뚱이 | MALE    | 2022      | —                             |
| 26  | 12        | 주황이 | UNKNOWN | 2024      | —                             |

- 종별 마리수: 1 → 3 · 2 → 12 · 3 → 2 · 4~12 → 각 1 · **13 → 0**. `species-list` 목록 마리수 셀이 이 값과 같아야 한다.
- 종 1 카피바라는 3마리다(Figma 종 목록의 `4` 는 따르지 않는다 — 결정 사항).
- mock 함수(이 spec 이 소유한다):
  - `getMockIndividuals(speciesId): Promise<Individual[]>` — 그 종의 개체를 id 오름차순으로 준다(표시 정렬은 페이지가 한다). 삭제된 개체와 **삭제된 종의 개체는 제외**한다.
  - `getMockIndividual(individualId): Promise<Individual | null>` — `individual-detail` / `individual-form` / `observation-edit` 이 쓴다. 없는 id, **삭제된 개체, 삭제된 종에 속한 개체**는
    모두 `null` 이다(`getMockIndividuals` 와 같은 제외 규칙). observation mock 은 이 `null` 로 관찰 연쇄 삭제를 판정한다.
  - `createMockIndividual(input: CreateIndividualInput): Promise<Individual>` / `updateMockIndividual({ id, input }: { id: string; input: UpdateIndividualInput }): Promise<Individual>`
    — `individual-form` 이 쓴다. 입력 형태는 `individual-form` spec 이 정한다. 생성 id 는 기존 최대 id + 1 의 숫자 문자열이다(기본 최신순이라 새 개체가 1페이지 첫 행에 놓인다). 새 사진은 mock 이 `fileKey`·`url` 을 발급한다.
  - `deleteMockIndividual(individualId): Promise<void>` — 삭제 id 를 `deletedIndividualStorageKey` 에 기록한다(`work-log` / `resource` mock 패턴).
    개체 상세(`individual-detail`)와 종 상세 행 삭제가 같은 함수를 쓴다. 그 개체의 관찰 기록은 `individual-detail` 이 명세하는
    observation mock 이 조회에서 뺀다(모달 문구 `등록된 관찰 기록도 함께 삭제되며` — 아래 연쇄 삭제).
- localStorage 키 상수(`resource` mock 패턴, 실제 API 연동 시 제거):
  - `individualStorageKey = 'toyvillage:individuals'` — 생성·수정한 개체 저장.
  - `deletedIndividualStorageKey = 'toyvillage:individuals:deleted'` — 삭제된 개체 id 목록.
  - `individualFailStorageKey = 'toyvillage:individuals:fail'` — 값 `'delete'` | `'create'` | `'update'` 를 넣으면 다음 해당 요청이 한 번 실패한다
    (`resource` mock 의 `toyvillage:resources:fail` 패턴. `create`·`update` 는 `individual-form` 이 쓴다).
- 연쇄 삭제(mock, 개체관리 공통): 연쇄 삭제 기록을 따로 쓰지 않고 조회에서 뺀다. `getMockIndividuals` / `getMockIndividual` 은 삭제된 개체와
  삭제된 종(`getMockSpecies(speciesId)` 가 `null`)의 개체를 빼고(`null`), `getMockObservations` / `getMockObservation` 은 소속 개체가 없는
  (`getMockIndividual(individualId)` 가 `null`) 관찰을 뺀다(`null`). entities → entities import 는 ESLint 가 허용한다. 실제 연쇄 삭제는 서버 책임이다.
- 종 조회·삭제는 `species-list` 가 명세하는 `entities/species/model/mock.ts` 의 `getMockSpecies(id): Promise<Species | null>`,
  `deleteMockSpecies(id)` 를 쓴다(삭제 기록 `toyvillage:species:deleted`, 실패 주입 `toyvillage:species:fail` = `delete`).
  분류군 라벨은 `entities/species/model/labels.ts` 의 `taxonGroupLabels` 를 쓴다.
  종 목록의 `individualCount` 는 이 mock 의 개수에서 파생한다(두 spec 이 같은 규칙을 적는다).

## 컴포넌트 구조/props

- `SpeciesDetailPage` — `/species/:speciesId` 페이지(`src/pages/species`). 검색·정렬·페이지·케밥·삭제 모달·토스트 상태 소유.
- `BackLink { to }`(`src/shared/ui`) — 기존 재사용. `to="/species"`.
- `SpeciesProfileCard { species, action }` — **신규**(`src/entities/species/ui`). Figma `species basic info`(`1191:14902`).
  사진(`photo.url`, alt `{국명} 사진`) + 제목·부제 + 정보 6항목. 우상단 케밥은 `action: ReactNode` 로 받는다(메뉴 상태는 페이지 소유).
- `LegalDesignationBadge { label }` — **신규**(`src/entities/species/ui`). 법정지정분류 표시 뱃지.
  폼의 추가·제거 chip(`LegalDesignationField`, `species-form` 소유)과 다르다.
- `SectionHeader { title, count?, unit?, action? }` — 공용(`src/shared/ui`). develop 의 `feed-detail` 이 먼저 만든
  `{ title, count }` 에 `unit`·`action` 을 더했다(2026-09-15 develop 병합 시 개발자 결정).
  Figma `section header`(`127:9419`). 종 상세(개체)와 개체 상세(관찰)에 같은 인스턴스가 있어 2곳 이상이다.
  `title` 은 `h2`, 건수는 제목과 형제 텍스트(`count` + `unit`, 여기서는 `unit="마리"`), `action` 은 우측 버튼 슬롯이다.
- `LinkButton { to, children }`(`src/shared/ui`) — 기존 재사용. `개체 등록하기`.
- `IndividualTable { individuals, onRowClick, search, sort, pagination, emptyLabel, renderRowAction }` — **신규**
  (`src/entities/individual/ui`). `DataTable` 조합(`WorkLogTable` / `TaskTable` 패턴).
- `IndividualSexBadge { sex }` — **신규**(`src/entities/individual/ui`). Figma `individual / 성별 뱃지`(`161:11782`).
- `DataTable`(`src/shared/ui`) — 기존 재사용. `appearance`: `offsetTop: 24`, `headerBackground: 'tableHeaderStrong'`,
  `dividerColor: 'textGuide'`, 나머지는 기본값(테두리 있음 · 헤더 52 · 행 92 · inset 40 · 페이지네이션 안쪽).
  - **shared API 변경(게이트 ② 채택)**: `emptyLabel: string` → `ReactNode` 허용(두 줄 빈 상태). 기존 호출부는 문자열 그대로 호환된다.
  - 헤더 글자색(기존 `colors.text` ↔ Figma `textStrong`)·검색 아이콘 크기(20 ↔ 26px)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다.
- `KebabMenu { open, onOpenChange, items, ariaLabel }`(`src/shared/ui`) — **기존 재사용 + 보강**(shared API 변경, 게이트 ② 채택).
  근거: 개체관리 케밥 메뉴(`39:9000`·`157:11656`·`157:11661`)가 모두 component set `141:9597` 이고 `KebabMenu` 가 그 set 의 구현이다
  (테두리 `tableHeaderStrong` · padding 8/0 · gap 4 · 항목 h48 · 32px `kebab.svg` `#848491` 일치).
  보강(개체관리 케밥 공통): ① `Escape` 로 닫을 때 초점을 트리거 `⋮` 로 되돌린다, ② 트리거 ref 를 노출한다
  (`onTriggerRef` — 삭제 모달이 닫힌 뒤 초점 복귀용), ③ 배치 옵션 — 메뉴를 트리거 하단 8px·우측 끝 정렬로 둔다
  (현재는 가장 가까운 positioned 조상의 `top: 0; right: 0`). 그림자 blur(기존 24px ↔ Figma 12px)는 기존 값을 유지하고 ⑦ 육안 확인에서 판단한다.
  `features/row-actions` 의 `RowActionMenu` 는 사용하지 않는다(통합은 범위 밖).
  - 행 메뉴는 카드 테두리 1px 보정(`species-list` 실측)을 더해 같은 배치를 쓴다.
- `DeleteConfirmationDialog { pending, onCancel, onConfirm, description? }`(`src/shared/ui`) — **기존 재사용 + `description?: ReactNode` 추가**
  (shared API 변경, 게이트 ② 채택 — 미지정 시 기존 문구). 개체관리 문구: 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`
  (Figma `609:14119`), 개체 삭제 `등록된 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`(Figma `610:14119`), 관찰 삭제 기본 문구(프레임 없음).
- `Toast { variant, message, onDismiss }`(`src/shared/ui`) — 기존 재사용.

## 접근성

- 국명 제목은 페이지의 `h1`, 섹션 `개체` 는 `h2` 다.
- 프로필 정보 6항목은 라벨과 값을 프로그램적으로 연결한다(`dl`/`dt`/`dd`).
- 사진의 대체 텍스트는 `{국명} 사진` 이다. 부제의 점은 장식이므로 `aria-hidden` 이다.
- `⋮` 버튼은 `aria-haspopup="menu"` 와 `aria-expanded` 를 제공하고, 접근 가능한 이름에 대상을 포함한다
  (카드 `{국명} 종 메뉴 열기`, 행 `{개체명} 개체 메뉴 열기`). 메뉴는 `role="menu"`, 항목은 `role="menuitem"`,
  `Escape` 로 닫히고 초점이 `⋮` 로 돌아온다.
- 검색 입력의 접근 가능한 이름은 `개체 검색`다.
- 각 행은 키보드로 활성화 가능하며(`Enter` / `Space`) 접근 가능한 이름에 개체명을 포함한다.
- 성별 뱃지의 기호(`♂` `♀` `?`)는 `aria-hidden` 이고 텍스트 라벨로 값을 전달한다. 법정지정분류 뱃지도 텍스트로 전달한다.
- 빈 상태·검색 결과 없음은 `role="status"` 로 알린다.
- 삭제 확인 모달은 열릴 때 초점을 가두고, 닫히면 초점을 호출한 `⋮` 로 되돌린다.
- 페이지네이션 버튼은 `이전 페이지` / `다음 페이지` / `N 페이지` 이름을 제공하고 경계에서 `disabled` 로 표시한다.
- 토스트는 `role="status"`(성공) / `role="alert"`(실패)로 알린다.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- 980px 이하에서는 프로필 카드를 세로로 쌓고(사진 위, 정보 아래) 정보 2열을 1열로 접으며 카드 padding 을 줄인다.
- 표는 좁은 화면에서 가로 스크롤을 허용하되 페이지 전체가 가로 스크롤되지 않게 한다.
- 섹션 헤더의 `개체 등록하기` 는 좁은 화면에서도 제목과 같은 줄 우측에 두고, 넘치면 줄바꿈한다.
- 컨트롤의 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

개체 표 기본 정렬은 최신순(id 큰 순)이다.

- S1: `/species/1` 진입 → `뒤로가기`, 제목 `카피바라`, 부제 `포유류 · Hydrochoerus hydrochaeris`, 정보 6항목 라벨,
  `개체 3마리`, 표 3행(두리 → 미미 → 동식이)이 보인다.
- S2: 표 컬럼이 `이름` `성별` `출생연도` 이고 1행 값이 `두리` / `수컷` / `2021년` 이다.
- S3: 종 2 진입 → 성별 뱃지에 `수컷` / `암컷` / `미상` 이 구분돼 보인다.
- S4: 종 3 진입 → 법정지정분류 뱃지 `멸종위기 야생생물 I급` / `천연기념물` 두 개가 보인다.
- S5: `뒤로가기` 클릭 → `/species` 로 이동한다(확인 없음).
- S6: `개체 등록하기` 클릭 → `/species/1/individuals/create` 로 이동한다.
- S7: 행 본문 클릭 → `/species/1/individuals/:individualId` 로 이동한다.
- S8: 검색어 `미미` 입력 → `미미` 행만 남고 섹션 헤더는 `개체 3마리` 그대로다.
- S9: 종 2(12마리) 진입 → 10행이 보이고, `2 페이지` 클릭 → 남은 2행으로 바뀐다.
- S10: 카드 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열린다.
- S11: 카드 메뉴 `수정` 클릭 → `/species/1/edit` 로 이동한다.
- S12: 카드 메뉴 `삭제` 클릭 → 본문 `등록된 개체와 관찰 기록도 함께 삭제되며` 인 확인 모달이 열린다.
- S13: 종 삭제 모달 `확인` → `/species` 로 이동하고 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S14: 행 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열리고 행 이동은 일어나지 않는다.
- S15: 행 메뉴 `수정` 클릭 → `/species/1/individuals/:individualId/edit` 로 이동한다.
- S16: 행 메뉴 `삭제` 클릭 → 본문 `등록된 관찰 기록도 함께 삭제되며` 인 확인 모달이 열린다.
- S17: 개체 삭제 모달 `확인` → 행이 사라지고 `개체 2마리` 로 줄며 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S18: 개체 0마리 종(`/species/13`) 진입 → `개체 0마리`, 빈 상태 두 줄, 검색바가 보이고 페이지네이션이 없다.
- S19: 결과가 없는 검색어 입력 → `검색결과가 없습니다` 가 보이고 페이지네이션이 사라진다.
- S20: 종 2 에서 2페이지를 보는 중 검색어 입력 → 1페이지부터 표시된다.
- S21: 종 2 1페이지에서 `이전 페이지`, 마지막 페이지에서 `다음 페이지` 가 비활성이다.
- S22: 행 메뉴가 열린 상태에서 다른 행 또는 카드 `⋮` 클릭 → 이전 메뉴가 닫히고 하나만 열려 있다.
- S23: 메뉴 바깥 클릭 / `Escape` → 메뉴가 닫힌다. `Escape` 면 초점이 `⋮` 로 돌아온다.
- S24: 삭제 모달 `취소` / `Escape` → 모달이 닫히고 화면·행이 그대로 남는다.
- S25: 종 삭제 실패 → 상세 화면에 `데이터 삭제에 실패했습니다` 토스트가 뜨고 화면이 유지된다.
- S26: 개체 삭제 실패 → `데이터 삭제에 실패했습니다` 토스트가 뜨고 행과 `N마리` 가 유지된다.
- S27: 마지막 개체 삭제 → 빈 상태 두 줄과 `개체 0마리` 로 바뀐다.
- S28: 개체 등록 성공으로 돌아오면 → `데이터 생성에 성공했습니다` 토스트가 보인다.
- S29: 개체 상세에서 삭제 후 돌아오면 → `데이터 삭제에 성공했습니다` 토스트가 보인다.
- S30: 없는 `speciesId` 로 진입 → `종을 찾을 수 없습니다.` 와 `목록으로 돌아가기` 링크가 보인다.
- S31: 법정지정분류·세부 분류가 없는 종(종 2) → `분류군` 값은 `조류`, `법정지정분류`·`세부분류` 값 자리에 `—` 가 보인다.
- S32: 키보드만으로 케밥 열기·항목 실행·행 진입·검색·페이지 이동을 수행할 수 있다.
- S33: `/species/1` 프로필 카드 → `분류군` 값 `포유류 · 설치목 · 천축서과`, `세부분류` 값 `천축서과` 가 보인다.

## 결정 사항

- 라우트는 개체관리 공통 라우트 표를 따른다. 종 상세는 읽기 전용이고 수정은 `/species/:speciesId/edit` 다 (2026-09-15 Figma·저장소 근거 판단: 사이드바 활성 판정 `pathname.startsWith(route + '/')`).
- 한 페이지 10행이다 (2026-09-15 Figma·저장소 근거 판단: `task-list` 결정 승계, Figma 는 3행만 그렸다).
- `분류군` 값은 `{분류군 라벨} · {세부 분류의 ' - ' → ' · '}`, `세부분류` 값은 ` - ` 로 나눈 마지막 조각이다. 세부 분류가 비면 분류군 줄은 라벨만, 세부분류 줄은 `—` 다 (2026-09-15 개발자 결정).
- 종 1 fixture 세부 분류는 `설치목 - 천축서과` 다 (2026-09-15 개발자 결정).
- `법정지정분류` 가 비면 `—` 를 보인다 (2026-09-15 Figma·저장소 근거 판단: 같은 개체관리 화면(`individual-detail` 기타정보·첨부)의 빈 값 표기 `—`).
- 섹션 헤더 `N마리` 는 검색과 무관한 전체 개체 수다 (2026-09-15 Figma·저장소 근거 판단: Figma `개체 3마리` 는 전체 수, 검색은 표만 좁힌다).
- 검색 placeholder 는 Figma 그대로 두고 검색 대상은 개체명(부분 일치, 앞뒤 공백 제거, 입력 즉시, 1페이지 리셋)이다 (2026-09-15 Figma·저장소 근거 판단: 종 상세의 개체는 모두 같은 국명이라 국명 검색이 의미 없다).
- 개체 표는 서버 순서(최신순 = id 큰 순)이고 정렬 메뉴는 없다 (API 연동 2026-09-16 개발자 결정: 정렬 제거).
- 빈 상태는 Figma `130:9533` 두 줄 문구, 검색 결과 없음은 `검색결과가 없습니다` 한 줄이다. 0마리 종은 검색어가 있어도 빈 상태 문구를 유지한다 (2026-09-15 Figma·저장소 근거 판단: Figma `71:8796`, tokens.ts `textFaint` 주석).
- 개체 삭제 문구는 `individual-detail`(`610:14119`), 행 메뉴 위치는 `species-list`(`39:8913`) 실측을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 종 상세에는 카드 케밥 열림·종 삭제 모달 프레임만 있다).
- `species basic info`(`1191:14902`) 설명의 "개체 기본정보 카드 … 1320×341" 은 복사 오기로 보고 인스턴스 실측(종 정보, 1320×340)을 따른다 (2026-09-15 Figma·저장소 근거 판단: 인스턴스 `1191:14978` 실측).
- 로딩 `종 정보를 불러오는 중입니다.` 를 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage` 로딩 패턴).
- 없는 id 는 `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크(종 `목록으로 돌아가기` · 개체 `종 상세로 돌아가기` · 관찰 `개체 상세로 돌아가기`)로 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage`·`EditTaskPage` not-found 패턴).
- 삭제 확인 모달은 `DeleteConfirmationDialog` 에 `description?: ReactNode` 를 추가해 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` · 개체 삭제 `등록된 관찰 기록도 함께 삭제되며`(둘째 줄 `삭제 후에는 복구할 수 없습니다`)를 쓰고, 관찰 삭제는 기본 문구를 쓴다 (2026-09-15 Figma·저장소 근거 판단: Figma `609:14119`·`610:14119` 문구, 관찰 삭제 프레임 없음).
- 케밥 메뉴는 `src/shared/ui/KebabMenu` 에 `Escape` 초점 복귀·트리거 ref 노출(`onTriggerRef`)·배치 옵션(트리거 하단 8px·우측 끝 정렬)을 보강해 쓴다 (2026-09-15 Figma·저장소 근거 판단: 케밥 메뉴 set `141:9597` 규격이 `KebabMenu` 와 일치, design-rules §1 같은 INSTANCE 2곳 이상 → 공용).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- 수정 저장 성공 토스트는 띄우지 않고 상세 이동으로 피드백을 대신한다 (2026-09-15 Figma·저장소 근거 판단: `task-edit`·개체관리 Figma 에 수정 성공 토스트가 없다).
- 종·개체 삭제는 모달 문구대로 하위 개체·관찰 기록을 함께 숨긴다. mock 은 조회 제외로 표현하고 실제 삭제는 서버 책임이다 (2026-09-15 Figma·저장소 근거 판단: 삭제 모달 문구 `609:14119`·`610:14119`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 사진 데이터는 `photo: { fileName: string; fileKey: string; url: string }` 이다. 종 1 `카피바라_2026.jpg`, 개체 1 `동식이_2026.jpg` 이고 나머지도 항목마다 다른 파일명을 둔다(이미지 바이트는 공용 에셋 1장 가능) (2026-09-15 Figma·저장소 근거 판단: 저장소 첨부 규약 `{ fileName, fileKey }` + 표시용 `url`, Figma 종 수정 chip `동식이_2026.jpg` 는 복사 오류).
- 신규 토큰 `color.choiceMuted`(`#70707D`)·`color.textValue`(`#5C5C68`)·`color.warningText`(`#8A5A00`)를 추가하고, 드롭존 점선 테두리는 기존 `colors.textGuide` 를 유지한다 (2026-09-15 Figma·저장소 근거 판단: map-tokens 신규 3색, 업무 폼 드롭존은 ⑦ 육안 확인까지 끝난 구현).
- 신규 공용 `SectionHeader`(develop 병합 후 `{ title, count?, unit?, action? }`) 와 `DataTable.emptyLabel: ReactNode` 를 채택한다 (2026-09-15 Figma·저장소 근거 판단: design-rules §1 같은 INSTANCE 2곳 이상(종 상세·개체 상세 `section header`)).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- Figma `Inter` 표기는 무시하고 `font.body` 로 둔다. 표 헤더 weight 는 Medium 으로 통일한다 (2026-09-15 Figma·저장소 근거 판단: 저장소 theme 단일 글꼴, `DataTable` 헤더 단일 굵기).
- 직원 권한별 케밥 숨김은 범위 밖이다 (2026-09-15 Figma·저장소 근거 판단: 웹은 관리자 로그인 전용(Notion `웹 관리자 로그인`), 직원은 앱을 쓴다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

없음. 게이트 ② 에서 이 화면의 미결을 모두 결정했다(2026-09-15). 남은 절차는 시나리오 승인(S1~S33)이다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
