---
feature: observation-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1323:15015
  relatedNodeIds: []
requires_functional_test: true
paths: src/pages/species, src/entities/observation, src/shared/ui
---

# 개체관리 · 관찰 상세 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일은 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 개체 상세`(`311:12784`).
- 상세 화면 기준: `1323:15015` (`observation detail`, 1920×653)
  - 뒤로가기 `back` 인스턴스 `1323:15018`(컴포넌트 `1:10470`), 케밥 `kebab` 인스턴스 `1323:15073`(컴포넌트 `39:8668`)
  - 제목 `1323:15070`, 날짜 `1323:15071`, 관찰자 `1323:15072`
  - 카드 묶음 `form` `1323:15019` › `관찰사항` 카드 `1323:15038` / `첨부` 카드 `1323:15043` › 파일 칩 `1323:15046`
- **이 화면의 상태 프레임은 없다.** 케밥 열림·삭제 확인·삭제 토스트·첨부 없음·없는 id 프레임이 모두 없다.
  아래 동작 중 그 부분은 같은 섹션 개체 상세의 프레임과 저장소 기존 규칙에서 가져왔고 게이트 ② 에서 확정했다(2026-09-15).
  - 케밥 열림 참고: `157:11525` (`individual detail (kebab open)`) › `kebab menu` 인스턴스 `157:11661`(컴포넌트 세트 `141:9597`)
  - 삭제 확인 참고: `610:14132` (`individual detail (delete)`) › `common / 딤 + 삭제 확인 모달 (관찰 기록 포함)` `610:14140`
  - 첨부 칩 여러 개 참고: `970:26390` (`individual detail (attach hover)`) › `attachment popover` `970:26527`
  - 진입 표: `observation list` 인스턴스 `129:9455`(컴포넌트 `127:9224`)
- 삭제 결과 토스트 문구는 개체관리 Figma 에 없다(`개체관리 · 토스트` `311:12786` 에는 생성 성공 `71:8888` 만 있다).
  업무관리 `1:3398`(삭제 성공) / `1:3360`(삭제 실패) 문구를 쓰는 저장소 기존 규칙을 따른다.
- 공통 브리프: 개체관리 7개 spec 공통 기준(라우트·데이터 모델·mock 소유권·공용 컴포넌트 이름)을 따른다.
- 추출 캐시: `harness/artifacts/publishing/observation-detail.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context` 를 `1323:15015` 전체에 호출해 원문을 저장했다. 같은 섹션의 `610:14140`(삭제 모달)·`157:11661`(케밥 메뉴)·
`129:9455`(관찰 표)는 비교용으로만 호출했고, 캐시에는 넣지 않았다(이 feature 의 프레임이 아니다). `get_metadata` 로 좌표를 확인했다.

- **yot 실측 확인**: 화면 골격, 제목·날짜·관찰자 좌표와 글자 규격, 케밥 위치·크기, 두 카드의 padding·gap·radius·라벨/본문 글자,
  파일 칩 1개의 규격, 사용 색 5개(`#F5F5F7` `#FFFFFF` `#36363F` `#848491` `#AFAFBA`).
- **Figma 근거 없음(게이트 ② 결정으로 채움)**: 케밥 메뉴 항목·위치, 삭제 모달·토스트, 첨부가 여러 개일 때의 칩 배치, 첨부가 없을 때,
  긴 제목·여러 줄 관찰사항, 로딩·없는 id, 접근성·반응형 절 전체.
- **Figma 이상값**: 제목 텍스트 박스 `1323:15070` 폭이 `2283.6px` 로 프레임(1920)을 넘는다. 렌더 결과 글자는 x300~약 975 에 그려져
  잘리지 않았고 케밥(@1576)과도 겹치지 않는다. 고정 폭 텍스트 박스를 늘려 둔 잔여값으로 보고 **폭 규칙으로 쓰지 않는다**(아래 제목 절).
- **Figma 글꼴**: 뒤로가기만 `Wanted Sans`, 나머지 텍스트는 `Inter:Medium` 으로 지정돼 있다. 한글은 Inter 에 글리프가 없어
  렌더가 대체 글꼴로 그려진다. 새 font token 으로 올리지 않고 기존 `font.body`(Wanted Sans)를 쓴다(글꼴 정리는 범위 밖).

## 목적

운영 관리자가 개체 상세의 관찰 기록 표에서 한 건을 열어 제목·관찰 날짜·관찰자·관찰사항과 첨부 파일을 확인하고
파일을 내려받는다. 필요하면 케밥으로 관찰 기록 수정 화면에 들어가거나 기록을 삭제한다.

## 범위

- 포함: 관찰 기록 조회(제목·날짜·관찰자·관찰사항·첨부), 첨부 파일 다운로드, 뒤로가기, 케밥 메뉴(수정·삭제),
  삭제 확인 모달, 삭제 결과 토스트, 첨부 없음 표시, 로딩·없는 id 처리
- 제외: 실제 API 연동(개체·관찰 API 명세 없음 — `/api` 스킬 담당), 관찰 기록 수정 폼(`observation-edit`),
  **관찰 기록 등록(웹에 등록 프레임이 없다 — 관찰은 앱에서 작성하는 것으로 보인다, Figma `1:755`)**,
  관찰 기록 표·`외 N개`·첨부 popover(`individual-detail`), 관찰 mock 명세(`individual-detail` 소유),
  직원 권한별 케밥 숨김(범위 밖 — 결정 사항), 사이드바 변경

## 라우트와 진입

- `/species/:speciesId/individuals/:individualId/observations/:observationId` → 이 화면(읽기 전용 상세). 개체관리 공통 라우트다.
- 개체 상세(`/species/:speciesId/individuals/:individualId`)의 관찰 기록 표 행 본문 클릭 → 이 화면으로 이동한다(`individual-detail` 소유 동작).
- `뒤로가기` → `/species/:speciesId/individuals/:individualId`(개체 상세)로 이동한다. 편집이 없으므로 이탈 확인은 없다.
- 케밥 `수정` → `/species/:speciesId/individuals/:individualId/observations/:observationId/edit`(`observation-edit`)로 이동한다.
- 삭제 성공 → 개체 상세로 이동하고 그 화면이 `데이터 삭제에 성공했습니다` 토스트를 띄운다.
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout` 이 전역 렌더하므로 이 페이지는 본문만 담당한다.

## 동작 (behavioral spec — source of truth)

### 조회

- 진입 → `뒤로가기`, 제목, 날짜·관찰자, 우측 `⋮`, `관찰사항` 카드, `첨부` 카드가 보인다.
- 불러오는 중 → `관찰 기록을 불러오는 중입니다.` 를 표시한다(`TaskDetailPage` 패턴).
- 없는 `observationId` → `관찰 기록을 찾을 수 없습니다.` 와 `개체 상세로 돌아가기` 링크(`/species/:speciesId/individuals/:individualId`)를 표시한다.
  (기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴(`<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크) 승계. Figma 프레임 없음)
- 경로 체인 전체를 검증한다: 관찰의 `individualId` 가 URL `individualId` 와 다르거나, 그 개체(`getMockIndividual`)가 없거나 개체의 `speciesId` 가 URL `speciesId` 와 다르면
  → 없는 id 와 같이 처리한다 (2026-09-15 Figma·저장소 근거 판단: 개체 상세·관찰 수정과 같은 체인 검증).

### 제목·날짜·관찰자

- 제목은 관찰 기록의 `title` 을 그대로 표시한다. 편집 컨트롤은 없다.
- 제목이 한 줄을 넘으면 줄바꿈해 모두 보인다. 말줄임하지 않고, 케밥 영역과 겹치지 않는다.
  (2026-09-15 Figma·저장소 근거 판단: Figma 는 짧은 제목 한 줄만 그렸고 텍스트 박스 폭 2283.6 은 잔여값이다. 상세는 전체 제목을 볼 수 있는 유일한 화면이라 자르지 않는다).
- 날짜는 `observedAt`(`YYYY-MM-DD`)을 `YYYY.MM.DD` 로 표시한다(예: `2026.06.01`).
- 관찰자는 `observerName` 을 날짜 오른쪽에 표시한다(예: `김유영`). 구분 기호는 없다(Figma 는 20px 간격만 둔다).

### 관찰사항

- `관찰사항` 카드에 `content` 를 그대로 표시한다.
- 여러 줄 관찰사항은 입력한 줄바꿈을 보존하고, 긴 단어는 카드 폭 안에서 끊는다.
  (task-report 상세 내용 카드 규칙 승계. Figma 는 한 줄만 그렸다).

### 첨부

- `첨부` 카드에 첨부 파일마다 칩 하나를 **모두** 나열한다. 관찰 기록 표의 `외 N개` 축약은 이 화면에서 쓰지 않는다
  (Figma 상세에는 `외 N개` 가 없다).
- 칩은 확장자 아이콘(Figma `teenyicons` 에셋) + 파일명 + 다운로드 아이콘이다. 삭제 아이콘은 없다(조회 전용, `AttachmentChip` `onRemove` 없음).
- 다운로드 아이콘 클릭 → 해당 파일을 내려받는다. 퍼블리싱 단계에서는 기존 `AttachmentList` 와 같이 파일명을 담은 임시 파일을 내려받는
  mock 경계로 둔다(실제 파일 URL 은 `fileKey` 로 `/api` 에서 연결).
- 칩이 여러 개면 가로로 나열하고 넘치면 다음 줄로 넘긴다(간격 16px) (2026-09-15 Figma·저장소 근거 판단: Figma 상세는 칩 1개만 그렸다 — 기존 `AttachmentList` 배치 규칙).
- 첨부가 없으면 `첨부` 카드는 그대로 두고 칩 자리에 `—` 를 `colors.textFaint` 로 보인다 (2026-09-15 Figma·저장소 근거 판단: 관찰 표 첨부 셀 `127:9223` 과 같은 표기).

### 케밥 메뉴

- 제목 행 우측 `⋮` 클릭 → `수정` / `삭제` 두 항목이 열린다. `삭제` 는 빨간 글자다.
  (이 화면의 열림 프레임이 없어 개체 상세 `157:11661` 항목 구성을 따른다).
- 바깥 클릭 또는 `Escape` → 메뉴가 닫힌다. `Escape` 로 닫으면 초점이 `⋮` 로 돌아온다(개체관리 케밥 공통).
- `수정` → 관찰 기록 수정 화면(`…/observations/:observationId/edit`)으로 이동한다.
- `삭제` → 메뉴가 닫히고 삭제 확인 모달이 열린다.

### 삭제

- 삭제 확인 모달은 기존 `DeleteConfirmationDialog` 를 그대로 쓴다: 제목 `정말 삭제하시겠습니까?`,
  본문 `삭제하신 뒤에는 영구삭제되며` / `복구 할 수 없습니다`, 버튼 `취소` / `확인`.
  (2026-09-15 Figma·저장소 근거 판단: 관찰 삭제 프레임이 없고, 개체 삭제 모달 `610:14140` 문구는 개체 전용이다. 관찰 기록은 하위 데이터가 없다).
- `취소` / `Escape` → 모달이 닫히고 상세 화면이 그대로 남으며 초점이 `⋮` 로 돌아온다.
- `확인` → 관찰 기록을 삭제하고 개체 상세(`/species/:speciesId/individuals/:individualId`)로 이동한다.
  개체 상세가 `데이터 삭제에 성공했습니다` 토스트를 띄우고, 관찰 기록 표에서 그 행이 사라진다.
- 삭제 실패 → 모달을 닫고 이 화면에 `데이터 삭제에 실패했습니다` 토스트를 띄운다. 화면은 그대로 두고 초점은 `⋮` 로 돌아온다.
- 삭제 처리 중에는 `취소`·`확인` 이 비활성(`확인` 라벨 `삭제 중`)이고 `Escape` 로 닫히지 않아 요청이 중복 전송되지 않는다(`DeleteConfirmationDialog` 기존 동작).

## 화면 구조와 시각 규격

1920px 데스크톱 기준. 본문 폭 1320px, 좌측 x300(중앙 정렬). 페이지 배경 `colors.background`(`#F5F5F7`). 프레임 높이 653.
좌상단 메뉴 버튼(`1323:15016`, 36×36 @36,32)은 기존 사이드바를 재사용한다. 좌표는 프레임 기준 `@x,y`.

1. 뒤로가기(`1323:15018`, @300,75 1320×36): chevron 36 + `뒤로가기` 24 SemiBold `colors.textGuide`, 간격 10 — 기존 `BackLink`.
   링크 영역은 글자 폭에 맞춘다(TaskReportDetailPage `DetailBackLink` 와 같다).
2. 제목 행
   - 제목(`1323:15070`, @300,144 h48): 40 Medium, line-height normal, `colors.textStrong`(`#36363F`). 뒤로가기 아래 33px.
   - 케밥(`1323:15073`, @1576,148 44×52): 우측 끝이 본문 우측(x1620)에 맞는다. 케밥 윗변이 제목 윗변보다 4px 아래.
   - 제목 최대 폭: 본문 1320 − 케밥 44 − 간격 24 = 1252. 텍스트 박스 폭 2283.6 은 따르지 않는다(검증 상태 참고).
3. 날짜·관찰자 행(@y204 h29, 제목 아래 12px): `2026.06.01`(`1323:15071`, @300 w129) · `김유영`(`1323:15072`, @449 w67).
   둘 다 24 Medium, line-height normal, `colors.textGuide`(`#848491`). 두 텍스트 간격 20px.
4. 카드 묶음(`1323:15019`, @300,260 1320×313): 세로 flex, 카드 간격 16px. 날짜·관찰자 행 아래 27px. 프레임 하단 여백 80px.
5. `관찰사항` 카드(`1323:15038`, 1320×134): 배경 `colors.surface`, radius 20, padding 28px(상하) / 32px(좌우), 세로 간격 12.
   - 라벨 `관찰사항`(`1323:15040`): 32 Medium, line-height normal(h39), `colors.textStrong`.
   - 본문(`1323:15042`, @32,79 w1256 h27): 22 Medium, line-height normal, `colors.textStrong`.
6. `첨부` 카드(`1323:15043`, @y150 1320×163): 5와 같은 카드 규격. 라벨 `첨부`(`1323:15045`) 32 Medium `colors.textStrong`.
   - 파일 칩(`1323:15046`, @32,79 172×56): 테두리 1px `colors.textFaint`(`#AFAFBA`), **radius 0**, padding 16px(상하) / 12px(좌우), 가로 간격 8.
     확장자 아이콘 `teenyicons:jpg-solid` 20×20 @12,18 · 파일명 16 Medium `colors.textStrong` @40 · 다운로드 `material-symbols:download` 24×24 @136,16.
   - 칩 여러 개의 간격: 기존 `AttachmentList` 의 16px 줄바꿈 나열(Figma 근거 없음). 참고로 popover `970:26527` 은 세로 쌓기 간격 8px 이다.
   - 첨부 없음: 칩 자리 `—` 20px Medium `colors.textFaint`(관찰 표 `127:9223` 규격).
7. 케밥 메뉴(근거: `157:11661`, 180×116): 배경 `colors.surface`, 테두리 1px `colors.tableHeaderStrong`(`#DDDDE3`), radius 12,
   padding 8px 0, 항목 간격 4, 항목 h48 좌우 padding 20, 20 Medium. `수정` `colors.textStrong` / `삭제` `colors.danger`.
   그림자 `0 8px 12px rgba(0,0,0,0.14)`. 위치는 개체관리 케밥 공통 배치(트리거 하단 8px·우측 끝 정렬 — `KebabMenu` 배치 옵션)를 쓴다.
   이 화면은 케밥 우측 끝이 본문 우측 끝(x1620)과 같다. **이 화면의 열림 프레임은 없어 미검증.**
8. 삭제 확인 모달·토스트: 기존 `DeleteConfirmationDialog`(600 폭, radius 20) · `Toast`(@1432,32 440×80) 규격 그대로.

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.

### 신규 semantic color 토큰

없다. `map-tokens` 결과 solid color 4개 모두 기존 토큰과 일치한다(`#36363F` textStrong · `#848491` textGuide ·
`#AFAFBA` textFaint · `#F5F5F7` background). 카드 배경 `bg-white` 는 `surface`(`#FFFFFF`)다.
확장자 아이콘은 Figma 아이콘 에셋 내부 색을 그대로 쓴다(SVG 내부 색 — map-tokens 수집 대상 아님).

## 데이터

```ts
// entities/observation — 개체관리 공통 모델(individual-detail 소유)
interface Observation {
  id: string
  individualId: string
  title: string // 제목
  observedAt: string // 날짜 YYYY-MM-DD, 표시 YYYY.MM.DD
  observerName: string // 관찰자
  content: string // 관찰사항
  attachments: { fileName: string; fileKey: string }[] // 첨부
}
```

- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- **관찰 mock(`entities/observation/model/mock.ts`)은 `individual-detail` spec 이 명세한다.**
  이 spec 은 그 명세의 함수·키·fixture 이름을 그대로 참조한다(2026-09-15 정합화).
  - 조회: `getMockObservation(observationId): Promise<Observation | null>` — query key `['observations', observationId]`.
    경로 체인 검증용으로 `getMockIndividual(individualId)`(species-detail 명세, query key `['individuals', individualId]`)도 조회한다.
    관찰이 `null`(없는 id, 삭제된 관찰, 소속 개체가 없는 관찰)이거나 `individualId`·개체의 `speciesId` 가 경로와 다르면 없는 관찰로 처리한다.
  - 삭제: `deleteMockObservation(observationId): Promise<void>` — 개체 상세 행 삭제와 같은 함수다.
    성공 시 단건 캐시(`['observations', observationId]`)를 먼저 제거하고 `['observations']` 를 무효화한 뒤 개체 상세로 이동한다
    (`TaskDetailPage` 규칙 승계 — 삭제된 id 를 다시 조회하지 않게 한다).
  - 이동 state: `navigate('/species/:speciesId/individuals/:individualId', { state: { toast: 'delete-success' } })` — `individual-detail` S29 가 받는다.
  - 삭제 영속·실패 주입(`individual-detail` 명세 키): `deletedObservationStorageKey`(`toyvillage:observations:deleted`, 삭제된 id 목록),
    `observationFailStorageKey`(`toyvillage:observations:fail`) = `'delete'`(다음 관찰 삭제 한 번 실패).
  - 삭제 지연 주입: 없다. 저장소 mock 에 지연 주입 선례가 없어 추가하지 않았다(지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 연쇄 삭제(mock, 개체관리 공통): 연쇄 삭제 기록을 따로 쓰지 않고 조회에서 뺀다. `getMockIndividuals` / `getMockIndividual` 은 삭제된 개체와
  삭제된 종(`getMockSpecies(speciesId)` 가 `null`)의 개체를 빼고(`null`), `getMockObservations` / `getMockObservation` 은 소속 개체가 없는
  (`getMockIndividual(individualId)` 가 `null`) 관찰을 뺀다(`null`). entities → entities import 는 ESLint 가 허용한다. 실제 연쇄 삭제는 서버 책임이다.
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
  이 화면은 삭제 실패(`delete-error`)만 화면 안에서 띄운다.
- 이 spec 이 쓰는 fixture(`individual-detail` 관찰 mock 표 기준):
  - 관찰 `1`(개체 `1` 동식이, 종 `1` 카피바라): 2026-06-01 · 김유영 · 제목 `얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음` ·
    첨부 3개 `상처사진.jpg`, `상처사진_측면.jpg`, `처치기록.pdf`. `content` 는 제목과 같은 문장이다(Figma `1323:15042` 근거).
  - 관찰 `2`: 2026-05-10 · 김유영 · 제목 `배변상태 평소보다 조금 묽음` · 첨부 `배변사진.jpg` 1개.
  - 관찰 `3`: 2026-04-22 · 김유영 · 제목 `식욕 정상, 활동량 양호` · 첨부 없음.
  - `fileKey` 는 `mock-observation-{id}-{순번}` 형식이다. 다운로드 mock 은 파일명만 쓴다.
- 날짜 표시 변환(`YYYY-MM-DD` → `YYYY.MM.DD`): 저장소에 shared 날짜 유틸이 없고 entity 마다 둔다(`entities/work-log/model/date.ts` 등).
  `entities/observation/model` 에 둔다.
- 클라이언트 상태: 없음(케밥 열림·모달·토스트는 페이지 로컬 상태).

## 컴포넌트 구조/props

- `ObservationDetailPage` — `pages/species`. 라우트 파라미터 3개, 조회·삭제, 케밥·삭제 모달·토스트 상태 소유. **신규.**
- `BackLink { to }` — `shared/ui` 기존 재사용(Figma `back` `1:10470` 인스턴스).
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
  이 화면은 관찰 삭제라 `description` 을 넘기지 않는다.
- `Toast { variant, message, onDismiss }` — `shared/ui` 기존 재사용.
- 섹션 카드(`관찰사항`·`첨부` 공통: padding 28/32, gap 12, 라벨 32) — Figma `FRAME` 이라 컴포넌트 경계가 아니다.
  - 페이지 로컬 styled(`ObservationDetailPage` 안)로 둔다. 공용화하지 않는다 (2026-09-15 Figma·저장소 근거 판단: FRAME 이고, 조회 카드 라벨은 폼 `label` 이 아니라 `h2` 라 `FormFieldCard` 와 역할이 다르다).
- 첨부 칩 — **재사용 우선 검토 결과**:
  - 기존 `shared/ui/AttachmentList { fileNames, label }` 의 칩(h56, 좌우 padding 12, 간격 8, 테두리 `textFaint`, radius 0, 파일명 16 Medium, 다운로드 24)이 Figma 칩과 같다.
  - 그러나 카드 규격이 다르다: `AttachmentList` 는 라벨 24 `colors.text`·padding 24/40/16·간격 8·빈 문구 `첨부된 자료가 없습니다.`,
    Figma 는 라벨 32 `colors.textStrong`·padding 28/32·간격 12·빈 상태 근거 없음. 파일명 색도 `text`(#000) vs `textStrong`(#36363F)이다.
  - 같은 칩이 `observation list` 셀 `127:9193`, 첨부 popover `970:26527`, 관찰 수정 `1284:15038`(삭제 아이콘 추가)에도 나온다.
  - 결정: 칩을 신규 공용 `src/shared/ui/AttachmentChip { fileName, onDownload, onRemove? }` 로 두고(게이트 ② 채택), 이 화면은 섹션 카드 안에
    `AttachmentChip` 을 `onRemove` 없이 나열한다. 기존 `AttachmentList`(텍스트 배지)는 바꾸지 않는다.
    `individual-detail`·`observation-edit` 과 같은 이름·props 다(표 셀 `ObservationAttachmentCell`·첨부 팝오버·관찰 수정 `AttachmentField` 가 같은 칩을 쓴다).
    다운로드 헬퍼(`downloadFile`, 현재 `AttachmentList` 비공개 함수)도 함께 옮긴다.
- 확장자 아이콘: Figma `teenyicons` 아이콘을 쓴다 — `src/features/create-resource/ui/assets/file-*.svg` 를 `shared/ui/assets` 로 옮겨 `AttachmentChip` 이 공유한다(게이트 ② 채택, 에셋 이동은 ③).
- 다운로드 아이콘: 기존 `AttachmentList` 의 인라인 SVG 를 쓴다. `material-symbols:download` 에셋은 저장소에 없다.

## 접근성

- 제목은 페이지의 `h1`, 카드 라벨 `관찰사항`·`첨부` 는 `h2` 다.
- 날짜는 `<time dateTime="YYYY-MM-DD">` 로 표시값과 기계 판독값을 함께 준다. 날짜·관찰자는 스크린리더가 구분할 수 있게 접근 가능한 이름(`관찰 날짜`·`관찰자`)을 제공한다.
- 케밥은 `aria-haspopup="menu"` / `aria-expanded`, 메뉴는 `role="menu"`, 항목은 `role="menuitem"` 이다.
  접근 가능한 이름은 `{제목} 관찰 기록 메뉴 열기` 다(개체 상세 `{관찰 제목} 관찰 메뉴 열기` 와 같은 형식).
- 삭제 확인 모달은 열릴 때 초점을 가두고, 닫히면 초점을 `⋮` 로 되돌린다.
- 다운로드 버튼의 접근 가능한 이름에 파일명을 포함한다(`{파일명} 다운로드` — 기존 `AttachmentList` 규칙).
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- Figma 근거가 없어 기존 상세 화면의 980px 기준을 승계한다(결정 사항).
- 980px 이하에서는 카드 padding 을 24px 로 줄이고, 제목은 줄바꿈하며 케밥은 제목 행 우측에 유지한다.
- 칩은 줄바꿈해 나열한다. 긴 파일명은 칩 안에서 말줄임한다(기존 `AttachmentList` 규칙).
- 컨트롤 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

fixture 는 종 `1` / 개체 `1` / 관찰 `1`(첨부 3) · 관찰 `3`(첨부 없음) 기준이다. 경로 `…` 는 `/species/1/individuals/1/observations`.

- S1: `…/1` 진입 → 뒤로가기·제목 `얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음`·`2026.06.01`·`김유영`·`관찰사항` 카드·`첨부` 카드가 보인다.
- S2: 관찰 `1` 의 `첨부` 카드 → `상처사진.jpg`·`상처사진_측면.jpg`·`처치기록.pdf` 칩 3개가 모두 보이고(`외 N개` 없음) 각 칩에 `{파일명} 다운로드` 버튼이 있다.
- S3: `상처사진.jpg 다운로드` 클릭 → `상처사진.jpg` 파일이 내려받아진다.
- S4: `뒤로가기` 클릭 → 확인 없이 `/species/1/individuals/1` 로 이동한다.
- S5: `⋮` 클릭 → `수정` / `삭제` 메뉴가 열린다.
- S6: 메뉴 `수정` 클릭 → `…/1/edit` 로 이동한다.
- S7: 메뉴 `삭제` 클릭 → `정말 삭제하시겠습니까?` 확인 모달이 열린다.
- S8: 모달 `확인` → `/species/1/individuals/1` 로 이동하고 `데이터 삭제에 성공했습니다` 토스트가 뜨며 표에서 그 관찰 행이 사라진다.
- S9: 첨부가 없는 관찰 `3` 진입 → `첨부` 카드는 보이고 칩 자리에 `—` 가 보인다.
- S10: 메뉴가 열린 상태에서 바깥 클릭 / `Escape` → 메뉴가 닫히고, `Escape` 면 초점이 `⋮` 로 돌아온다.
- S11: 모달 `취소` → 모달이 닫히고 상세 화면이 그대로 남으며 초점이 `⋮` 로 돌아온다.
- S12: 삭제 실패 조건(`toyvillage:observations:fail` = `'delete'`)에서 `확인` → 상세 화면에 `데이터 삭제에 실패했습니다` 토스트가 뜨고 화면이 유지된다.
- S14: 없는 관찰 id 로 진입 → `관찰 기록을 찾을 수 없습니다.` 와 `개체 상세로 돌아가기` 링크가 보인다.
- S15: 다른 개체 경로(`/species/1/individuals/2/observations/1`) 또는 다른 종 경로(`/species/2/individuals/1/observations/1`)로 진입 → S14 와 같은 안내가 보인다.
- S16: 키보드만으로 뒤로가기·케밥 열기·메뉴 항목 실행·다운로드 버튼 실행을 할 수 있고 포커스 표시가 outline 으로 보인다.

(S13 삭제 중복 요청 방지는 삭제 — 번호 공백 유지. 사유는 결정 사항과 시나리오 초안 승인 메모.)

## 결정 사항

- 라우트는 `/species/:speciesId/individuals/:individualId/observations/:observationId`, 수정은 `…/edit` 다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 공통 라우트, 사이드바 활성 판정).
- 상세는 읽기 전용이다. 웹에서 관찰 기록을 등록하는 진입점을 만들지 않는다 (2026-09-15 Figma·저장소 근거 판단: 웹 관찰 등록 프레임 없음, 앱 섹션 `1:755`).
- 뒤로가기·삭제 성공은 개체 상세로 간다 (2026-09-15 Figma·저장소 근거 판단: `task-detail` 삭제 후 부모 이동 규칙).
- 삭제 모달은 기존 `DeleteConfirmationDialog` 기본 문구를 쓴다 (2026-09-15 Figma·저장소 근거 판단: 관찰 삭제 프레임 없음, 개체 삭제 문구 `610:14140` 은 개체 전용).
- 상세 첨부는 `외 N개` 로 줄이지 않고 전부 가로 줄바꿈(간격 16px)으로 보인다 (2026-09-15 Figma·저장소 근거 판단: Figma 상세에 `외 N개` 없음, `AttachmentList` 배치).
- 첨부가 없으면 `첨부` 카드를 유지하고 `—` 를 보인다 (2026-09-15 Figma·저장소 근거 판단: 관찰 표 첨부 셀 `127:9223` 표기).
- 제목·관찰사항은 자르지 않고 줄바꿈한다. 관찰사항은 줄바꿈을 보존한다. 제목 텍스트 박스 폭 2283.6 은 무시한다 (2026-09-15 Figma·저장소 근거 판단: 렌더 글자 x300~975, task-report 상세 내용 카드).
- 없는 id 와 경로 체인 불일치(관찰 ↔ `individualId`, 개체 ↔ `speciesId`)는 `관찰 기록을 찾을 수 없습니다.` + `개체 상세로 돌아가기` 로 처리한다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage` not-found 패턴, 개체 상세·관찰 수정과 같은 체인 검증).
- `관찰사항`·`첨부` 섹션 카드는 페이지 로컬 styled 로 둔다(공용화 안 함) (2026-09-15 Figma·저장소 근거 판단: FRAME 이고 조회 카드 라벨은 `h2`).
- 첨부 칩은 신규 공용 `AttachmentChip`(Figma 유형 아이콘, `onRemove` 없음)을 쓰고 기존 `AttachmentList` 는 바꾸지 않는다 (2026-09-15 Figma·저장소 근거 판단: design-rules §1 같은 칩이 관찰 표·팝오버·관찰 수정에도 있다).
- 제목·관찰사항이 같은 문자열인 Figma 값은 fixture 로만 쓴다. 두 필드는 별도다 (2026-09-15 Figma·저장소 근거 판단: 관찰 표 헤더 `제목`·관찰 수정 `제목` 카드).
- 없는 id 는 `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크(종 `목록으로 돌아가기` · 개체 `종 상세로 돌아가기` · 관찰 `개체 상세로 돌아가기`)로 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage`·`EditTaskPage` not-found 패턴).
- 케밥 메뉴는 `src/shared/ui/KebabMenu` 에 `Escape` 초점 복귀·트리거 ref 노출(`onTriggerRef`)·배치 옵션(트리거 하단 8px·우측 끝 정렬)을 보강해 쓴다 (2026-09-15 Figma·저장소 근거 판단: 케밥 메뉴 set `141:9597` 규격이 `KebabMenu` 와 일치, design-rules §1 같은 INSTANCE 2곳 이상 → 공용).
- 삭제 확인 모달은 `DeleteConfirmationDialog` 에 `description?: ReactNode` 를 추가해 종 삭제 `등록된 개체와 관찰 기록도 함께 삭제되며` · 개체 삭제 `등록된 관찰 기록도 함께 삭제되며`(둘째 줄 `삭제 후에는 복구할 수 없습니다`)를 쓰고, 관찰 삭제는 기본 문구를 쓴다 (2026-09-15 Figma·저장소 근거 판단: Figma `609:14119`·`610:14119` 문구, 관찰 삭제 프레임 없음).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- 종·개체 삭제는 모달 문구대로 하위 개체·관찰 기록을 함께 숨긴다. mock 은 조회 제외로 표현하고 실제 삭제는 서버 책임이다 (2026-09-15 Figma·저장소 근거 판단: 삭제 모달 문구 `609:14119`·`610:14119`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 글꼴은 Figma `Inter` 지정과 무관하게 기존 `font.body` 를 쓴다 (2026-09-15 Figma·저장소 근거 판단: 저장소 theme 단일 글꼴).
- 직원 권한별 케밥 숨김은 범위 밖이다 (2026-09-15 Figma·저장소 근거 판단: 웹은 관리자 로그인 전용(Notion `웹 관리자 로그인`), 직원은 앱을 쓴다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

없음. 게이트 ② 에서 이 화면의 미결을 모두 결정했다(2026-09-15). 남은 절차는 시나리오 승인(S1~S16, S13 제외)이다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
