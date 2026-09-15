---
feature: species-list
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 39:8751
  relatedNodeIds:
    - 39:8913
    - 51:8701
    - 71:8888
requires_functional_test: true
paths: src/pages/species, src/entities/species, src/features/sidebar
---

# 개체관리 종 목록 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일: `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 종 목록`(`311:12782`) / `개체관리 · 토스트`(`311:12786`).
- 목록 화면 기준: `39:8751` (`individual (kebab)`)
- 사이드바 메뉴 근거: 새 사이드바 `1:2719`(`개체관리` 항목 — 업무 계열 뒤, 발바닥 아이콘)
- 케밥 메뉴 열림: `39:8913` (`individual (kebab open)`) / 삭제 확인 모달: `51:8701` (`individual (delete)`)
- 토스트: `71:8888` (`individual (toast)`, 생성 성공만 있다)
- 컴포넌트: 표 `species list`(`127:9099`), 탭바 `individual / 분류군 탭바`(`145:15964`), 케밥 트리거 `kebab`(`39:8668`),
  케밥 메뉴 `kebab menu`(`141:9597`, variant `Property 1=수정·삭제` `39:8908`),
  삭제 모달 `common / 딤 + 삭제 확인 모달 (하위 데이터 포함)`(`609:14119`), 헤더 `title` INSTANCE(`39:8754`)
- 개체관리 공통 기준(라우트·데이터 모델·mock 소유권·공통 fixture)은 개체관리 7개 spec 이 같은 값을 쓴다.
  이 spec 은 `entities/species/model/mock.ts` 를 명세한다.
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context` 를 기준 프레임 전체와 related 프레임의 달라지는 영역(`39:9000` 케밥 메뉴, `162:11770` 삭제 모달,
`71:8968` 토스트)에 호출했다. 원문은 `harness/artifacts/publishing/species-list.figma.txt` 에 있다.

- **yot 실측 확인**: 헤더·CTA 규격(`39:8754`), 탭바 규격(`145:15964`, 높이 46은 `get_metadata`),
  표 카드·헤더행·컬럼 고정폭·셀 padding·셀 타이포·검색바·페이지네이션(`127:9099`),
  행 구분선 색 `#848491`(`127:9045` `get_variable_defs`), 케밥 트리거 44×52·아이콘 32·색 `#848491`(`39:8668`),
  케밥 메뉴 크기·위치·항목 규격(`39:9000`), 삭제 모달 문구·규격(`609:14119`), 토스트 규격·문구(`71:8968`).
- **계산값(실측에서 유도)**: 1행 케밥 버튼 절대 위치 `@1558,510`(카드 테두리 1px 보정), 케밥 메뉴와의 간격 8px.
- **미검증**: CTA 버튼 폭·높이(export 에 크기가 없다 — 같은 라벨 길이의 `업무 등록하기` 203×56 과 같다고 추정),
  삭제 모달 `!` 아이콘 색(SVG 에셋이라 값 없음), 빈 상태 레이아웃(종 목록 빈 상태 프레임이 없어 종 상세 `130:9533` 형식 승계),
  삭제 성공·실패 토스트(개체관리 Figma 에 없다 — `task-list` 토스트 `1:3398`/`1:3360` 승계),
  그리고 접근성·반응형 절 전체(Figma 근거 프레임이 없어 `task-list` 승계).

## 목적

운영 관리자가 토이빌리지에 등록된 동물 **종**을 한 화면에서 훑는다. 분류군 탭과 검색으로 좁혀 보고,
행을 눌러 종 상세(개체 목록)로 들어가거나 케밥 메뉴로 종을 수정·삭제하고, 새 종을 등록한다.

## 범위

- 포함: 종 목록 조회, 분류군 탭 필터, 검색, 정렬(최신순/오래된순), 페이지네이션, 행 클릭 이동, 등록 진입, 행 케밥 메뉴(수정·삭제),
  삭제 확인 모달, 빈 상태, 생성·삭제 결과 토스트 표시, 사이드바 `개체관리 바로가기` 메뉴 추가(`sidebar.spec.md` 메뉴 절 갱신 — (2026-09-15 개발자 결정))
- 제외: 실제 API 연동(`/api` 스킬 담당 — Notion API 명세 DB 에 개체·종 API 가 아직 없다, 2026-09-15 확인),
  종 등록·수정 폼(`species-form`), 종 상세·개체 목록(`species-detail`), 개체·관찰 화면, 행 다중 선택,
  직원 권한별 케밥 숨김(범위 밖 — 결정 사항), 사이드바 `먹이 급여 관리` 메뉴(화면 없음)

## 라우트와 진입

개체관리 화면은 사이드바 활성 판정(`pathname.startsWith(route + '/')`)에 맞춰 `/species` 아래에 중첩한다.

| 화면 | 경로 | spec |
| --- | --- | --- |
| 종 목록 | `/species` | species-list (이 문서) |
| 종 등록 | `/species/create` | species-form |
| 종 상세 | `/species/:speciesId` | species-detail |
| 종 수정 | `/species/:speciesId/edit` | species-form |
| 개체 등록 | `/species/:speciesId/individuals/create` | individual-form |
| 개체 상세 | `/species/:speciesId/individuals/:individualId` | individual-detail |
| 개체 수정 | `/species/:speciesId/individuals/:individualId/edit` | individual-form |
| 관찰 상세 | `/species/:speciesId/individuals/:individualId/observations/:observationId` | observation-detail |
| 관찰 수정 | `…/observations/:observationId/edit` | observation-edit |

- `/species` → 종 목록을 표시한다.
- `개체 등록하기` 클릭 → `/species/create`(종 등록)로 이동한다(문구는 Figma 그대로 — 결정 사항).
- 행 본문 클릭 → `/species/:speciesId`(종 상세)로 이동한다.
- 케밥 메뉴 `수정` → `/species/:speciesId/edit`(종 수정)로 이동한다.
- 목록 진입 시 항상 `전체` 탭, 빈 검색어, 1페이지에서 시작한다.
- 종 등록 성공 → `species-form` 이 `/species` 로 이동시키며 생성 성공 토스트를 요청한다.
- 종 상세 케밥 `삭제` 성공 → `species-detail` 이 `/species` 로 이동시키며 삭제 성공 토스트를 요청한다.
- 사이드바 `개체관리 바로가기` 클릭 → `/species` 로 이동하고 사이드바가 닫힌다. `/species/**` 하위 경로(종 상세·폼, 개체·관찰 화면)에서도
  이 메뉴가 활성이다(`sidebar.spec.md` 메뉴 절, (2026-09-15 개발자 결정)).

## 동작 (behavioral spec — source of truth)

### 목록·탭·페이지네이션

- 화면 진입 → 제목 `개체 카드`, 부제 `토이빌리지의 등록된 개체 목록`, `전체` 탭 활성, 1페이지 목록이 보인다.
- 표의 열은 `분류군` / `국명` / `학명` / `마리수` 와 헤더 텍스트가 없는 케밥 열이다.
- 분류군 셀은 `포유류` / `파충류` / `조류` / `어류` 중 하나를 표시한다.
- 마리수 셀은 그 종에 등록된 개체 수를 숫자만 표시한다(단위 없음). 개체가 없으면 `0` 이다.
- 목록은 **기본 최신순**(최근 등록 먼저 = id 큰 순)이다. 검색바 우측 정렬 버튼(`bx:slider` → `DataTable.sort` `filter.svg`) 클릭 →
  `최신순` / `오래된순`(id 작은 순) 메뉴가 열리고, 고르면 그 순서로 바뀌며 목록이 1페이지로 리셋된다
  (2026-09-15 Figma·저장소 근거 판단: `NoticeListPage`·`NoticeReservationsPage` 의 같은 아이콘 정렬 메뉴 선례).
- `포유류` 탭 클릭 → 분류군이 포유류인 종만 남고 목록이 1페이지로 리셋된다.
- `파충류` / `조류` / `어류` 탭 클릭 → 각 분류군의 종만 남고 목록이 1페이지로 리셋된다.
- `전체` 탭 클릭 → 모든 분류군의 종이 다시 보인다.
- 페이지 번호 클릭 → 해당 페이지의 행으로 목록이 바뀐다. 한 페이지는 10행이다(`task-list` 결정 승계).
- `이전 페이지` / `다음 페이지` 클릭 → 한 페이지씩 이동한다. 1페이지에서 `이전 페이지`,
  마지막 페이지에서 `다음 페이지`는 비활성이다.
- 결과가 한 페이지 이하이면 페이지네이션을 숨긴다.
- 삭제로 현재 페이지가 범위를 벗어나면 마지막 페이지로 되돌린다(`task-list` 구현 승계).

### 검색

- 검색바 placeholder 는 `개체이름 또는 국명을 입력해주세요` 다(Figma 그대로).
- 검색어 입력 → 앞뒤 공백을 제거하고 대소문자를 구분하지 않고, **국명** 또는 **그 종에 속한 개체명**에 검색어가
  포함된 종만 남긴다. 입력할 때마다 즉시 반영하고 목록을 1페이지로 리셋한다.
- 검색은 현재 탭과 함께 적용된다(탭 AND 검색). 탭을 바꿔도 검색어는 유지된다.
- 검색어를 지우면 → 현재 탭의 전체 종이 다시 보인다.
- 검색·탭·정렬은 함께 적용된다. 정렬을 바꿔도 탭·검색어는 유지된다.

### 빈 상태

- 검색어가 있고 결과가 없으면 → 행 대신 `검색결과가 없습니다` 한 줄을 표시하고 페이지네이션을 숨긴다
  (2026-09-15 Figma·저장소 근거 판단: tokens.ts `textFaint` 주석의 기존 문구).
- 검색어 없이 현재 탭의 종이 없으면 → 행 대신 `등록된 개체 카드가 없습니다` / `오른쪽 위 [개체 등록하기]로 첫 개체 카드를 추가해주세요`
  두 줄을 표시하고 페이지네이션을 숨긴다 (2026-09-15 Figma·저장소 근거 판단: 종 상세 빈 상태 `130:9533` 두 줄 형식 승계). 규격은 종 상세 빈 상태와 같다
  (22px Medium `colors.optionMuted` / 18px Medium `colors.textFaint`, 줄 간격 12px, 높이 240 영역 가운데).

### 케밥 메뉴

- 행 우측 끝 `⋮` 버튼 클릭 → 그 행의 메뉴가 열리고 `수정` / `삭제` 두 항목이 보인다.
- 같은 행의 `⋮` 를 다시 클릭 → 메뉴가 닫힌다.
- 메뉴가 열린 상태에서 다른 행의 `⋮` 클릭 → 이전 메뉴가 닫히고 새 메뉴가 열린다. 동시에 하나만 열린다.
- 메뉴 바깥 클릭 또는 `Escape` → 메뉴가 닫힌다. `Escape` 로 닫으면 초점이 그 행의 `⋮` 로 돌아온다.
- `⋮` 클릭과 메뉴 항목 클릭은 행 클릭 이동을 발생시키지 않는다.
- `수정` 클릭 → 메뉴가 닫히고 `/species/:speciesId/edit` 로 이동한다.
- `삭제` 클릭 → 메뉴가 닫히고 삭제 확인 모달이 열린다.

### 삭제

- 삭제 확인 모달(Figma `609:14119`): 제목 `정말 삭제하시겠습니까?`,
  본문 `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`, 버튼 `취소` / `확인`.
  **본문 문구가 기존 공용 모달(`삭제하신 뒤에는 영구삭제되며` / `복구 할 수 없습니다`)과 다르다.**
- `취소` 또는 `Escape` → 모달이 닫히고 아무것도 삭제되지 않는다. 초점은 호출한 `⋮` 로 돌아온다.
- `확인` → 해당 종을 삭제하고 모달을 닫는다. 목록이 갱신되고 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- 삭제 실패 → 모달을 닫고 `데이터 삭제에 실패했습니다` 토스트가 뜬다. 목록은 그대로 둔다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

### 토스트

- 목록 화면에서 뜨는 토스트는 세 가지다.
  - `데이터 생성에 성공했습니다` (성공) — `/species/create` 에서 생성 후 목록으로 돌아온 경우(Figma `71:8888`)
  - `데이터 삭제에 성공했습니다` (성공) — 목록 케밥 삭제 성공, 또는 종 상세에서 삭제 후 돌아온 경우
  - `데이터 삭제에 실패했습니다` (실패)
- 표시 시간은 3초, 동시 1개다.
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
- 이 화면이 받는 state: `create-success`(종 등록 성공, `species-form`), `delete-success`(종 상세 삭제 성공, `species-detail`).

## 화면 구조와 시각 규격

1920px 데스크톱 기준. 좌상단 메뉴 버튼(`ic:twotone-menu` 36×36 `@36,32`)은 기존 사이드바를 재사용한다.
본문 너비 1320px, 좌우 중앙 정렬. 페이지 배경 `colors.background`(`#F5F5F7`).

1. 헤더(`title` INSTANCE `39:8754`, `@300,124` 1320×122, 좌우 양끝·하단 정렬):
   제목 `개체 카드` 60px SemiBold `colors.text`(`#000000`), 부제 `토이빌리지의 등록된 개체 목록`
   32px Medium `colors.textGuide`(`#848491`, `y=84`). 텍스트 블록 376×122.
   우측 `+ 개체 등록하기` 버튼 — 배경 `colors.textStrong`(`#36363F`), radius 53px, padding 12/16px,
   `ic:outline-plus` 32px + 라벨 24px SemiBold `colors.surface`, gap 8px. (크기 미검증 — `LinkButton` 규격과 같다.)
2. 탭바(`individual / 분류군 탭바` INSTANCE `145:15965` → main `145:15964`, `@300,278` 1320×46):
   `전체` / `포유류` / `파충류` / `조류` / `어류` 다섯 개.
   활성 탭 22px SemiBold `colors.text` + 하단 실선 2px `colors.text`, 비활성 탭 22px Medium `colors.textGuide`.
   첫 탭 padding 10/40px, 이후 탭 10/44px(`task-list` 탭바와 같은 규칙).
3. 표 카드(`species list` INSTANCE `129:9143` → main `127:9099`, `@300,356` 1320×520 — 탭바 하단에서 32px):
   배경 `colors.surface`, 테두리 1px `colors.border`(`#A1A1A1`), radius 20px.
   - 헤더행(`127:9035`) 높이 52, 배경 `colors.tableHeaderStrong`(`#DDDDE3`),
     텍스트 20px Medium `colors.textStrong`(`#36363F`), 셀 padding 11/40px.
   - 컬럼은 **고정폭, 좌측 정렬, 셀 padding-left 40px** 이다.

     | 컬럼 | x | 폭 | 셀 타이포 |
     | --- | --- | --- | --- |
     | 분류군 | 0 | 240 | 22px Medium `colors.textGuide` |
     | 국명 | 240 | 282 | 24px Medium `colors.textStrong` |
     | 학명 | 522 | 478 | 22px Medium `colors.textGuide` (이탤릭 아님 — Figma `not-italic`) |
     | 마리수 | 1000 | 240 | 22px Medium `colors.textStrong` |
     | 액션(케밥) | 1240 | 80 | 헤더 텍스트 없음, 케밥 가운데 |

   - 검색바(`127:9047`, 카드 기준 `@39,75` 1240×50): 배경 `colors.background`, radius 44px, padding 12/16px.
     좌측 `material-symbols:search` 26px + placeholder 20px Medium `colors.textFaint`(`#AFAFBA`), gap 8px.
     우측 `bx:slider` 26px → 기존 `DataTable.sort` 버튼(`filter.svg` 22×20)으로 렌더한다(크기 차이는 ⑦ 육안 확인).
   - 본문 행 높이 92(카드 기준 top 133 / 233 / 341). 행 구분선 1px `colors.textGuide`(`#848491`),
     좌우 inset 약 40px(`@39` 폭 1240). Figma 는 행 사이 간격이 8px / 16px 로 불규칙하게 그려져 있다 —
     구현은 행을 92px 로 붙이고 구분선만 둔다 (2026-09-15 Figma·저장소 근거 판단: `DataTable` 기존 rowHeight 92, 불규칙 간격은 그리기 오차).
     **한 페이지는 10행**이라 카드 높이는 행 수를 따라 늘어난다(Figma 520 은 3행 기준).
   - 케밥 트리거(`kebab` `39:8668`): 44×52, 셀 가운데(x=18), 아이콘 32px `colors.textGuide`.
   - 페이지네이션(`127:9054`, 카드 기준 `@547,463` 224×32, **카드 안** 중앙): 좌우 chevron 28px,
     번호 32×32 radius 24px, 번호 간 gap 20px, chevron↔번호그룹 gap 16px.
     활성 번호 22px `colors.accent` + 배경 `colors.accentBg`, 비활성 18px `colors.pageMuted`.
     (Figma 는 2페이지 활성 상태를 그렸다.)
4. 케밥 메뉴(`kebab menu` INSTANCE `39:9000` → set `141:9597`, 1행 기준 `@1440,570` 180×116):
   배경 `colors.surface`, 테두리 1px `colors.tableHeaderStrong`(`#DDDDE3`), radius 12px,
   drop-shadow `0 8px 12px rgba(0,0,0,0.14)`, padding 8/0, 항목 간 gap 4px.
   항목 높이 48, padding 12/20px.
   - `수정` — 20px Medium `colors.textStrong`
   - `삭제` — 20px Medium `colors.danger`(`#FF3131`)
   - 위치: 1행 케밥 버튼(`@1558,510` 44×52, 카드 테두리 1px 보정 계산값) 하단에서 **8px 아래**,
     메뉴 우측 끝이 **카드 우측(x=1620)** 과 일치. 개체관리 다른 케밥 메뉴(`157:11656`·`157:11661`)도 트리거 아래 8px·우측 정렬이다.
     메뉴가 `⋮` 를 가리지 않고 다음 행 위에 겹친다.
5. 삭제 확인 모달(`common / 딤 + 삭제 확인 모달 (하위 데이터 포함)` INSTANCE `162:11770` → main `609:14119`):
   딤 `rgba(0,0,0,0.5)` 전체 화면, 카드 600×300 `@660,354`(화면 중앙) `colors.surface` radius 20px.
   - 원형 아이콘 48×48 `@276,43`, 배경 `colors.dangerBg`(`#FFCECE`), `material-symbols:exclamation` 32px(색 미검증).
   - 문구 그룹 `@40,103` 폭 520, gap 12px, 가운데 정렬: 제목 28px Medium `colors.text`,
     본문 2줄 20px Medium `colors.textGuide`. (본문 폰트가 Figma 에서 `Inter` 로 지정돼 있다 — 기존 `font.body` 를 쓴다. 글꼴 정리는 범위 밖.)
   - 버튼 100×48 radius 8px, `y=216`, gap 16px: `취소`(`@192`) 테두리 1px `colors.textGuide` + 글자 20px Medium `colors.textGuide`,
     `확인`(`@308`) 배경 `colors.text` + 글자 20px SemiBold `colors.surface`.
6. 토스트(`71:8968`): 우상단 `@1432,32` 440×80, `colors.surface`, radius 12px, padding 20/24px,
   그림자 `0 0 10px rgba(0,180,138,0.25)`(초록 계열), 아이콘 40px + 메시지 28px Medium `colors.text`, gap 24px.
   성공 아이콘 `colors.success`(`#00B48A`). 실패 아이콘은 `task-list` 승계(`colors.danger`).

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자·rgba 는 Emotion 스타일에 직접 작성한다.

### 기존 공용 컴포넌트와의 시각 차이 (결정 반영)

| 항목 | Figma | 현재 코드 | 결정 |
| --- | --- | --- | --- |
| 표 헤더 글자색 | `#36363F` `textStrong` | `DataTable` `HeadCell` 은 `colors.text` 고정 | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| 검색 아이콘 | `material-symbols:search` 26px | `DataTable` 은 `search.svg` 20px | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| placeholder 굵기 | Medium | `DataTable` 입력은 굵기 미지정 | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| 슬라이더 아이콘 | `bx:slider` 26px, 동작 없음 | `DataTable` 은 `sort` 를 줄 때만 `filter.svg` 22×20 + 정렬 메뉴 | `DataTable.sort`(최신순/오래된순) 적용 |
| 케밥 메뉴 위치 | 케밥 하단 +8px, 행 우측 끝 정렬 | `KebabMenu` 는 positioned 조상 우상단(`top: 0; right: 0`) | `KebabMenu` 배치 옵션 추가(게이트 ② 채택) |
| 케밥 메뉴 그림자 | drop-shadow 0 8 12 / 0.14 | `KebabMenu` box-shadow 0 8 24 / 0.14 | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| `Escape` 초점 복귀 | (접근성 요구) | `KebabMenu` 는 초점을 되돌리지 않고 트리거 ref 도 노출하지 않는다 | `KebabMenu` 보강(게이트 ② 채택) |
| 삭제 모달 본문 | `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다` | `DeleteConfirmationDialog` 본문 고정 | `description` prop 추가(게이트 ② 채택) |
| 삭제 모달 제목 굵기 | Medium(500) | 600 | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| 삭제 모달 `취소` | 테두리·글자 `#848491` | 테두리 `dialogBorder`(`#C6C6CE`), 글자 `colors.text` | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| 삭제 모달 `확인` 굵기 | SemiBold | 500 | 기존 구현 유지, ⑦ 육안 확인에서 판단 |
| 토스트 그림자 | `rgba(0,180,138,0.25)` | `rgba(0,0,0,0.25)` | 기존 구현 유지, ⑦ 육안 확인에서 판단 |

### 신규 semantic color 토큰

없음. `yarn harness:map-tokens species-list` 결과 solid color 14종이 모두 `tokens.ts` 에 있다
(`#848491` `#36363F` `#DDDDE3` `#F5F5F7` `#C6C6CE` `#FF3131` `#A1A1A1` `#AFAFBA` `#E8E9FF` `#4952FF`
`#FFCECE` `#000000` `#00B48A` `#9999A5`). `rgba(0,0,0,0.5)` `rgba(0,0,0,0.14)` `rgba(0,180,138,0.25)` 는 구현값이다.
Figma font family 는 `Wanted Sans`(기존 `font.body`)와 모달 본문의 `Inter`(Figma 오류로 판단)다.

## 데이터

```ts
// entities/species (개체관리 공통 모델 — 7개 spec 동일)
type TaxonGroup = 'MAMMAL' | 'REPTILE' | 'BIRD' | 'FISH' // 포유류 / 파충류 / 조류 / 어류
interface Species {
  id: string
  koreanName: string        // 국명 (필수)
  englishName: string       // 영문명 (필수)
  scientificName: string    // 학명 (필수)
  taxonGroup: TaxonGroup    // 분류군 (필수, 단일 선택)
  subClassification?: string // 세부 분류 (선택)
  legalDesignations: string[] // 법정지정분류 (복수, 선택, 사용자 직접 추가 가능)
  photo: { fileName: string; fileKey: string; url: string } // 대표 사진 1장 (필수, 저장소 파일 규약 + 표시용 url)
  individualCount: number   // 마리수 — 개체 수에서 파생
}
```

- 목록 표시에 쓰는 필드는 `id` `taxonGroup` `koreanName` `scientificName` `individualCount` 다.
  나머지 필드는 상세·폼이 쓰지만 mock 에는 함께 둔다.
- 분류군 라벨은 `entities/species/model/labels.ts` 의 `taxonGroupLabels: Record<TaxonGroup, string>`
  (`MAMMAL` 포유류 / `REPTILE` 파충류 / `BIRD` 조류 / `FISH` 어류)로 둔다. 탭 순서는 `전체` 뒤에 이 순서다.
- **`individualCount` 는 mock 에 저장하지 않고 파생한다** (2026-09-15 Figma·저장소 근거 판단: 종 상세 Figma `개체 3마리` 와 목록 `4` 불일치 → 실제 개체 수). `entities/individual/model/mock.ts`
  (`species-detail` 소유)에서 `speciesId` 가 같은 개체 수를 센다. entities → entities import 는 `eslint.config.js` 가 허용한다.
- 탭 필터·검색어·정렬·페이지 번호·열린 케밥 행 id·삭제 대상 id 는 페이지가 소유하는 로컬 상태다. 전역 상태로 올리지 않는다.
- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- 서버 데이터는 TanStack Query 로 읽는다. query key: 목록 `['species', 'list']`, 단건 `['species', speciesId]`.
  생성·수정·삭제 뒤 `['species']` 를 무효화하고, 종 삭제는 `['individuals']`·`['observations']` 도 무효화한다(연쇄 삭제).
- 이번 슬라이스는 mock 함수로 대체한다. 기존 `entities/resource/model/mock.ts` 패턴을 따른다. 이 spec 이 종 mock 을 소유한다.
  - 함수: `getMockSpeciesList(): Promise<Species[]>`, `getMockSpecies(id): Promise<Species | null>`(삭제된 종은 `null`),
    `deleteMockSpecies(id): Promise<void>`, 폼용 `createMockSpecies(input: CreateSpeciesInput): Promise<Species>` /
    `updateMockSpecies({ id, input }: { id: string; input: UpdateSpeciesInput }): Promise<Species>`(입력 형태는 `species-form` 이 정한다).
  - 생성 id 는 기존 최대 id + 1 의 숫자 문자열이다(기본 최신순이라 새 종은 1페이지 첫 행에 놓인다).
  - 새 사진은 mock 이 `fileKey`(`mock-species-{id}`)와 표시용 `url` 을 발급한다.
  - localStorage 키 상수: `speciesStorageKey = 'toyvillage:species'`(생성·수정 저장),
    `deletedSpeciesStorageKey = 'toyvillage:species:deleted'`(삭제 기록),
    `speciesFailStorageKey = 'toyvillage:species:fail'`(값 `'delete'` | `'create'` | `'update'` 를 넣으면 다음 해당 요청이 한 번 실패).
  - 함수명·키는 `species-detail` 과 맞췄다(2026-09-15). `species-form` 도 같은 키를 써야 생성한 종이 목록에 보인다.
  - 필터·검색·정렬·페이지 슬라이싱은 페이지가 클라이언트에서 한다(`notice-list` 방식). mock 은 id 오름차순으로 돌려준다.
- 연쇄 삭제(mock, 개체관리 공통): 연쇄 삭제 기록을 따로 쓰지 않고 조회에서 뺀다. `getMockIndividuals` / `getMockIndividual` 은 삭제된 개체와
  삭제된 종(`getMockSpecies(speciesId)` 가 `null`)의 개체를 빼고(`null`), `getMockObservations` / `getMockObservation` 은 소속 개체가 없는
  (`getMockIndividual(individualId)` 가 `null`) 관찰을 뺀다(`null`). entities → entities import 는 ESLint 가 허용한다. 실제 연쇄 삭제는 서버 책임이다.

### mock (`entities/species/model/mock.ts`, 13건)

한 페이지 10행이라 `전체` 탭에서 2페이지가 나오고, 네 분류군이 모두 있으며, 개체가 0마리인 종이 하나 있다.
id 1~3 은 개체관리 공통 fixture 값이다.

| id | 국명 | 영문명 | 학명 | 분류군 | 세부 분류 | 법정지정분류 | 마리수(파생) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | 카피바라 | Capybara | Hydrochoerus hydrochaeris | MAMMAL | 설치목 - 천축서과 | 지정관리 야생동물 | **3** (동식이·미미·두리) |
| `2` | 플라밍고 | Flamingo | Phoenicopterus roseus | BIRD | — | — | **12** |
| `3` | 반달가슴곰 | Asiatic black bear | Ursus thibetanus | MAMMAL | — | 멸종위기 야생생물 I급, 천연기념물 | **2** |
| `4` | 알락꼬리여우원숭이 | Ring-tailed lemur | Lemur catta | MAMMAL | — | — | **1** |
| `5` | 미어캣 | Meerkat | Suricata suricatta | MAMMAL | 몽구스과 | — | **1** |
| `6` | 레서판다 | Red panda | Ailurus fulgens | MAMMAL | 레서판다과 | — | **1** |
| `7` | 설카타육지거북 | African spurred tortoise | Centrochelys sulcata | REPTILE | — | — | **1** |
| `8` | 비어디드래곤 | Central bearded dragon | Pogona vitticeps | REPTILE | — | — | **1** |
| `9` | 볼파이톤 | Ball python | Python regius | REPTILE | — | — | **1** |
| `10` | 금강앵무 | Blue-and-yellow macaw | Ara ararauna | BIRD | 앵무과 | — | **1** |
| `11` | 훔볼트펭귄 | Humboldt penguin | Spheniscus humboldti | BIRD | 펭귄과 | — | **1** |
| `12` | 흰동가리 | Clown anemonefish | Amphiprion ocellaris | FISH | 자리돔과 | — | **1** |
| `13` | 피라냐 | Red-bellied piranha | Pygocentrus nattereri | FISH | — | — | **0** (개체 없음 — 빈 상태 확인용) |

- 분류군별 건수: 포유류 5(1·3·4·5·6) · 파충류 3(7·8·9) · 조류 3(2·10·11) · 어류 2(12·13).
- 기본 최신순 `전체` 1페이지는 id 13~4(첫 행 `피라냐`), 2페이지는 id 3·2·1(`반달가슴곰` `플라밍고` `카피바라`)이다. `오래된순` 이면 첫 행이 `카피바라` 다.
- 검색 표본: 국명 `카피` → 카피바라, 개체명 `동식` → 카피바라(개체 `1` 동식이, `species-detail` mock).
- 마리수는 `species-detail` 의 individual mock 26건(종 1 → 3 · 종 2 → 12 · 종 3 → 2 · 종 4~12 → 각 1 · 종 13 → 0)에서
  파생한 값이다(2026-09-15 `species-detail` 과 조율). individual mock 이 바뀌면 이 표도 함께 고친다.
- `photo` 는 목록에서 쓰지 않는다. 파일명은 id 1 `카피바라_2026.jpg`, 나머지 `{국명}_2026.jpg`, `fileKey` 는 `mock-species-{id}`, `url` 은 ③에서 정한 공용 에셋 1장이다.
- 세부 분류는 `{목} - {과}` 형식(Figma 종 수정 프레임 `설치목 - 천축서과`)을 권장하지만 형식 검사는 하지 않는다. 한 조각만 있는 값(`몽구스과` 등)도 그대로 둔다.
- **Figma 의 마리수(카피바라 `4`, 플라밍고 `6`, 반달가슴곰 `2`)는 따르지 않는다.** 종 상세 Figma 는 카피바라
  `개체 3마리`(동식이·미미·두리)이므로 mock 은 실제 개체 수에서 파생한다.

## 컴포넌트 구조/props

- `SpeciesListPage` — `/species` 페이지(`src/pages/species`). 탭·검색어·정렬·페이지·열린 케밥·삭제 대상·토스트 상태 소유.
- `PageHeader { title, subtitle, action }` — **신규 공용**(`src/shared/ui`, 게이트 ② 채택). Figma `title` INSTANCE(`39:8754`)를 그린다.
  개체관리 화면에만 쓰고 기존 목록 화면(`TaskListPage` 등)의 페이지 내 헤더 교체는 범위 밖이다.
- `LinkButton { to, children }`(`src/shared/ui`) — 기존 재사용. `PageHeader.action` 에 `to="/species/create"` 로 넣는다.
  전용 `CreateSpeciesButton` 은 만들지 않는다(`WorkLogListPage` 방식).
- `TaxonGroupTabs`(`src/entities/species/ui`, 개체관리 공통 이름) — **기존 `CategoryTabs` 재사용**.
  `CategoryTabs { categories, active, onSelect }` 는 라벨 문자열을 받으므로 `taxonGroupLabels` 로 매핑만 한다.
  래퍼 파일을 둘지(`TaxonGroupTabs { value: TaxonGroup | 'ALL', onChange }`) 페이지에서 `CategoryTabs` 를 직접 쓸지는 ③에서 과분리 점검으로 정한다.
- `SpeciesTable`(`src/entities/species/ui`) — **신규**. `DataTable` 에 종 컬럼·외형을 입힌다(`TaskTable` 방식).
  `SpeciesTable { species, onRowClick, search, sort, pagination, emptyLabel, renderRowAction }`.
  - `DataTable` `appearance`: `offsetTop: 32`, `bordered: true`, `headerHeight: 52`,
    `headerBackground: 'tableHeaderStrong'`, `headerFontSize: 20`, `rowHeight: 92`, `dividerColor: 'textGuide'`,
    `dividerInset: 40`, `align: 'left'`, `paginationPlacement: 'inside'`.
  - 컬럼: `분류군` 240 / `국명` 282 / `학명` 478 / `마리수` 240 / 케밥 80(`paddingX: 0`, `align: 'center'`, `variant: 'action'`).
    셀 타이포는 `DataTable` 기본 변형과 달라 `render` 로 지정한다.
  - `search`: `DataTableSearch { value, onChange, placeholder: '개체이름 또는 국명을 입력해주세요', ariaLabel: '종 검색' }`.
  - `sort`: `DataTableSort { value: 'newest' | 'oldest', onChange, ariaLabel: '종 정렬' }`(기본 옵션 `최신순` / `오래된순`).
  - `emptyLabel`: 두 줄 빈 상태를 넘기려면 `DataTable.emptyLabel: string → ReactNode`(게이트 ② 채택, `species-detail` 과 같은 변경).
  - `renderRowAction?: (item: Species) => ReactNode` — 메뉴 동작(이동·삭제)은 페이지가 소유한다.
- `KebabMenu { open, onOpenChange, items, ariaLabel }`(`src/shared/ui`) — **기존 재사용 + 보강**(shared API 변경, 게이트 ② 채택).
  근거: 개체관리 케밥 메뉴(`39:9000`·`157:11656`·`157:11661`)가 모두 component set `141:9597` 이고 `KebabMenu` 가 그 set 의 구현이다
  (테두리 `tableHeaderStrong` · padding 8/0 · gap 4 · 항목 h48 · 32px `kebab.svg` `#848491` 일치).
  보강(개체관리 케밥 공통): ① `Escape` 로 닫을 때 초점을 트리거 `⋮` 로 되돌린다, ② 트리거 ref 를 노출한다
  (`onTriggerRef` — 삭제 모달이 닫힌 뒤 초점 복귀용), ③ 배치 옵션 — 메뉴를 트리거 하단 8px·우측 끝 정렬로 둔다
  (현재는 가장 가까운 positioned 조상의 `top: 0; right: 0`). 그림자 blur(기존 24px ↔ Figma 12px)는 기존 값을 유지하고 ⑦ 육안 확인에서 판단한다.
  `features/row-actions` 의 `RowActionMenu` 는 사용하지 않는다(통합은 범위 밖).
  - `SpeciesTable` 이 entities 에 있으므로 메뉴는 `renderRowAction` 으로 페이지가 넣는다.
- `DeleteConfirmationDialog { pending, onCancel, onConfirm, description? }`(`src/shared/ui`) — **기존 재사용 + `description?: ReactNode` 추가**
  (shared API 변경, 게이트 ② 채택 — 미지정 시 기존 문구). 개체관리 문구: 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`
  (Figma `609:14119`), 개체 삭제 `등록된 관찰 기록도 함께 삭제되며` / `삭제 후에는 복구할 수 없습니다`(Figma `610:14119`), 관찰 삭제 기본 문구(프레임 없음).
- `Toast { variant, message, onDismiss, duration }`(`src/shared/ui`) — 기존 재사용.

## 접근성

- 탭은 `aria-pressed` 로 활성 상태를 노출한다(`CategoryTabs` 기존 동작).
- 검색 입력은 접근 가능한 이름 `종 검색` 을 가진다. 정렬 버튼은 `종 정렬`, 메뉴 항목은 `menuitemradio` + `aria-checked`(`DataTable` 기존 동작).
- 각 행은 키보드(`Enter` / `Space`)로 활성화할 수 있다(`DataTable` 기존 동작). 접근 가능한 이름에 국명이 포함된다.
- `⋮` 버튼은 `aria-haspopup="menu"` 와 `aria-expanded` 를 제공하고 이름에 대상 종을 포함한다(예: `카피바라 관리 메뉴`).
  메뉴는 `role="menu"`, 항목은 `role="menuitem"` 이며 `Escape` 로 닫히고 초점이 `⋮` 로 돌아온다.
- 삭제 확인 모달은 `role="alertdialog"` 이고 열릴 때 초점을 가두며, 닫히면 초점을 호출한 `⋮` 버튼으로 되돌린다(행이 삭제됐으면 생략).
- 페이지네이션 버튼은 `이전 페이지` / `다음 페이지` / `N 페이지` 이름을 제공하고 경계에서 `disabled` 로 표시한다.
- 빈 상태 문구는 `role="status"` 로 알린다(`DataTable` 기존 동작).
- 토스트는 `role="status"`(성공) / `role="alert"`(실패)로 알린다.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

(Figma 근거 없음 — `task-list` 승계)

- 980px 이하에서는 제목 크기와 카드 padding 을 줄이고 본문은 가용 너비를 사용한다.
- 표는 좁은 화면에서 가로 스크롤을 허용하되 페이지 전체가 가로 스크롤되지 않게 한다.
- 컨트롤의 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

mock 은 위 13건 기준이다. 목록 기본 정렬은 최신순(id 큰 순)이다.

- S1: `/species` 진입 → 제목 `개체 카드`·부제가 보이고 `전체` 탭이 활성이며 `분류군` `국명` `학명` `마리수` 컬럼과 최신순 10행(첫 행 `피라냐`)이 보인다.
- S2: `개체 등록하기` 클릭 → `/species/create` 로 이동한다.
- S3: `포유류` 탭 클릭 → 분류군이 `포유류` 인 5행만 남는다.
- S4: `파충류` 탭 클릭 → `파충류` 3행만 남는다.
- S5: `조류` 탭 클릭 → `조류` 3행만 남는다.
- S6: `어류` 탭 클릭 → `어류` 2행만 남는다.
- S7: 다른 탭에서 `전체` 탭 클릭 → 모든 분류군의 행이 다시 보인다.
- S8: 검색어 `카피` 입력 → `카피바라` 행만 남는다.
- S9: 검색어 `동식` 입력 → 개체 `동식이` 가 속한 `카피바라` 행이 보인다.
- S10: `피라냐` 행 본문 클릭 → `/species/13`(종 상세)로 이동한다.
- S11: `2 페이지` 클릭 → `반달가슴곰` `플라밍고` `카피바라` 3행으로 바뀐다.
- S12: 마리수 셀 → `포유류` 탭의 `카피바라` 는 `3`, `어류` 탭의 `피라냐` 는 `0` 이다.
- S13: `피라냐` 행 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열리고 행 이동은 일어나지 않는다.
- S14: 메뉴가 열린 상태에서 다른 행 `⋮` 클릭 → 이전 메뉴가 닫히고 하나만 열려 있다.
- S15: 메뉴 바깥 클릭 / `Escape` → 메뉴가 닫히고, `Escape` 면 초점이 `⋮` 로 돌아온다.
- S16: `피라냐` 메뉴 `수정` 클릭 → `/species/13/edit` 로 이동한다.
- S17: 메뉴 `삭제` 클릭 → `등록된 개체와 관찰 기록도 함께 삭제되며` 문구의 삭제 확인 모달이 열린다.
- S18: 모달 `취소` / `Escape` → 모달이 닫히고 행이 그대로 남는다.
- S19: 모달 `확인` → 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트가 뜬 뒤 사라진다.
- S20: 1페이지에서 `이전 페이지`, 마지막 페이지에서 `다음 페이지` 가 비활성이다.
- S21: 2페이지를 보는 중 탭을 바꾸거나 검색어를 입력하면 1페이지로 리셋된다.
- S22: 결과가 없는 검색어 → `검색결과가 없습니다` 가 보이고 페이지네이션이 사라진다.
- S23: 검색어를 둔 채 탭을 바꾸면 → 검색어가 유지되고 탭 AND 검색 결과만 보인다.
- S24: 검색어 없이 종이 없는 탭 → `등록된 개체 카드가 없습니다` / `오른쪽 위 [개체 등록하기]로 첫 개체 카드를 추가해주세요` 가 보이고 페이지네이션이 사라진다.
- S25: 삭제 실패 조건 → `데이터 삭제에 실패했습니다` 토스트가 뜨고 행이 남는다.
- S26: 생성 성공으로 목록에 돌아오면 → `데이터 생성에 성공했습니다` 토스트가 보인다.
- S27: 마지막 페이지의 유일한 행을 삭제하면 → 이전 페이지로 되돌아가 행이 보인다.
- S28: 키보드만으로 탭 전환·검색·정렬·페이지 이동·행 진입·케밥 메뉴 조작을 수행할 수 있다.
- S29: 사이드바 `개체관리 바로가기` 클릭 → `/species` 로 이동하고 사이드바가 닫힌다. 종 상세(`/species/1`)에서 사이드바를 열면 이 메뉴가 활성이다.
- S30: 정렬 버튼에서 `오래된순` 선택 → 1페이지 첫 행이 `카피바라` 로 바뀌고, 2페이지를 보던 중이면 1페이지로 리셋된다.

## 결정 사항

- 라우트는 `/species`, `/species/create`, `/species/:speciesId`, `/species/:speciesId/edit` 다(개체관리 공통 라우트 표) (2026-09-15 Figma·저장소 근거 판단: 사이드바 활성 판정 `pathname.startsWith(route + '/')`).
- 제목·부제·CTA 는 Figma 그대로 `개체 카드` / `토이빌리지의 등록된 개체 목록` / `개체 등록하기`(→ `/species/create`)다 (2026-09-15 Figma·저장소 근거 판단: `kebab menu`(`141:9597`) 설명이 이 화면을 "개체카드 목록"이라 부른다). 헤더는 신규 공용 `PageHeader` 로 그린다(게이트 ② 채택).
- 사이드바에 `개체관리 바로가기` → `/species` 를 `업무일지관리 바로가기` 다음에 추가하고 `/species/**` 하위 경로도 활성으로 본다. 아이콘은 새 사이드바 `1:2719` 의 발바닥 아이콘(에셋은 ③) (2026-09-15 개발자 결정).
- 행 클릭은 종 상세, 케밥 `수정` 은 종 수정 폼, 케밥 `삭제` 는 확인 모달이다 (2026-09-15 Figma·저장소 근거 판단: `task-list` 규칙 승계, Figma `39:8908` 설명).
- 한 페이지 10행이다 (2026-09-15 Figma·저장소 근거 판단: `task-list` 결정 승계, Figma 는 3행만 그렸다).
- 마리수는 개체 수에서 파생한다. Figma 표본 마리수(카피바라 `4`)는 따르지 않는다 (2026-09-15 Figma·저장소 근거 판단: 종 상세 Figma `개체 3마리`(동식이·미미·두리)).
- 정렬은 `DataTable.sort`(최신순/오래된순)이고 기본 최신순(최근 등록 = id 큰 순)이다 (2026-09-15 Figma·저장소 근거 판단: 같은 `filter.svg` 정렬 메뉴 — `NoticeListPage`·`NoticeReservationsPage` 선례).
- 검색 placeholder 는 Figma 그대로이고, 검색은 국명 또는 소속 개체명 부분 일치로 탭과 AND 로 적용한다 (2026-09-15 Figma·저장소 근거 판단: placeholder `개체이름 또는 국명` 문구).
- 빈 상태는 `검색결과가 없습니다`(검색 중) / `등록된 개체 카드가 없습니다` + `오른쪽 위 [개체 등록하기]로 첫 개체 카드를 추가해주세요`(그 외)다 (2026-09-15 Figma·저장소 근거 판단: tokens.ts `textFaint` 주석 문구, 종 상세 빈 상태 `130:9533` 형식). 두 줄은 `DataTable.emptyLabel: ReactNode` 로 넘긴다(게이트 ② 채택).
- 행은 92px 로 붙이고 구분선만 둔다 (2026-09-15 Figma·저장소 근거 판단: `DataTable` 기존 rowHeight 92, Figma 행 간격 8/16px 불규칙은 그리기 오차).
- 삭제 확인 모달은 `DeleteConfirmationDialog` 에 `description?: ReactNode` 를 추가해 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` · 개체 삭제 `등록된 관찰 기록도 함께 삭제되며`(둘째 줄 `삭제 후에는 복구할 수 없습니다`)를 쓰고, 관찰 삭제는 기본 문구를 쓴다 (2026-09-15 Figma·저장소 근거 판단: Figma `609:14119`·`610:14119` 문구, 관찰 삭제 프레임 없음).
- 케밥 메뉴는 `src/shared/ui/KebabMenu` 에 `Escape` 초점 복귀·트리거 ref 노출(`onTriggerRef`)·배치 옵션(트리거 하단 8px·우측 끝 정렬)을 보강해 쓴다 (2026-09-15 Figma·저장소 근거 판단: 케밥 메뉴 set `141:9597` 규격이 `KebabMenu` 와 일치, design-rules §1 같은 INSTANCE 2곳 이상 → 공용).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- 종·개체 삭제는 모달 문구대로 하위 개체·관찰 기록을 함께 숨긴다. mock 은 조회 제외로 표현하고 실제 삭제는 서버 책임이다 (2026-09-15 Figma·저장소 근거 판단: 삭제 모달 문구 `609:14119`·`610:14119`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 사진 데이터는 `photo: { fileName: string; fileKey: string; url: string }` 이다. 종 1 `카피바라_2026.jpg`, 개체 1 `동식이_2026.jpg` 이고 나머지도 항목마다 다른 파일명을 둔다(이미지 바이트는 공용 에셋 1장 가능) (2026-09-15 Figma·저장소 근거 판단: 저장소 첨부 규약 `{ fileName, fileKey }` + 표시용 `url`, Figma 종 수정 chip `동식이_2026.jpg` 는 복사 오류).
- 종 1 fixture 세부 분류는 `설치목 - 천축서과` 다 (2026-09-15 개발자 결정).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 수정 저장 성공 토스트는 띄우지 않고 상세 이동으로 피드백을 대신한다 (2026-09-15 Figma·저장소 근거 판단: `task-edit`·개체관리 Figma 에 수정 성공 토스트가 없다).
- 직원 권한별 케밥 숨김은 범위 밖이다 (2026-09-15 Figma·저장소 근거 판단: 웹은 관리자 로그인 전용(Notion `웹 관리자 로그인`), 직원은 앱을 쓴다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

없음. 게이트 ② 에서 이 화면의 미결을 모두 결정했다(2026-09-15). 남은 절차는 시나리오 승인(S1~S30)이다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
