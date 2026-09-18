---
feature: individual-form
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 71:8747
  relatedNodeIds:
    - 84:8848
    - 107:8848
    - 107:8905
    - 145:16016
requires_functional_test: true
paths: src/pages/species, src/features/individual-form, src/entities/individual
---

# 개체 등록·수정 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 등록·수정`(`311:12785`).
- 등록 화면 기준: `71:8747` (`individual new`, 빈 폼). 폼은 컴포넌트 `individual / 개체 등록 폼`(`145:16016`)의
  INSTANCE(`145:16017`)다. 컴포넌트 설명: "2개 화면에서 반복: individual new, individual new (invalid - modal)".
- 수정 화면: `84:8848` (`individual edit`, 동식이 값이 채워진 폼). 폼이 INSTANCE 가 아닌 FRAME(`84:8854`)이지만
  카드 구성·순서는 `145:16016` 과 같다.
- 필수값 오류: 인라인 `107:8848` (`individual new (invalid)`) 채택 — 오류 스타일만 따르고 카드 순서는 `71:8747` 기준(2026-09-15 개발자 결정).
  모달 `107:8905` (`individual new (invalid - modal)`) 안은 폐기했다.
- 필드 컴포넌트: `field / 개체명`(`127:9364`) `성별`(`127:9376`) `출생연도`(`127:9384`) `기타정보`(`127:9390`)
  `사진`(`127:9358`), 드롭존 `upload file`(`1:10511` — 업무 폼과 같은 컴포넌트).
- 선택된 pill 표현 참고: `field / 분류`(`127:9342`, species-form 소유).
- 공통 브리프(개체관리 7개 spec 공통 기준): 라우트·데이터 모델·mock 소유권·공통 fixture 는 이 브리프를 따른다.
- 형제 계약: 종 상세 `species-detail.spec.md`(진입점·생성 성공 토스트 표시·개체 mock 소유),
  개체 상세 `individual-detail.spec.md`(수정 진입·저장 후 이동 대상), 종 등록·수정 `species-form.spec.md`(같은 필드 카드·사진 필드·pill 그룹).
- 참고 계약: `task-create.spec.md` / `task-edit.spec.md`(이탈 보호·중복 제출·저장 후 이동 규칙), `reservation-form`(인라인 오류 동작).
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context`(`71:8747`, `84:8848`, `107:8848`, `107:8905`, 참고 `127:9342`)와 `get_metadata`
(`71:8747`, `84:8848`, `107:8848`, `107:8905`, `145:16016`, `127:9376`, `127:9358`, `311:12785`)로 실측했다.
원문은 `harness/artifacts/publishing/individual-form.figma.txt`.

- **yot 실측 확인**: 카드 순서·크기·간격, 필드 라벨·placeholder·색, 성별 pill 크기·아이콘 색, 출생연도 `년` 접미사,
  사진 안내 문구·기존 사진 칩 구조, 드롭존 규격, 제출 버튼 라벨(`생성하기`/`저장하기`)·크기, 인라인 오류 줄 규격·문구 2종,
  검증 모달 규격·문구 1종(`개체명을 입력해주세요`), 제목·부제 문구.
- **Figma 에 없음(게이트 ② 결정으로 채움)**: 성별 pill 선택 상태, 출생연도·사진 오류 문구, 출생연도 범위, 사진 형식 제한·교체·오류 표시,
  저장 실패, 이탈 확인 모달, 수정 성공 토스트, 없는 종·개체 처리, 로딩 상태, 반응형·접근성 전체.

## 목적

운영 관리자가 한 종(예: 카피바라)에 속한 개체를 한 마리씩 등록하고, 이미 등록한 개체의 정보를 고친다.
개체명·성별·출생연도·대표 사진은 반드시 입력하고 기타정보는 선택이다. 실수로 이탈하거나 저장이 실패해도 입력을 잃지 않아야 한다.

## 범위

- 포함: 등록 빈 폼 진입, 수정 폼 복원, 개체명·성별·출생연도·기타정보 입력, 대표 사진 1장 등록·교체·다운로드,
  필수값·형식 인라인 검증, 생성·저장, 저장 실패 처리, 이탈 보호, 중복 제출 방지, 없는 종·개체 처리
- 제외: 실제 API 연동(`/api` 스킬 담당 — Notion 명세 DB 에 개체 API 없음, 2026-09-15 확인), 사진 파일 서버 업로드 본문,
  개체 삭제(`individual-detail`·`species-detail` 케밥 소관), 개체 상세 조회(`individual-detail`),
  종 상세의 개체 표·생성 성공 토스트 표시(`species-detail`), 관찰 기록(`observation-*`), 사이드바 메뉴(`species-list`·`sidebar.spec.md`)

## 라우트와 진입

라우트는 개체관리 공통 라우트다(사이드바 활성 판정이 prefix 기준이라 `/species` 아래 중첩).

| 화면 | 경로 | 진입 | `뒤로가기` | 성공 시 이동 |
| --- | --- | --- | --- | --- |
| 개체 등록 | `/species/:speciesId/individuals/create` | 종 상세 개체 섹션 헤더의 `개체 등록하기`(`species-detail` 소관) | `/species/:speciesId` | `/species/:speciesId` + 생성 성공 토스트 |
| 개체 수정 | `/species/:speciesId/individuals/:individualId/edit` | 개체 상세 케밥 `수정`, 종 상세 개체 표 행 케밥 `수정` | `/species/:speciesId/individuals/:individualId` | `/species/:speciesId/individuals/:individualId` |

- `뒤로가기` 는 입력(수정은 변경)이 있으면 이탈 확인을 거친다(아래 이탈 보호).
- 없는 `speciesId` / `individualId` 처리는 아래 `없는 종·개체` 절.

## 동작 (behavioral spec — source of truth)

### 제목과 부제

- 등록: 제목 `개체 등록`, 부제 `{국명}에 개체를 한 마리씩 등록합니다` (`71:8755`, 예: `카피바라에 개체를 한 마리씩 등록합니다`).
- 수정: 제목 `개체 수정`, 부제 `{국명} · {개체명}의 정보를 수정합니다` (`84:8893`, 예: `카피바라 · 동식이의 정보를 수정합니다`).
  - 부제의 `{개체명}` 은 **저장된 값**이다. 입력 중인 개체명을 따라 바뀌지 않는다(화면 대상 설명).
- `{국명}` 은 URL 의 `speciesId` 로 조회한 종의 `koreanName` 이다.

### 진입 기본 상태 (등록)

- 개체명은 비어 있고 placeholder `개체명을 입력해주세요` 를 보여준다.
- 성별 `암컷` / `수컷` / `미상` 은 **아무것도 선택되지 않는다**(`71:8747` 실측 — 세 pill 모두 미선택 표현).
- 출생연도는 비어 있고 placeholder `0000` 과 오른쪽 접미사 `년` 을 보여준다. 접미사는 값 유무와 상관없이 항상 보인다.
- 기타정보는 비어 있고 placeholder `기타정보를 입력해주세요` 를 보여준다.
- 사진 카드에는 라벨 `사진 *` 과 안내 `대표 사진 1장만 등록할 수 있습니다.` 만 있고 칩은 없다. 아래에 업로드 드롭존이 있다.
- 하단 버튼 라벨은 `생성하기` 다.

### 복원 (수정)

- 진입 시 저장된 값이 모두 채워진 상태로 보인다 — 개체명, 성별 pill 선택, 출생연도(4자리), 기타정보, 사진 칩.
  - 예(공통 fixture 개체 `1`): `동식이` / `수컷` 선택 / `2019` / `알락꼬리여우원숭이와 합사 중` / 칩 `동식이_2026.jpg`.
- **성별 선택 표시는 Figma 와 다르다**: `84:8848` 은 동식이(수컷)인데도 세 pill 을 모두 미선택으로 그렸다(컴포넌트 기본 모습).
  수정 폼은 저장값을 복원하므로 저장된 성별 pill 을 선택 상태로 보인다 (2026-09-15 Figma·저장소 근거 판단: 같은 섹션 `field / 분류` 는 선택 pill 을 그렸다, 폼 복원 규칙).
- 사진 칩은 저장된 대표 사진의 `photo.fileName` 과 다운로드·제거(✕) 컨트롤을 보여준다.
- 기타정보가 없는 개체는 기타정보가 빈 채 placeholder 를 보여준다.
- 하단 버튼 라벨은 **`저장하기`** 다(`84:8918`).

### 개체명

- 텍스트를 입력할 수 있다. 저장 시 앞뒤 공백을 제거하고, 공백만 있으면 빈 값으로 본다.
- 최대 길이 제한은 두지 않는다(미결 — Figma·API 명세 없음).

### 성별 (단일 선택 pill)

- `암컷` / `수컷` / `미상` 중 하나 클릭 → 그 항목만 선택 상태가 된다. 다른 항목을 누르면 선택이 옮겨간다.
- 선택된 항목을 다시 눌러도 해제되지 않는다(`task-create` 우선순위 규칙 승계).
- 각 pill 은 라벨 앞에 기호를 붙인다 — `♀`(암컷) / `♂`(수컷) / `?`(미상). 기호는 장식이고 의미는 라벨이 전달한다.

### 출생연도

- 숫자만 입력된다. 숫자가 아닌 문자는 입력되지 않고 최대 4자리까지만 받는다(`reservation-form` `digits` 서식 승계).
  - 예: `2019a7` 을 입력하면 `2019` 가 된다.
- 저장 시 4자리 숫자를 `number` 로 바꿔 보낸다.

### 기타정보

- 여러 줄 텍스트를 입력할 수 있다(선택 항목). 저장 시 앞뒤 공백을 제거하고, 비면 값 없이 보낸다.
- 입력 영역 높이는 Figma 의 160px 로 고정하고 넘치면 영역 안에서 스크롤한다(Figma 고정 높이 박스).

### 사진 (대표 사진 1장)

- 드롭존 클릭 → 파일 선택 창이 열린다(한 개만 고를 수 있다). 파일을 드롭존에 끌어다 놓아도 된다.
- 이미지 파일(MIME `image/*`) 하나를 올리면 → 사진 카드에 chip(유형 아이콘 → 다운로드 → 파일명, Figma `1057:14773` 순서)이 나타난다. 드롭존은 계속 보인다.
- 사진이 이미 있는 상태에서 새 이미지를 올리면 → 기존 사진을 **교체**한다. chip 은 항상 최대 1개다.
- chip 에는 제거(✕) 버튼이 있다. 아이콘은 평소 회색(`colors.textGuide`)이고 hover·focus 에서 빨강(`colors.danger`)이다. 지우면 사진이 없는 상태가 되고, 사진은 필수라 그대로 제출하면 `사진을 등록해주세요!` 줄이 보인다 (2026-09-18 개발자 결정, 이슈 #149).
- chip 의 다운로드 컨트롤 클릭 → 그 파일을 내려받는다(mock: 새 파일은 원본, 기존 사진은 파일명을 담은 임시 Blob — `AttachmentList` 규칙 승계).
- 거부하면 기존 사진을 그대로 두고 드롭존 아래에 오류 문구를 인라인 `role="alert"` 로 보인다 (2026-09-15 Figma·저장소 근거 판단: `AttachmentField` 오류 문구 위치·문구 계열).
  여러 조건에 걸리면 아래 순서의 첫 문구 하나만 보인다.
  - 한 번에 2개 이상 → `대표 사진은 1장만 등록할 수 있습니다.`
  - 이미지가 아닌 파일 → `이미지 파일만 등록할 수 있습니다.`
  - 50MB 초과 → `<파일명>은 50MB를 초과해 첨부할 수 없습니다.`
- 다음 업로드가 성공하면 거부 문구는 사라진다.
- 사진 등록 성공·실패 토스트는 띄우지 않는다(개체관리 Figma 토스트 섹션 `311:12786` 에 첨부 토스트 없음).

### 검증 (생성하기 / 저장하기)

필수: 개체명, 성별, 출생연도, 사진. 기타정보는 선택이다.

- 필수값 오류는 **인라인**으로 보인다 (2026-09-15 개발자 결정). `ValidationDialog` 는 쓰지 않는다(Figma `107:8905` 모달안은 폐기).
  기존 `src/features/reservation-form` 패턴(`model/validation.ts` `validateReservationForm` · `scrollToFirstError`, `ui/fields.tsx` `LabeledField` `ErrorRow`)을 그대로 따른다.
  - 제출 버튼을 누를 때만 전체를 검증한다. 요청을 보내지 않고, 실패한 **모든** 항목의 카드 바로 아래에 오류 줄을 한꺼번에 보인다.
  - 값을 고쳐도 오류 줄은 바로 사라지지 않는다. 다음 제출 때 다시 검증해 통과한 항목의 줄만 사라진다.
  - 첫 오류 줄 위치로 부드럽게 스크롤한다(`scrollIntoView({ behavior: 'smooth', block: 'center' })`). **포커스는 옮기지 않는다.**
  - 오류 줄은 `role="alert"` 와 id 를 갖고 해당 입력의 `aria-describedby` 로 연결한다(기존 구현에는 `aria-invalid` 가 없어 쓰지 않는다).
- 오류 줄과 문구(카드 순서 `71:8747` — 개체명 → 성별 → 출생연도 → 기타정보 → 사진) (2026-09-15 개발자 결정):

| 카드 | 조건 | 오류 줄 문구 | 근거 |
| --- | --- | --- | --- |
| `field / 개체명` 아래 | 개체명 빈 값(공백만 포함) | `개체명을 입력해주세요!` | Figma `107:8848` |
| `field / 성별` 아래 | 성별 미선택 | `성별을 선택해주세요!` | Figma `107:8848` |
| `field / 출생연도` 아래 | 출생연도 빈 값 | `출생연도를 입력해주세요!` | 같은 형식 확장 |
| `field / 출생연도` 아래 | 4자리가 아니거나 1900 미만·올해 초과 | `올바른 출생연도를 입력해주세요!` | 같은 형식 확장(1900~올해) |
| `field / 사진` 아래(드롭존 위) | 사진 없음 | `사진을 등록해주세요!` | 같은 형식 확장 |

- 오류 줄이 붙는 입력: 개체명·출생연도 input, 성별 `fieldset`, 사진 `사진 업로드` 버튼이 각 오류 줄을 `aria-describedby` 로 가리킨다.
- Figma `107:8848` 은 카드 순서가 옛 배치(사진·드롭존이 맨 위)라 오류 줄 **스타일만** 따른다. 모달 `107:8905` 안은 폐기했다.

### 생성·저장

- 모든 검증을 통과한 상태에서 `생성하기` / `저장하기` → 요청을 **한 번만** 보낸다. 요청 중에는 버튼을 비활성화하고
  라벨을 `생성 중` / `저장 중` 으로 바꿔 중복 제출을 막는다(`TaskForm` 규칙 승계).
- 생성 성공 → 개체 목록·종 query 를 갱신하고 `/species/:speciesId`(종 상세)로 이동한다.
  종 상세가 `데이터 생성에 성공했습니다` 토스트(Figma `71:8888` 문구)를 띄운다 — `navigate('/species/:speciesId', { state: { toast: 'create-success' } })`
  (토스트 표시는 `species-detail` 소관). 새 개체는 종 상세 개체 표 기본 최신순이라 1페이지 첫 행에 놓인다.
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
- 수정 성공 → 개체 query 를 갱신하고 `/species/:speciesId/individuals/:individualId`(개체 상세)로 이동한다.
  **수정 성공 토스트는 띄우지 않는다**(결정 사항).
- 저장 실패 → 현재 URL 과 모든 입력(사진 포함)을 보존하고 버튼 위에 `생성하지 못했습니다. 다시 시도해 주세요.`(등록) /
  `저장하지 못했습니다. 다시 시도해 주세요.`(수정)를 `role="status"` 로 보인다(20px Medium `colors.danger`). 버튼은 다시 누를 수 있다
  (`TaskForm` `SubmitStatus` 승계 — Figma 없음). `ErrorDialog` 는 쓰지 않는다.

### 이탈 보호

- 등록: 개체명·출생연도·기타정보 중 하나라도 입력했거나, 성별을 골랐거나, 사진을 등록한 상태에서
  `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 → `LeaveConfirmationDialog` 를 띄운다.
- 수정: 저장된 값과 하나라도 달라진 상태(사진 교체 포함)에서 같은 이동 → `LeaveConfirmationDialog` 를 띄운다.
  바뀐 값이 없으면 확인 없이 바로 이동한다.
- 모달 `취소` 또는 `Esc` → 현재 화면과 입력을 유지한다. `확인` → 이동한다.
- 새로고침·탭 닫기는 브라우저 기본 확인(`beforeunload`)을 띄운다.
- 생성·저장 성공에 의한 이동은 이탈 확인 대상에서 제외한다.
- 개체관리 Figma 에 이탈 모달 프레임이 없다. 문구·버튼은 기존 `LeaveConfirmationDialog` 를 그대로 쓴다(같은 yot 파일 업무 수정 `really exit?` `1:3606` 승계).

### 없는 종·개체

- 로딩 중 → 폼 대신 상태 카드를 보여준다 — 등록 `종 정보를 불러오는 중입니다.` / 수정 `개체를 불러오는 중입니다.`(`EditTaskPage` 규칙 승계).
- 기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴(`<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크)을 따른다. 종의 부모는 목록이라 기존 문구 `목록으로 돌아가기` 를 그대로 쓴다.
- 등록·수정 공통: `speciesId` 에 해당하는 종이 없으면 → `종을 찾을 수 없습니다.` 와 `목록으로 돌아가기`(`/species`) 링크를 보여준다.
- 수정: 종은 있는데 `individualId` 개체가 없거나 그 개체가 다른 종 소속이면 → `개체를 찾을 수 없습니다.` 와
  `종 상세로 돌아가기`(`/species/:speciesId`) 링크를 보여준다.
- 이 상태에서는 폼·이탈 보호가 없다.

## 화면 구조와 시각 규격

1920px 기준, 본문 너비 1320px 중앙 정렬(@x=300). 페이지 배경 `colors.background`.
좌상단 메뉴 버튼(`36×36 @36,32`)은 기존 사이드바를 재사용한다.
Figma 폰트는 Inter / Wanted Sans 가 섞였지만 코드에서는 `theme.font.body` 하나를 쓴다(기존 화면 규칙).

1. `뒤로가기`(`back` INSTANCE, `@300,75` 1320×36) — 기존 `BackLink` 재사용. chevron 36px + 24px SemiBold `colors.textGuide`, gap 10.
2. 제목(`71:8754`, `@300,144` 높이 48) — 40px Medium `colors.text`.
3. 부제(`71:8755`, `@300,200` 높이 29) — 24px Medium `colors.textGuide`. 제목과 부제 사이 8px, 부제와 폼 사이 31px.
4. 폼(`individual / 개체 등록 폼`, `@300,260` 1320 폭) — 세로 flex, **카드 간 간격 16px**(업무 폼 32px 과 다름).
   등록 1143 높이(사진 칩 없음) / 수정 1218.75 높이(사진 칩 있음).
   - **필드 카드 공통**: 1320 폭, padding 28px/32px, radius 20px, 배경 `colors.surface`, 라벨↔입력 gap 12px.
     라벨 20px Medium `colors.text`(높이 24), 필수 별표 `*` 20px Medium `colors.danger`, 라벨과 별표 사이 6px.
   - **텍스트 입력 공통**: 1256×66 @32,64, radius 8px, 배경 `colors.background`, padding-x 24px, 세로 가운데 정렬.
     값 24px Medium `colors.textStrong`, placeholder 24px Medium `colors.textGuide`.
5. `field / 개체명`(1320×158 @y=0) — 라벨 `개체명 *`, 텍스트 입력(placeholder `개체명을 입력해주세요`).
6. `field / 성별`(1320×147 @y=174) — 라벨 `성별 *`, pill 그룹 @32,64(384×55), pill 간 gap 10px.
   - pill: 높이 55, padding 14px/32px, radius 100px, 내용 hug(암컷 120.5 / 수컷 123.1 / 미상 120.5), 기호↔라벨 gap 6px, 22px.
   - 미선택(실측): 배경 `colors.surface`, 테두리 1px `colors.dialogBorder`(#C6C6CE), 라벨 Medium **#70707D(신규 토큰 `color.choiceMuted`)**.
   - 기호 색(실측): `♀` `colors.danger` / `♂` `colors.accent` / `?` `colors.textGuide`, 22px Regular.
   - **선택(성별 선택 프레임 없음 — `field / 분류` `127:9342` 선택 pill 승계)**: 배경 `colors.textStrong`(#36363F), 테두리 없음,
     라벨 `colors.surface`(흰색). 선택 시 기호도 흰색으로 둔다(짙은 배경 위 `accent`·`danger` 기호 대비가 낮다 — ⑦ 육안 확인).
7. `field / 출생연도`(1320×158 @y=337) — 라벨 `출생연도 *`(라벨 텍스트 폭 76), 텍스트 입력(placeholder `0000`),
   접미사 `년` 22px Medium `colors.textGuide` 우측 끝(@x=1212, padding-right 24). 입력과 접미사 사이 gap 10px.
8. `field / 기타정보`(1320×251.75 @y=511) — 라벨 `기타정보`(별표 없음), textarea 1256×160 @32,63.75,
   radius 8px, 배경 `colors.background`, padding 20px/24px, 값 22px Medium `colors.textStrong`,
   **placeholder 22px Medium `colors.textFaint`(#AFAFBA)** — 개체명·출생연도 placeholder(`textGuide`)와 색이 다르다(실측 그대로).
9. `field / 사진`(등록 1320×108 / 수정 1320×184, @y=778.75) — padding 28px/32px, 라벨 그룹↔칩 gap 20px.
   - 라벨 그룹(1256×52): 라벨 `사진 *` 20px Medium + 안내 `대표 사진 1장만 등록할 수 있습니다.` 18px Medium `colors.optionMuted`(#9999A5), gap 6px.
   - 칩(`uploaded file`, 204×56 @32,100 — 내용 hug): 테두리 1px `colors.textFaint`, radius 없음, padding 16px/12px, gap 8px.
     순서는 Figma 추출값 그대로 **유형 아이콘 20px → 다운로드 24px → 파일명 16px Medium `colors.textStrong`** 이고 제거 버튼은 없다
     (`84:8781`·`84:8848` 두 프레임이 같다, species-form 과 같은 `PhotoUploadField`). 관찰 첨부 칩(`1284:15038`)은 제거가 있는 다른 순서다.
   - 유형 아이콘은 Figma `teenyicons` 에셋(`features/create-resource/ui/assets/file-*.svg` 를 `shared/ui/assets` 로 옮겨 공유)을 쓴다.
10. `upload file`(1320×240, 사진 카드 바로 아래) — 배경 `colors.tableHeaderStrong`(#DDDDE3), 점선 테두리 2px
    — Figma `#5C5C68`, 구현은 기존 `AttachmentField` 드롭존의 `colors.textGuide`(새 토큰 없음 — 결정 사항), radius 20px,
    업로드 아이콘 48px + 안내 `파일을 끌어서 놓거나 클릭하여 업로드` / `(최대 50MB)` 18px Medium `colors.textGuide`, gap 12px.
    업무 폼과 **같은 컴포넌트**(`1:10511`)다 — 공용 `FileDropZone` 으로 추출한다(아래 컴포넌트 구조).
11. 제출 버튼(`71:8794` / `84:8917`, 123×61, 본문 우측 끝 정렬) — 배경 `colors.text`, radius 8px, padding 16px/20px,
    라벨 24px SemiBold `colors.surface`. Figma 는 폼 바로 아래(등록 +1px, 수정 −2.75px 겹침)에 붙였다(그리기 오차).
    **폼과 버튼 사이 간격은 22px** 로 둔다 (2026-09-15 Figma·저장소 근거 판단: 같은 섹션 종 생성 프레임 `68:8801` 실측 22px — `species-form` 과 같다).
12. 실패 문구: 버튼 위, 20px Medium `colors.danger`, `role="status"`(`TaskForm` `SubmitStatus` 승계).
13. 사진 거부 문구: 드롭존 아래 12px, 16px `colors.danger`, 가운데 정렬(`AttachmentField` `ErrorMessage` 승계).

### 인라인 오류 표현 (Figma `107:8848` 스타일 — 게이트 ② 채택, 2026-09-15 개발자 결정)

- 오류 줄(Figma `107:8777` 종 · `107:8848` 개체 실측): 해당 카드 **바로 아래**(폼 gap 16px 그대로) 1320×22, padding-left 32px, gap 8px.
  경고 원 22×22 radius 11px 배경 `colors.danger`, 가운데 `!` 14px SemiBold 흰색(@9,3) → 문구 18px Medium `colors.danger`.
  입력 박스 테두리는 바뀌지 않는다(Figma 오류 프레임의 입력은 기본 모습 그대로).
- 기존 `reservation-form` `LabeledField` 의 `ErrorRow`/`ErrorDot`(18px 원, 16px 문구)은 동작만 따르고 외형은 위 Figma 실측값을 쓴다.
- 모달 `107:8905`(560×320, `확인` 480×79) 규격은 쓰지 않는다(폐기).

색과 font family 는 기존 theme 를 우선한다. px·radius·rgba 는 Emotion 스타일에 직접 작성한다.

### 신규 semantic color 토큰 (게이트 ② 추가 확정)

`yarn harness:map-tokens individual-form` 결과 11색 중 9색은 기존 토큰과 일치, 2색(`#70707D`, `#5C5C68`)이 신규다.
개체관리 공통 신규 토큰(모든 개체관리 spec 같은 표):

| 값 | 토큰 | 용도 | 쓰는 spec |
| --- | --- | --- | --- |
| `#70707D` | `color.choiceMuted` | pill 미선택 글자(분류군·법정지정분류·성별). 기존 `optionMuted` 와 나란한 이름 | species-form, individual-form |
| `#5C5C68` | `color.textValue` | 종 상세 프로필 카드 정보 값 글자 | species-detail |
| `#8A5A00` | `color.warningText` | 법정지정분류 뱃지 글자(배경 `warningBg` 위) | species-detail |

- 드롭존 점선 테두리(Figma `#5C5C68`, `upload file` `1:10511`)에는 새 토큰을 만들지 않고 기존 업무 폼 구현(`AttachmentField` 드롭존 `colors.textGuide`)을 따른다. (확정)
- `#5C5C68` 은 `reservation-form` am/pm 열림 테두리가 토큰 없이 직접 쓰고 있다.

## 데이터

### 엔티티 (개체관리 공통 모델 — 필드명 고정)

```ts
// entities/individual (소유: species-detail spec)
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

### 폼 값 (features/individual-form)

```ts
// shared/ui/PhotoUploadField 가 정의하는 범용 타입(도메인 무관, species-form 과 공용)
interface PhotoValue {
  fileName: string // 칩에 보이는 이름
  file?: File // 이번에 새로 고른 파일
  url?: string // 수정 복원 시 저장된 photo.url
}

interface IndividualFormValues {
  name: string // 입력 원문(검증·제출 시 trim)
  sex: IndividualSex | null // 미선택 = null
  birthYear: string // 숫자 0~4자리 원문
  note: string // 입력 원문
  photo: PhotoValue | null // 미등록 = null
}

type IndividualFormErrors = Partial<Record<'name' | 'sex' | 'birthYear' | 'photo', string>> // 오류 줄 문구(카드 순서)
```

- 검증은 `features/individual-form/model/validation.ts` 의 순수 함수(`validateIndividualForm(values, currentYear): IndividualFormErrors`)로 둔다
  (`reservation-form` `validateReservationForm` 선례).

### mock 입력 (entities/individual/model, mock 경계)

`entities/resource` 의 `CreateResourceInput` 명명을 따른다(`*Request` 는 `/api` 연동 때 HTTP 요청 타입에 쓴다).

```ts
// 사진은 새 파일(생성·교체)이거나 저장된 사진 유지(수정)다. species-form 과 같은 형태.
type PhotoInput =
  | { kind: 'new'; file: File }
  | { kind: 'existing'; photo: { fileName: string; fileKey: string; url: string } }

interface CreateIndividualInput {
  speciesId: string
  name: string
  sex: IndividualSex
  birthYear: number
  note?: string // 비면 보내지 않는다
  photo: PhotoInput
}

interface UpdateIndividualInput {
  name: string
  sex: IndividualSex
  birthYear: number
  note?: string
  photo: PhotoInput
}
// 생성·수정·단건 조회 mock 은 `Individual` 을 돌려준다.
```

- 이번 슬라이스는 mock 이다. 실제 API·파일 업로드는 연결하지 않는다(`/api` 스킬 담당).
- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- 개체 mock(`entities/individual/model/mock.ts`)은 **species-detail spec 이 명세한다**. 이 spec 은 그 이름을 그대로 참조한다 —
  단건 조회 `getMockIndividual(individualId)`, 생성 `createMockIndividual(input: CreateIndividualInput)`,
  수정 `updateMockIndividual({ id, input }: { id: string; input: UpdateIndividualInput })`. 입력 형태는 이 spec 이 정한다.
- 종 조회(부제의 국명·없는 종 판정)는 `entities/species/model/mock.ts`(species-list 소유)의 `getMockSpecies(id)` 를 쓴다.
- mock 사진: 파일 본문은 저장하지 않는다. 새 파일은 mock 이 `fileKey`(`mock-individual-{id}`)와 표시용 `url` 을 발급하고 `fileName` 은 원본 파일명이다.
  개체 `1` 동식이의 fixture `photo.fileName` 은 `동식이_2026.jpg` 다(Figma `84:8848`, species-detail mock 명세).
- `getMockIndividual(individualId)` 는 없으면 `null` 을 준다(species-detail 명세). 수정 화면은 `null` 또는 `speciesId` 불일치를 없는 개체로 본다.
- 저장 실패 주입(species-detail 명세 키): `individualFailStorageKey`(`toyvillage:individuals:fail`)에 `create` / `update` 를 넣으면 다음 생성·수정이 한 번 실패한다
  (`resource` mock 의 `toyvillage:resources:fail` 패턴). 생성·수정 결과는 `individualStorageKey`(`toyvillage:individuals`)에 저장된다. 지연 주입 키는 두지 않는다.
- query key(species-detail 명세): 종 `['species', speciesId]`, 개체 목록 `['individuals', 'list', { speciesId }]`,
  개체 단건 `['individuals', individualId]`. 생성·수정 성공 시 `['species']`(마리수 파생)와 `['individuals']` 를 무효화한다.
- 클라이언트 전역 상태(Zustand)는 쓰지 않는다. 폼 상태는 컴포넌트 로컬 state 다.

## 컴포넌트 구조/props

기존 저장소 구현을 먼저 확인한 결과(근거는 `harness/artifacts/publishing/individual-form.component-map.md`):

- `CreateIndividualPage` — `pages/species`. `/species/:speciesId/individuals/create`. 종 조회·로딩/없는 종 상태·이탈 보호(`useBlocker`)·
  성공 이동을 조립한다(`CreateTaskPage` 구조 승계).
- `EditIndividualPage` — `pages/species`. `/species/:speciesId/individuals/:individualId/edit`. 종·개체 조회·없는 개체 상태·이탈 보호·성공 이동.
- `IndividualForm { mode: 'create' | 'edit'; speciesId: string; initialIndividual?: Individual; onCompleted: () => void; onDirtyChange: (isDirty: boolean) => void }`
  — **신규**, `features/individual-form/ui`. Figma COMPONENT `individual / 개체 등록 폼`(`145:16016`)의 코드 경계.
  등록·수정 공용이고 차이는 초기값과 제출 버튼 라벨뿐이다(`TaskForm` 구조 승계). 인라인 검증(오류 상태)·mutation 을 소유한다.
- `FormFieldCard { label?: string; required?: boolean; htmlFor?: string; hint?: string; error?: string; errorId?: string; children }` — **신규 공용**
  (`shared/ui`, 게이트 ② 채택 — `species-form`·`individual-form`·`observation-edit` 공통). 흰 카드(padding 28px 32px · radius 20px) +
  라벨 20px Medium(필수 별표) + 본문. `hint` 는 라벨 아래 18px 한 줄(간격 6px)이고 `aria-describedby` 로 연결한다. `error` 가 있으면 카드 바로 아래에 오류 줄을 그린다.
  - 라벨 행은 `FormFieldLabel { htmlFor?; required?; children }` 로 함께 내보낸다. 카드 하나에 라벨이 여럿이면(영문명 + 학명)
    `label` 없이 카드를 쓰고 안에서 `FormFieldLabel` 을 쓴다.
  - 분류군·성별 카드는 `label` 없이 카드를 쓰고 `PillRadioGroup` 이 같은 모양의 `legend` 를 그린다. `PhotoUploadField` 는 내부에서 이 카드를 쓴다.
  - 관찰 수정 라벨 32px 용 `labelSize?: 20 | 32`(기본 20)를 둔다(게이트 ② 채택).
  - 기존 `TaskForm` `SectionCard`(padding 40)·`reservation-form` `LabeledField`(라벨만, 카드 없음)는 규격이 달라 재사용하지 않는다.
- `PillRadioGroup { legend: string; required?: boolean; name: string; options: { value: string; label: string; icon?: ReactNode }[]; value: string | null; onChange: (value: string) => void; errorId?: string }`
  — **신규 공용(게이트 ② 채택)**, `shared/ui`. species-form 과 같은 시그니처다.
  `fieldset` + `legend`(라벨 20px + `required` 시 별표·`aria-required`) + native radio 를 시각 pill 로 그린다. `errorId` 는 오류 줄을 `aria-describedby` 로 연결한다.
  분류군 pill(`127:9342`)과 성별 pill(`127:9376`)이 같은 구조(padding 14/32 · radius 100 · gap 10 · 22px)라
  **species-form 분류군(`TaxonGroupField`)과 구현을 공유**한다(차이는 `icon` 유무).
  기존 유사 구현 `ResourceForm`/`NoticeForm` 의 `CategoryRadio`+`CategoryPill`(선택 `textStrong` 배경)과
  `TaskPriorityField`(252×68 고정폭, accent 선택)는 feature 로컬이고 규격이 달라 이관하지 않는다.
- `IndividualSexField { value: IndividualSex | null; onChange: (value: IndividualSex) => void; error?: string }`
  — **신규**, `features/individual-form/ui`. `FormFieldCard` + `PillRadioGroup`(`legend="성별"`, `required`, `name="individual-sex"`)에
  성별 옵션·기호(`♀♂?`)·기호 색을 채우는 얇은 래퍼(species-form `TaxonGroupField` 와 같은 층위).
- `BirthYearField { value: string; onChange; error?: string }` — **신규**, `features/individual-form/ui`. 텍스트 입력 + `년` 접미사 + 숫자 4자리 제한.
  `reservation-form` `TextInputField`(suffix·digits 서식 지원)가 가장 가깝지만 규격(값 22/접미사 28, 오류 테두리)이 달라 재사용하지 않고,
  서식 규칙만 승계한다.
- `PhotoUploadField { label: string; required?: boolean; hint?: string; value: PhotoValue | null; onChange: (value: PhotoValue) => void; error?: string; maxFileSize?: number }`
  (`PhotoValue = { fileName: string; file?: File; url?: string }`) — **신규 공용**(`shared/ui`, 게이트 ② 채택).
  Figma `field / 사진`(`127:9358`) + `upload file`(`1:10511`). `species-form`·`individual-form` 이 같은 인스턴스라 한 컴포넌트·같은 동작으로 둔다.
  도메인 타입에 의존하지 않는다. 내부에서 `FormFieldCard`(`label`·`required`·`hint`·`error`)를 쓴다.
  단일 이미지(`image/*`)·교체·chip(유형 아이콘 → 다운로드 → 파일명, 제거 버튼 없음)·드롭존·거부 문구를 소유한다. `maxFileSize` 기본값은 50MB 다. 드롭존은 `FileDropZone` 을 쓴다.
- `FileDropZone` — **신규 공용**(`shared/ui`, 기존 shared 변경 포함 — 게이트 ② 채택). Figma `upload file`(`1:10511`) INSTANCE 는
  지금 `AttachmentField` 내부 `DropZone` 에만 구현돼 있어 추출한다. 추출만으로는 `AttachmentField`(업무 폼) 외형·동작이 바뀌지 않는다
  (③ 에서 업무·공지·자료 화면 회귀를 확인한다). 클릭·드래그 앤 드롭·키보드 조작을 소유하고 고른 파일 목록을 호출부에 넘긴다(props 는 ③에서 확정).
  점선 테두리는 기존 `colors.textGuide` 를 쓴다(확정).
  - `AttachmentField` 확장(`maxFiles=1`/`accept`)은 다중 첨부 전제(`onFileItemsChange` 등 5개 콜백)와 달라 API 가 복잡해지므로 쓰지 않는다.
- `BackLink` / `LeaveConfirmationDialog` — 기존 재사용. `ValidationDialog` 는 쓰지 않는다(인라인 오류 — 개발자 결정).
- `Toast` — 이 화면에서는 쓰지 않는다(생성 성공 토스트는 종 상세가 띄운다).

## 접근성

- 개체명·출생연도 input, 기타정보 textarea 는 프로그램적 label 을 갖고 필수 항목은 `required`/`aria-required` 를 준다.
  시각 별표 `*` 는 `aria-hidden` 이다.
- 성별은 `fieldset` + `legend`(`성별`) + native radio 3개다. 화살표 키로 선택을 옮길 수 있다. 기호(`♀♂?`)는 `aria-hidden` 이고
  접근 가능한 이름은 `암컷` / `수컷` / `미상` 이다.
- 출생연도 input 은 `inputMode="numeric"`, `maxLength={4}` 이고 접미사 `년` 은 `aria-hidden` 이다.
- 사진 드롭존은 키보드로 조작 가능한 `button`(접근 가능한 이름 `사진 업로드`)이고 안내 문구를 `aria-describedby` 로 연결한다.
  숨긴 file input 은 `accept="image/*"`, 단일 선택이다.
- 사진 칩의 버튼 이름은 `${파일명} 다운로드` · `${파일명} 삭제` 다(`AttachmentField` 규칙 승계). 사진 거부 문구는 `role="alert"` 다.
- 필수값 오류 줄은 `role="alert"` 와 id 를 갖고 해당 입력(성별은 `fieldset`, 사진은 `사진 업로드` 버튼)의 `aria-describedby` 로 연결한다. 검증 뒤 포커스는 옮기지 않는다.
- 이탈 확인 모달은 기존 공용 컴포넌트의 modal semantics·포커스 트랩·복귀를 따른다.
- 실패 문구는 `role="status"` 로 알린다.
- 포커스 링은 업무 폼 결정(2026-09-08)과 같게 텍스트 입력에는 그리지 않고, pill·드롭존·버튼에는 `:focus-visible` 외곽선을 준다.
- 기본 키보드 순서: 뒤로가기 → 개체명 → 성별 → 출생연도 → 기타정보 → (사진 칩 다운로드) → 사진 업로드 → 생성하기/저장하기.

## 반응형

- 980px 이하(저장소 공통 breakpoint)에서 카드 padding 을 24px 로 줄인다.
- 제목 40px·부제 24px 는 좁은 화면에서 줄인다(값은 ③에서 기존 화면과 맞춘다).
- 성별 pill 그룹은 줄바꿈을 허용한다. 드롭존 최소 높이는 180px 로 줄인다(`AttachmentField` 규칙 승계).
- 가로 스크롤 없이 모든 입력과 모달을 조작할 수 있어야 한다.
- Figma 에 좁은 화면 프레임이 없어 기존 화면 980px 규칙을 승계했다(결정 사항).

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

시나리오 원문은 `harness/artifacts/publishing/individual-form.scenario-draft.md`. 필수값 오류는 인라인 오류 줄이다(개발자 결정).

- S1: `/species/1/individuals/create` 진입 → 제목 `개체 등록`, 부제 `카피바라에 개체를 한 마리씩 등록합니다`, 빈 폼(성별 미선택·출생연도 `0000`/`년`·사진 칩 없음)과 `생성하기` 가 보인다.
- S2: 성별 `암컷` 클릭 → `암컷`만 선택된다. 이어서 `미상` 클릭 → 선택이 `미상`으로 옮겨간다.
- S3: 출생연도에 `2019a7` 입력 → 값이 `2019` 가 된다.
- S4: 드롭존으로 이미지 한 장 등록 → 사진 칩에 파일명과 다운로드·삭제 컨트롤이 보인다.
- S30: 수정 화면에서 사진 칩의 ✕ 클릭 → 저장하면 `사진을 등록해주세요!` 줄이 보이고, 다시 올리면 저장된다 (2026-09-18 개발자 결정, 이슈 #149).
- S5: 사진이 있는 상태에서 다른 이미지 등록 → 칩이 새 파일로 바뀌고 칩은 1개다.
- S6: 필수값을 모두 채우고 `생성하기` → 이탈 확인 없이 `/species/1` 로 이동하고 `데이터 생성에 성공했습니다` 토스트가 보이며 개체 표 첫 행에 새 개체가 보인다.
- S7: 기타정보를 비운 채 나머지만 채우고 `생성하기` → 오류 줄 없이 생성된다.
- S8: `/species/1/individuals/1/edit` 진입 → 제목 `개체 수정`, 부제 `카피바라 · 동식이의 정보를 수정합니다`, 저장된 값(동식이·수컷 선택·2019·기타정보·사진 칩 `동식이_2026.jpg`)과 `저장하기` 가 보인다.
- S9: 수정에서 개체명을 바꾸고 `저장하기` → `/species/1/individuals/1` 로 이동하고 바뀐 개체명이 보인다.
- S10: 수정에서 아무것도 바꾸지 않고 `뒤로가기` → 확인 없이 `/species/1/individuals/1` 로 이동한다.
- S11: 개체명을 비운 채 `생성하기` → 요청 없이 개체명 카드 아래에 `개체명을 입력해주세요!` 오류 줄이 보이고 포커스는 옮겨지지 않는다.
- S12: 개체명에 공백만 입력하고 `생성하기` → S11 과 같은 오류 줄이 보인다.
- S13: 성별만 비운 채 `생성하기` → 성별 카드 아래에 `성별을 선택해주세요!` 오류 줄이 보인다.
- S14: 출생연도만 비운 채 `생성하기` → 출생연도 카드 아래에 `출생연도를 입력해주세요!` 오류 줄이 보인다.
- S15: 출생연도 `201` → `올바른 출생연도를 입력해주세요!` 오류 줄이 보인다.
- S16: 출생연도 `1899` 또는 `9999` → `올바른 출생연도를 입력해주세요!` 오류 줄이 보인다.
- S17: 사진만 비운 채 `생성하기` → 사진 카드 아래(드롭존 위)에 `사진을 등록해주세요!` 오류 줄이 보인다.
- S18: 모든 필드가 빈 채 `생성하기` → 개체명·성별·출생연도·사진 네 카드 아래에 오류 줄이 함께 보인다.
- S19: 이미지가 아닌 파일 등록 → 칩이 생기지 않고 `이미지 파일만 등록할 수 있습니다.` 가 보인다.
- S20: 50MB 초과 이미지 등록 → 칩이 생기지 않고 `<파일명>은 50MB를 초과해 첨부할 수 없습니다.` 가 보인다.
- S21: 이미지 두 장을 한 번에 끌어다 놓기 → 칩이 생기지 않고 `대표 사진은 1장만 등록할 수 있습니다.` 가 보인다.
- S22: 등록에서 개체명 입력 후 `뒤로가기` → 이탈 확인 모달, `취소` 시 입력 유지, `확인` 시 `/species/1` 로 이동한다.
- S23: 등록에서 아무것도 입력하지 않고 `뒤로가기` → 확인 없이 `/species/1` 로 이동한다.
- S24: 수정에서 성별을 바꾼 뒤 사이드바 `개체관리 > 개체 카드` 클릭 → 이탈 확인 모달이 뜬다.
- S26: 저장 실패 → URL·입력이 그대로이고 `저장하지 못했습니다. 다시 시도해 주세요.` 가 보인다.
- S27: 없는 종 `/species/999/individuals/create` → `종을 찾을 수 없습니다.` 와 `/species` 링크가 보인다.
- S28: 없는 개체 `/species/1/individuals/999/edit` → `개체를 찾을 수 없습니다.` 와 종 상세 링크가 보인다.
- S29: 키보드만으로 등록 폼 전체 입력(성별 화살표 선택·사진 업로드 버튼 포함)과 제출을 할 수 있다.

(S25 생성 중복 제출은 삭제 — 번호 공백 유지. 사유는 결정 사항과 시나리오 초안 승인 메모.)

## 결정 사항

- 라우트: 등록 `/species/:speciesId/individuals/create`, 수정 `/species/:speciesId/individuals/:individualId/edit`. 뒤로가기는 등록 → 종 상세, 수정 → 개체 상세다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 공통 라우트, `task-create`/`task-edit` 이동 규칙).
- 등록·수정은 한 spec·한 폼 컴포넌트(`IndividualForm`)로 두고 차이는 초기값·제목/부제·버튼 라벨·성공 이동뿐이다 (2026-09-15 Figma·저장소 근거 판단: Figma COMPONENT `145:16016` 이 등록·수정에 반복, `TaskForm` 구조).
- 등록 진입 시 성별은 미선택이고, 수정 진입 시 저장된 성별 pill 을 선택 상태로 보인다 (2026-09-15 Figma·저장소 근거 판단: `71:8747` 실측, `84:8848` 미선택은 컴포넌트 기본 모습).
- 성별 선택 표현은 `field / 분류` 선택 pill(`#36363F` 배경 + 흰 글자)을 따르고 선택 시 기호도 흰색이다(대비는 ⑦ 확인) (2026-09-15 Figma·저장소 근거 판단: 같은 섹션 `127:9342` 선택 pill, 성별 선택 variant 없음).
- **필수값 오류는 인라인이다.** `ValidationDialog` 는 쓰지 않고 Figma `107:8905` 모달안은 폐기한다. 동작은 `reservation-form` 패턴(제출 시 전체 검증 · 모든 오류 줄 동시 표시 · 다음 제출 때 갱신 · 첫 오류로 스크롤, 포커스 이동 없음 · `role="alert"` + `aria-describedby`), 외형은 Figma `107:8848` 오류 스타일, 카드 순서는 `71:8747` 이다. 문구는 `개체명을 입력해주세요!` · `성별을 선택해주세요!` · `출생연도를 입력해주세요!` · `올바른 출생연도를 입력해주세요!`(1900~올해) · `사진을 등록해주세요!` (2026-09-15 개발자 결정).
- 출생연도는 숫자 4자리만 입력되고, 1900 이상·올해 이하만 허용한다 (2026-09-15 개발자 결정).
- 사진은 이미지(`image/*`) 한 장, 50MB 이하, 새 파일은 교체, 여러 장 동시 드롭은 거부한다. 칩은 Figma(`127:9358`) 순서(유형 아이콘 → 다운로드 → 파일명)에 제거(✕) 버튼이 붙는다 (2026-09-18 개발자 결정, 이슈 #149). 거부 문구 3종은 드롭존 아래 인라인 `role="alert"` 다 (2026-09-15 Figma·저장소 근거 판단: Figma `84:8781`·`84:8848` chip, `AttachmentField` 오류 위치).
- 생성 성공 → 종 상세 이동 + 종 상세가 `데이터 생성에 성공했습니다` 토스트. 수정 성공 → 개체 상세 이동, 토스트 없음 (2026-09-15 Figma·저장소 근거 판단: Figma `71:8888`, `task-edit` 수정 성공 토스트 없음).
- 저장 실패는 버튼 위 문구(`role="status"`)로 알리고 입력을 보존한다. `ErrorDialog` 는 쓰지 않는다 (2026-09-15 Figma·저장소 근거 판단: `TaskForm` `SubmitStatus` 선례).
- 이탈 보호는 기존 `LeaveConfirmationDialog` 를 쓴다 (2026-09-15 Figma·저장소 근거 판단: 같은 yot 파일 업무 수정 `really exit?` `1:3606` 선례).
- 폼 카드 간격 16px, 폼↔제출 버튼 간격 22px 다 (2026-09-15 Figma·저장소 근거 판단: Figma `145:16016` gap 16, 같은 섹션 종 생성 프레임 버튼 간격 22px).
- 기타정보 textarea 는 160px 고정 높이 + 내부 스크롤이다 (2026-09-15 Figma·저장소 근거 판단: Figma 고정 높이 박스 `127:9390`).
- 사진 등록 성공·실패 토스트는 띄우지 않는다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 토스트 섹션 `311:12786` 에 생성 성공만 있다).
- 사진 mock 입력은 `species-form` 과 같은 `PhotoInput = { kind: 'new'; file } | { kind: 'existing'; photo }` 이다 (2026-09-15 Figma·저장소 근거 판단: 같은 `PhotoUploadField` 값, 저장 형태 `photo`).
- 없는 id 는 `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크(종 `목록으로 돌아가기` · 개체 `종 상세로 돌아가기` · 관찰 `개체 상세로 돌아가기`)로 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage`·`EditTaskPage` not-found 패턴).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 사진 데이터는 `photo: { fileName: string; fileKey: string; url: string }` 이다. 종 1 `카피바라_2026.jpg`, 개체 1 `동식이_2026.jpg` 이고 나머지도 항목마다 다른 파일명을 둔다(이미지 바이트는 공용 에셋 1장 가능) (2026-09-15 Figma·저장소 근거 판단: 저장소 첨부 규약 `{ fileName, fileKey }` + 표시용 `url`, Figma 종 수정 chip `동식이_2026.jpg` 는 복사 오류).
- 신규 토큰 `color.choiceMuted`(`#70707D`)·`color.textValue`(`#5C5C68`)·`color.warningText`(`#8A5A00`)를 추가하고, 드롭존 점선 테두리는 기존 `colors.textGuide` 를 유지한다 (2026-09-15 Figma·저장소 근거 판단: map-tokens 신규 3색, 업무 폼 드롭존은 ⑦ 육안 확인까지 끝난 구현).
- 신규 공용 `FormFieldCard`(+`FormFieldLabel`)·`PillRadioGroup`·`PhotoUploadField`·`FileDropZone` 을 채택하고 species-form 과 이름·시그니처·구현을 공유한다(`FormFieldCard` 는 observation-edit 도 쓴다). `PhotoUploadField` chip 유형 아이콘은 Figma 아이콘 에셋을 `shared/ui/assets` 로 옮겨 쓴다 (2026-09-15 Figma·저장소 근거 판단: design-rules §1 같은 INSTANCE 2곳 이상).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

- [ ] **개체명·기타정보 최대 길이** — Figma·Notion API 명세 모두 근거가 없어 게이트 ② 에서도 정하지 않았다. 이번 슬라이스는 제한을 두지 않고,
      서버 제약이 정해지는 `/api` 계약 때 결정한다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
