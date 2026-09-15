---
feature: observation-edit
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1282:15007
requires_functional_test: true
paths: src/pages/species, src/features/observation-form, src/entities/observation
---

# 개체관리 · 관찰 및 특이사항 수정 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 등록·수정`(`311:12785`).
- 수정 화면 기준: `1282:15007` (`observation edit`, 관찰 1 의 값이 채워진 폼). **관련 상태 프레임은 없다** —
  검증 오류·저장 실패·이탈 확인·빈 첨부·드래그 중 상태가 Figma 에 없다. 검증 오류는 종·개체 폼 인라인 오류(`107:8777`·`107:8848`) 형식을 쓴다(2026-09-15 개발자 결정).
- **웹에는 관찰 등록 프레임이 없다.** 앱(모바일) 섹션 `1:755` 에 `개체 선택`·`대상 개체` 텍스트가 있어
  관찰 기록은 앱에서 작성하는 것으로 보인다(공통 브리프 §1). 이 spec 은 수정만 다룬다.
- 공용 인스턴스: `back`(`1282:15010` → main `1:10470`), `upload file`(`1302:15014` → main `1:10511`).
  나머지 카드·입력·첨부 chip 은 인스턴스가 아닌 일반 FRAME 이다.
- 개체관리 7개 화면 공통 기준: 공통 브리프(라우트·데이터 모델·mock 소유권·Figma 불일치) — 이 spec 은 그 값을 그대로 쓴다.
- 관련 계약: 관찰 상세 `observation-detail.spec.md`, 개체 상세(관찰 표·관찰 mock 소유) `individual-detail.spec.md`,
  수정 폼 선례 `task-edit.spec.md` / `task-create.spec.md`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

- **호출한 도구**: `get_design_context`(`1282:15007` 전체, 스크린샷 포함) → `harness/artifacts/publishing/observation-edit.figma.txt`,
  `get_metadata`(`1282:15007` 실측 좌표·크기 — 같은 파일 하단에 첨부, 섹션 `311:12785` · `311:12786` 구조 확인).
  `yarn harness:map-tokens observation-edit` 실행 완료(solid color 7종 중 신규 1종 — 드롭존 `#5C5C68`, 새 토큰 없이 `textGuide` 유지로 결정).
- **yot 실측 확인**: 헤더·폼 골격·카드 padding/gap·라벨/값 크기와 색·입력 박스 규격·첨부 chip 내부 배치·
  업로드 드롭존 규격·`저장하기` 버튼 규격과 위치(아래 `화면 구조와 시각 규격`).
- **부분 확인**: 첨부 제거 아이콘(`healthicons:no-outline`)의 빨강은 `get_design_context` 가 보고한 design style
  `red: #FF3131` 과 스크린샷으로만 확인했다. SVG 원본 색은 에셋을 받지 않아 **미검증**이다. jpg 유형 아이콘 색도 미검증.
- **비교 근거(다른 feature 추출본, 읽기만 함)**: 개체 수정 `84:8848` 의 채워진 값은 `#36363F` 24px 이고,
  개체 폼 필드 컴포넌트(`field / 개체명` `127:9364`, `field / 출생연도` `127:9384`)의 placeholder 는 `#848491` 24px,
  라벨은 20px 이다(`individual-form.figma.txt`). 관찰 상세 `1323:15015` 도 라벨 32px 이다(`observation-detail.figma.txt`).
- **Figma 근거 없음(게이트 ② 결정·저장소 선례로 채움)**: 검증 오류 표현, 저장 실패 표현, 이탈 확인 모달, 첨부가 0개인 상태, hover/focus/드래그 상태,
  접근성·반응형 절 전체.

## 목적

운영 관리자가 앱에서 기록된 개체의 관찰 및 특이사항을 웹에서 열어 제목·관찰사항·첨부를 고치고 저장한다.
저장 실패나 실수로 인한 이탈에도 입력과 기존 데이터를 잃지 않아야 한다.

## 범위

- 포함: 기존 관찰 조회와 폼 복원, 제목·관찰사항 편집, 날짜·관찰자 읽기 전용 표시, 첨부 확인·다운로드·제거·추가, 필수값 인라인 검증,
  저장, 이탈 보호, 중복 제출 방지, 없는 관찰 처리
- 제외: 실제 API 연동(`/api` 스킬 담당 — 개체·종·관찰 API 는 2026-09-15 기준 Notion 명세 DB 에 없다),
  **관찰 등록(웹 프레임 없음 — 앱 소관)**, **관찰 삭제(이 화면에 삭제 버튼이 없다 — 관찰 상세·개체 상세 케밥 소관)**,
  관찰 상세 조회(`observation-detail`), 개체 관찰 표(`individual-detail`), 사이드바 메뉴(`species-list`·`sidebar.spec.md`),
  수정 이력, 첨부 파일 서버 업로드 본문

## 라우트와 진입

라우트는 개체관리 공통 라우트다.

- 경로: `/species/:speciesId/individuals/:individualId/observations/:observationId/edit`
- 진입 1 — 관찰 상세(`…/observations/:observationId`) 제목 행 케밥 `수정` → 이 화면으로 이동한다(`observation-detail` 소관).
- 진입 2 — 개체 상세(`/species/:speciesId/individuals/:individualId`) 관찰 표 행 케밥 `수정` → 그 관찰의 이 화면으로 이동한다
  (`individual-detail` 소관).
- `뒤로가기` → **관찰 상세**(`…/observations/:observationId`)로 돌아간다(변경이 있으면 이탈 확인을 거친다).
- 저장 성공 → **관찰 상세**로 이동한다.
- 없는 관찰 → 폼 대신 not-found 상태를 보인다(아래 `없는 관찰`).
- 확인용 기준 URL: `/species/1/individuals/1/observations/1/edit` (공통 fixture 종 1 카피바라 · 개체 1 동식이 · 관찰 1).

## 동작 (behavioral spec — source of truth)

### 헤더

- 화면 진입 → 상단에 `뒤로가기`, 제목 `관찰 및 특이사항`, 부제가 보인다.
- 제목·부제는 Figma 그대로다. 부제는 `{종 국명} · {개체명}의 정보를 수정합니다` 로 조합한다(기준 fixture `카피바라 · 동식이의 정보를 수정합니다`)
  (2026-09-15 Figma·저장소 근거 판단: Figma `1299:15012`·`1299:15011` 문구 — 개체 수정과 같은 부제지만 그대로 쓴다).

### 복원

- 진입 시 URL 의 `observationId` 로 관찰을 조회해 저장된 값을 채운다.
  - 제목 입력에 제목(fixture: `얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음`)
  - 날짜에 `YYYY.MM.DD` 표기(fixture: `2026.06.01`)
  - 관찰자에 이름(fixture: `김유영`)
  - 관찰사항 입력에 내용(fixture: Figma 는 제목과 같은 문장이다 — 실제 값은 `individual-detail` 이 명세하는 mock 을 따른다)
  - 첨부에 저장된 첨부 전부가 chip 으로(fixture: `상처사진.jpg` 외 2개 — 파일명은 `individual-detail` mock 명세를 따른다)
- 조회 중에는 `관찰 기록을 불러오는 중입니다.` 상태를 보인다(`EditTaskPage` 선례).

### 제목·관찰사항 편집

- 제목은 한 줄 텍스트 입력이다. 관찰사항은 여러 줄 입력이다.
- 관찰사항 입력 박스는 Figma 높이(160px)를 최소 높이로 두고, 내용이 늘어나면 박스가 함께 늘어난다(`task-create` 상세 내용 선례).
- 저장 시 두 값 모두 앞뒤 공백을 제거한다.

### 날짜·관찰자 (읽기 전용)

- **날짜와 관찰자는 읽기 전용으로 표시한다** (2026-09-15 Figma·저장소 근거 판단: 아래 근거 — 값 색이 placeholder 색, 캘린더 아이콘 없음, 앱 작성 메타데이터). 포커스는 받지만 값을 바꿀 수 없다.
- 근거:
  1. 두 값의 글자색이 `#848491`(`colors.textGuide`)다. 같은 화면에서 편집 가능한 제목·관찰사항 값은 `#36363F`(`colors.textStrong`)다.
  2. 같은 개체관리 폼에서 `#848491` 24px 는 **placeholder 색**이고(`127:9363` `개체명을 입력해주세요`),
     채워진 값은 `#36363F` 다(`84:8848` `동식이` / `2019`). 저장소 `DateField` 도 빈 값만 `textGuide` 로 그린다.
  3. 표시된 값이 안내 문구가 아니라 실제 기록값(`2026.06.01` / `김유영`)이라 placeholder 로 볼 수 없다.
  4. 날짜 입력에 캘린더 아이콘이 없다(저장소 `DateField` 와 업무 폼 완료기한에는 있다).
  5. 관찰은 앱에서 관찰자가 작성하므로 날짜·작성자는 기록 메타데이터로 보는 편이 자연스럽다.
- 반대 근거: 입력 박스 배경(`#F5F5F7`)·크기가 편집 가능한 필드와 같고 비활성 표현(흐린 배경·잠금 아이콘 등)이 따로 없다.
- 저장 요청에 날짜·관찰자를 넣지 않는다.

### 첨부

- 기존 첨부는 chip(`AttachmentChip`)으로 보인다. chip 은 유형 아이콘 · 파일명 · 다운로드 · 제거 순서다(Figma `1284:15038`).
- chip 의 다운로드 클릭 → 해당 파일명으로 파일을 내려받는다(mock 경계: 저장소 `AttachmentField` 와 같이 임시 파일).
- chip 의 제거 클릭 → 그 chip 이 즉시 사라진다. 저장 전까지 서버에는 반영하지 않는다.
- 업로드 드롭존(`파일을 끌어서 놓거나 클릭하여 업로드` / `(최대 50MB)`) 클릭 → 파일 선택 창이 열린다.
  파일을 고르거나 드롭존에 끌어다 놓으면 → 첨부 chip 이 뒤에 추가된다(여러 개 가능).
- 파일 하나가 50MB 를 초과하면 → 첨부하지 않고 오류 문구를 보인다(`AttachmentField` 기존 문구
  `<파일명>은 50MB를 초과해 첨부할 수 없습니다.`).
- 이미 첨부한 파일(같은 이름·크기·수정시각)을 다시 고르면 → 첨부하지 않고 `<파일명>은 이미 첨부된 파일입니다.` 를 보인다(`AttachmentField` 기존 동작).
- 허용 파일 유형은 제한하지 않는다 (2026-09-15 Figma·저장소 근거 판단: `AttachmentField` 기존 동작).
- 첨부를 모두 제거해도 `첨부` 카드와 라벨은 남고 chip 만 없다 (2026-09-15 Figma·저장소 근거 판단: 업무 폼 `task` 변형 선례, Figma 빈 상태 없음).
- 첨부는 선택 항목이다. 0개여도 저장할 수 있다.
- 첨부 추가 결과 토스트는 띄우지 않는다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 토스트 섹션 `311:12786` 에는 생성 성공 토스트만 있다).

### 저장

- 버튼 라벨은 `저장하기` 다.
- 필수: **제목, 관찰사항**. 공백만 입력한 값은 빈 값으로 본다. 첨부는 선택이다.
- 필수값 오류는 **인라인**으로 보인다 (2026-09-15 개발자 결정). `ValidationDialog` 는 쓰지 않는다(Figma `107:8905` 모달안은 폐기).
  기존 `src/features/reservation-form` 패턴(`model/validation.ts` `validateReservationForm` · `scrollToFirstError`, `ui/fields.tsx` `LabeledField` `ErrorRow`)을 그대로 따른다.
  - 제출 버튼을 누를 때만 전체를 검증한다. 요청을 보내지 않고, 실패한 **모든** 항목의 카드 바로 아래에 오류 줄을 한꺼번에 보인다.
  - 값을 고쳐도 오류 줄은 바로 사라지지 않는다. 다음 제출 때 다시 검증해 통과한 항목의 줄만 사라진다.
  - 첫 오류 줄 위치로 부드럽게 스크롤한다(`scrollIntoView({ behavior: 'smooth', block: 'center' })`). **포커스는 옮기지 않는다.**
  - 오류 줄은 `role="alert"` 와 id 를 갖고 해당 입력의 `aria-describedby` 로 연결한다(기존 구현에는 `aria-invalid` 가 없어 쓰지 않는다).
  - 오류 줄과 문구 (2026-09-15 개발자 결정): 제목 빈 값 → 제목 카드 아래 `제목을 입력해주세요!` / 관찰사항 빈 값 → 관찰사항 카드 아래 `관찰사항을 입력해주세요!`.
  - **Figma 에는 필수 표시(`*`)가 없다.** 개체·종 폼 라벨에는 빨간 `*` 가 있지만 이 화면은 Figma 대로 `*` 를 그리지 않는다 (2026-09-15 Figma·저장소 근거 판단: `1282:15007` 라벨에 별표 없음).
- 모든 필수값이 채워진 상태에서 `저장하기` → 수정 요청을 한 번만 보낸다. 변경이 없어도 현재 값으로 저장할 수 있다.
- 요청 중에는 버튼을 비활성화하고 라벨을 `저장 중` 으로 바꿔 중복 제출을 막는다(`TaskForm` 규칙 승계).
- 저장 성공 → 관찰 query 를 갱신하고 관찰 상세로 이동한다. 상세에 바뀐 제목·관찰사항·첨부가 보인다.
  **수정 성공 토스트는 띄우지 않는다**(결정 사항). 그래서 이동할 때 토스트 state 를 넘기지 않는다.
- 저장 실패 → 현재 URL 과 모든 입력(제목·관찰사항·첨부 chip)을 보존하고 버튼 위에 `저장하지 못했습니다. 다시 시도해 주세요.` 를
  `role="status"` 로 보인다(20px Medium `colors.danger`). 버튼은 다시 누를 수 있다(`TaskForm` `SubmitStatus` 승계). `ErrorDialog` 는 쓰지 않는다.
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).

### 이탈 보호

- 초기값에서 제목·관찰사항·첨부 목록 중 하나라도 바뀐 상태에서 `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 →
  `LeaveConfirmationDialog` 를 띄운다. 제목 `정말 나가시겠습니까?`, 본문 `저장하지 않고 돌아갈 시 입력된 정보가 삭제됩니다`,
  버튼 `취소` / `확인`. (같은 yot 파일 업무 수정 `really exit?` `1:3606` 승계 — **개체관리 Figma 에는 이탈 확인 프레임이 없다.**)
- `취소` 또는 `Esc` → 모달이 닫히고 현재 URL·입력이 유지된다. `확인` → 시도한 경로로 이동한다.
- 바꾼 값이 없으면 확인 없이 바로 이동한다.
- 값을 바꿨다가 원래 값으로 되돌리면 바뀌지 않은 것으로 본다(`TaskForm` 비교 방식 승계).
- 저장 성공에 의한 이동은 이탈 확인 대상에서 제외한다.
- 새로고침·탭 닫기는 변경이 있을 때 브라우저 기본 이탈 경고로 보호한다.

### 없는 관찰

- `observationId` 에 해당하는 관찰이 없거나, 관찰의 `individualId` 가 URL 의 `individualId` 와 다르거나,
  개체의 `speciesId` 가 URL 의 `speciesId` 와 다르면 → 폼 대신 `관찰 기록을 찾을 수 없습니다.` 와
  `개체 상세로 돌아가기` 링크(`/species/:speciesId/individuals/:individualId`)를 보인다(기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴
  (`<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크) 승계. `observation-detail` 과 같은 문구).

## 화면 구조와 시각 규격

1920px 데스크톱 기준(프레임 1920×1718). 페이지 배경 `colors.background`(`#F5F5F7`).
본문 너비 1320px, 좌우 중앙 정렬(x=300). 좌상단 메뉴 버튼(`36×36 @36,32`)은 기존 사이드바를 재사용한다.
좌표는 `get_metadata` 실측이다.

1. `뒤로가기`(`back` 인스턴스 `1282:15010`, `@300,75` 1320×36): chevron 36px + `뒤로가기` 24px SemiBold `colors.textGuide`, gap 10px.
   → 공용 `BackLink`(Figma main `1:10470`) 그대로다.
2. 제목 `관찰 및 특이사항`(`1299:15012`, `@300,144` 279×48): **40px Medium** `colors.textStrong`.
3. 부제(`1299:15011`, `@300,200` 386×29): 24px Medium `colors.textGuide`.
   세로 간격: 뒤로가기 하단(111) → 제목 33px, 제목 하단(192) → 부제 8px, 부제 하단(229) → 폼 31px.
4. 폼(`form` `1282:15011`, `@300,260` 1320×1277.4): 세로 flex, **카드 간 gap 16px**(개체·종 폼과 같다. 업무 폼은 32px).
   카드 공통 — 배경 `colors.surface`, radius 20px, **padding 28px 32px**, 라벨↔입력 gap 12px.
   입력 박스 공통 — 1256 폭, 배경 `colors.background`, radius 8px, 좌우 padding 24px.

   | 카드 | node | y | 높이 | 라벨(Figma 원본) | 입력 | 값 |
   | --- | --- | --- | --- | --- | --- | --- |
   | 제목 | `1315:15015` | 0 | 172.4 | 32px Medium **`#000`** (text h38.4) | 66h @32,78.4 | 24px Medium `colors.textStrong` |
   | 날짜 | `1284:15010` | 188.4 | 182 | 32px **SemiBold** `colors.textStrong`, **고정 박스 192×48** | 66h @32,88 | 24px Medium **`colors.textGuide`**, 캘린더 아이콘 없음 |
   | 관찰자 | `1284:15020` | 386.4 | 173 | 32px Medium `colors.textStrong` (h39) | 66h @32,79 | 24px Medium **`colors.textGuide`** |
   | 관찰사항 | `1282:15026` | 575.4 | 267 | 32px Medium `colors.textStrong` (h39) | **160h** @32,79, padding 20/24 | 22px Medium `colors.textStrong` (h27) |
   | 첨부 | `1284:15032` | 858.4 | 163 | `첨부` 32px Medium `colors.textStrong` (h39) | chip 행 @32,79 | — |

   - **라벨이 개체·종 폼보다 크다.** 개체·종 폼 필드 라벨은 20px Medium(텍스트 높이 24, 카드 158 = 28+24+12+66+28)이고
     이 화면은 32px(텍스트 높이 39, 카드 173 = 28+39+12+66+28)다. 관찰 상세(`1323:15015`)도 32px 라벨이다.
   - 라벨 스타일이 카드마다 조금씩 다르다(색 `#000`/`#36363F`, 굵기 Medium/SemiBold, 날짜의 고정 192×48 박스).
     **구현은 32px Medium `colors.textStrong`, 텍스트 높이 39 로 통일한다(5개 중 3개가 이 값).** 이 경우
     제목·날짜 카드도 173 이 되어 폼 높이는 1277.4 → 약 1287 로 바뀐다.
   - Figma 텍스트 레이어 다수가 `Inter` 로 지정돼 있다(라벨 3개·값·제목·부제·chip 파일명). 나머지는 `Wanted Sans` 다.
     구현은 theme `font.body` 하나로 통일한다(글꼴 정리는 범위 밖).
   - 날짜·관찰자 입력은 편집 가능한 필드와 박스 규격이 같고 값 색만 다르다. `readOnly` 로 두고 시각은 Figma 그대로다.
     `#848491` on `#F5F5F7` 대비는 약 3.4:1 로, 24px 텍스트의 WCAG AA 큰 텍스트 기준(3:1)을 넘는다.

5. 첨부 chip(`1284:15038`, 204×56, 카드 내 @32,79): 테두리 1px `colors.textFaint`(`#AFAFBA`), **radius 0**, 배경 없음(카드 흰색),
   padding 16px 12px, gap 8px. 내부 좌표(chip 기준):
   - 유형 아이콘 `teenyicons:jpg-solid` 20×20 @12,18
   - 파일명 16px Medium `colors.textStrong` @40,18.5 (h19)
   - 다운로드 `material-symbols:download` 24×24 @136,16
   - 제거 `healthicons:no-outline` 24×24 @168,16 — 빨강 원형 X(`colors.danger`, SVG 원본 색은 ③ 에셋 확인). `AttachmentChip` 이 이 아이콘을 그대로 쓴다(`RemoveIconButton` 아님).
   - 여러 chip 일 때 간격·줄바꿈은 Figma 에 없다 → `AttachmentField` 기존 값(가로 gap 16px, wrap)을 따른다.
   - 오류 줄: 제목·관찰사항 카드 바로 아래(폼 gap 16px), 1320×22, padding-left 32px, gap 8px, 경고 원 22px `colors.danger` + `!` 14px 흰색 → 문구 18px Medium `colors.danger`
     (종·개체 폼 `107:8777`·`107:8848` 실측 형식).
6. 업로드 드롭존(`upload file` 인스턴스 `1302:15014` → main `1:10511`, 1320×240, 폼 내 y=1037.4 — 첨부 카드와 16px 간격):
   배경 `colors.tableHeaderStrong`(`#DDDDE3`), 테두리 2px dashed — Figma `#5C5C68`(gray/80), 구현은 기존 `AttachmentField` 드롭존의 `colors.textGuide`
   (새 토큰 없음 — 결정 사항), radius 20px.
   업로드 아이콘 48px + gap 12px + 안내 2줄 `파일을 끌어서 놓거나 클릭하여 업로드` / `(최대 50MB)` **18px** Medium `colors.textGuide`, 가운데 정렬.
7. `저장하기`(`1282:15035`, `@1497,1577.4` 123×61): 폼 하단(1537.4)에서 40px 아래, 본문 우측 끝 정렬.
   배경 `colors.text`(`#000`), radius 8px, padding 16px 20px, 라벨 24px SemiBold `colors.surface`.
   프레임 하단까지 여백 약 80px.

기존 공용 구현과의 차이(`AttachmentField` `variant="observation"` 이 흡수 — `컴포넌트 구조/props` 참고):

| 항목 | Figma `1282:15007` | 현재 `AttachmentField` |
| --- | --- | --- |
| 카드 라벨 | `첨부` 32px Medium `textStrong` | `첨부자료` 24px(`task` 20px) `textGuide` |
| 카드 padding | 28px 32px | 24px 40px 16px |
| chip | 높이 56, gap 8, padding 12, 테두리 `textFaint` | 높이 60, gap 6, padding 10, 테두리 `dialogBorder` |
| 제거 아이콘 | 24px 빨강(`AttachmentChip` 이 Figma 아이콘 사용) | `RemoveIconButton` 20px `textGuide`(hover `danger`) — 기존 화면은 유지 |
| 유형 아이콘 | `teenyicons:jpg-solid` 아이콘(`AttachmentChip` 이 사용) | `FileBadge` 텍스트 배지(`JPG`, `fileJpg`) — 기존 화면은 유지 |
| 카드↔드롭존 간격 | 16px | 32px |
| 드롭존 테두리 | 2px dashed `#5C5C68` | 2px dashed `textGuide` — 유지(결정) |
| 드롭존 안내 | 18px | 16px |

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.

### 신규 semantic color 토큰 (게이트 ② 추가 확정)

이 화면이 새로 쓰는 토큰은 없다. 개체관리 공통 신규 토큰(모든 개체관리 spec 같은 표):

| 값 | 토큰 | 용도 | 쓰는 spec |
| --- | --- | --- | --- |
| `#70707D` | `color.choiceMuted` | pill 미선택 글자(분류군·법정지정분류·성별). 기존 `optionMuted` 와 나란한 이름 | species-form, individual-form |
| `#5C5C68` | `color.textValue` | 종 상세 프로필 카드 정보 값 글자 | species-detail |
| `#8A5A00` | `color.warningText` | 법정지정분류 뱃지 글자(배경 `warningBg` 위) | species-detail |

- 드롭존 점선 테두리(Figma `#5C5C68`, `upload file` `1:10511`)에는 새 토큰을 만들지 않고 기존 업무 폼 구현(`AttachmentField` 드롭존 `colors.textGuide`)을 따른다(확정).
- `#5C5C68` 은 저장소에 토큰 없이 하드코딩으로 이미 쓰인다(`src/features/reservation-form/ui/ReservationFormSection.tsx`,
  `src/features/reservation-form/ui/fields.tsx` 셀렉트 열린 테두리).
- 나머지 색(`#36363F` `#848491` `#F5F5F7` `#DDDDE3` `#AFAFBA` `#FF3131` `#000`)은 `tokens.ts` 에 이미 있다
  (`token-diff.report.md`: matched 6 · new 1. `#FF3131` 은 design style 목록에서만 잡혔다).

## 데이터

```ts
// entities/observation — 공통 브리프 §3 모델. mock 은 individual-detail spec 이 명세한다.
interface ObservationAttachment {
  fileName: string
  fileKey: string
}

interface Observation {
  id: string
  individualId: string
  title: string // 제목
  observedAt: string // 날짜 YYYY-MM-DD, 표시 YYYY.MM.DD
  observerName: string // 관찰자
  content: string // 관찰사항
  attachments: ObservationAttachment[] // 첨부
}

// 수정 요청 — 응답(Observation)과 분리한다.
// 날짜·관찰자는 읽기 전용이라 보내지 않는다.
interface UpdateObservationInput {
  title: string // 앞뒤 공백 제거, 필수
  content: string // 앞뒤 공백 제거, 필수
  attachments: ObservationAttachment[] // 유지한 기존 첨부 + 새 첨부, 화면 순서
}

// 폼 로컬 상태 (features/observation-form). 서버 데이터를 복제하지 않고 편집 중 값만 둔다.
interface ObservationFormValues {
  title: string
  content: string
  attachments: AttachmentItem[] // shared/ui AttachmentField 가 알리는 { name, file?, fileKey? }
}
type ObservationFormErrors = Partial<Record<'title' | 'content', string>> // 오류 줄 문구
```

- 검증은 `features/observation-form/model/validation.ts` 의 순수 함수(`validateObservationForm(values): ObservationFormErrors`)로 둔다(`reservation-form` 선례).

- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- 관찰 mock 함수·키는 `individual-detail`(관찰 mock 소유) 명세 이름을 그대로 쓴다(2026-09-15 정합화).
  - 조회: `getMockObservation(observationId): Promise<Observation | null>` — query key `['observations', observationId]`.
    URL 의 `individualId`·`speciesId` 와의 일치 확인은 페이지가 한다(`없는 관찰`).
  - 부제 조합용 종 국명·개체명은 `getMockSpecies(speciesId)`(species-list 소유)·`getMockIndividual(individualId)`(species-detail 소유) 조회를 재사용한다.
  - 수정: `updateMockObservation({ id, input }: { id: string; input: UpdateObservationInput }): Promise<Observation>` — 입력 형태는 이 spec 이 정한다.
  - 저장 성공 시 `['observations']` 접두 전체를 무효화해 관찰 상세와 개체 상세 관찰 표(`['observations', 'list', { individualId }]`)가 함께 갱신되게 한다.
- **mock 경계**: `entities/observation/model/mock.ts` 의 고정 데이터 위에 `observationStorageKey`(`toyvillage:observations`) override 로
  수정값을 저장한다(`entities/resource` `updateMockResource` 선례).
  - 새 첨부는 실제 업로드(`entities/file` 의 `uploadFile`)를 호출하지 않고 mock 이 임시 `fileKey` 를 발급한다.
  - 저장 실패 경로 확인용으로 `observationFailStorageKey`(`toyvillage:observations:fail`)에 `update` 를 넣으면 다음 수정 요청이 한 번 실패한다
    (자료 수정 `resourceFailStorageKey` 선례). 실제 API 연동 시 제거한다. 지연 주입 키는 두지 않는다.
- 연쇄 삭제(mock, 개체관리 공통): 연쇄 삭제 기록을 따로 쓰지 않고 조회에서 뺀다. `getMockIndividuals` / `getMockIndividual` 은 삭제된 개체와
  삭제된 종(`getMockSpecies(speciesId)` 가 `null`)의 개체를 빼고(`null`), `getMockObservations` / `getMockObservation` 은 소속 개체가 없는
  (`getMockIndividual(individualId)` 가 `null`) 관찰을 뺀다(`null`). entities → entities import 는 ESLint 가 허용한다. 실제 연쇄 삭제는 서버 책임이다.
- 기준 fixture(개체관리 공통): 관찰 `1` — 개체 `1` 동식이(종 `1` 카피바라), 2026-06-01, 김유영,
  `얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음`, 첨부 `상처사진.jpg` 외 2개.
  첨부 3개 파일명은 `상처사진.jpg`, `상처사진_측면.jpg`, `처치기록.pdf`(`individual-detail` mock 명세)다.
  첨부가 없는 경우는 관찰 `3`(2026-04-22 `식욕 정상, 활동량 양호`)으로 확인한다.

## 컴포넌트 구조/props

| 컴포넌트 | 위치 | 재사용 | 비고 |
| --- | --- | --- | --- |
| `EditObservationPage` | `src/pages/species/EditObservationPage.tsx` | 신규 | 라우트 페이지. 조회·로딩/not-found·이탈 blocker·뒤로가기·완료 이동. `EditTaskPage` 구조를 따른다 |
| `ObservationForm` | `src/features/observation-form/ui/ObservationForm.tsx` | 신규 | 제목·날짜·관찰자·관찰사항 카드, 첨부, 인라인 검증(오류 상태), 저장 mutation(mock), 실패 문구 |
| `BackLink` | `src/shared/ui` | 기존 재사용 | Figma `back` main `1:10470` 과 규격 일치(36px chevron, gap 10). `TaskBackLink` 는 업무 전용 변형이라 쓰지 않는다 |
| `FormFieldCard` | `src/shared/ui` | **신규 공용(게이트 ② 채택)** — `species-form`·`individual-form` 과 같은 컴포넌트 | 제목·날짜·관찰자·관찰사항 카드. `labelSize={32}`, 오류 줄은 `error` |
| `AttachmentField` | `src/shared/ui` | **기존 재사용 + 변형 추가(게이트 ② 채택)** | 아래. chip 은 `AttachmentChip`, 드롭존은 `FileDropZone` 을 렌더한다 |
| `ValidationDialog` | — | 쓰지 않음 | 필수값 오류는 인라인(개발자 결정) |
| `LeaveConfirmationDialog` | `src/shared/ui` | 기존 재사용 | 이탈 확인 |
| `RemoveIconButton` | — | 이 화면에서는 쓰지 않음 | `AttachmentChip` 이 Figma `healthicons:no-outline` 빨강 24px 을 쓴다(게이트 ② 채택) |

```ts
interface EditObservationPageParams {
  speciesId: string
  individualId: string
  observationId: string
}

interface ObservationFormProps {
  observation: Observation
  onCompleted: () => void // 저장 성공 — 페이지가 이탈 보호를 해제하고 관찰 상세로 이동
  onDirtyChange: (isDirty: boolean) => void
}
```

- 헤더(제목 `관찰 및 특이사항` + 부제)는 Figma 에서 TEXT 두 개라 컴포넌트 경계가 아니다. `EditObservationPage` 안의 styled 로 둔다.
  개체·종 수정 화면에도 같은 배치(40px 제목 @144 + 24px 부제 @200)가 있지만 TEXT 라 공용화하지 않는다(③ 과분리 점검에서 중복이 크면 다시 본다).
- 제목·날짜·관찰자·관찰사항 카드는 Figma 에서 일반 FRAME 이지만 규격(padding 28px 32px · radius 20px · 라벨↔입력 gap 12px)이
  개체·종 폼 `field / *` 카드와 같다. 신규 공용 `FormFieldCard` 를 `labelSize={32}` 로 쓴다(게이트 ② 채택):
  `FormFieldCard { label?: string; required?: boolean; htmlFor?: string; hint?: string; error?: string; errorId?: string; labelSize?: 20 | 32; children }`
  (`species-form`·`individual-form` 과 같은 시그니처, `labelSize` 기본 20).
- 날짜·관찰자는 `DateField` 를 쓰지 않는다(읽기 전용 — 캘린더 아이콘·피커가 없다). 같은 카드 스타일의 `readOnly` input 이다.
- **`AttachmentField` 재사용 근거**: 기존 첨부 복원(`initialFiles: { fileName, fileKey }[]`), chip 다운로드(`${파일명} 다운로드`),
  제거(`RemoveIconButton`, `${파일명} 삭제`), 클릭·드롭 추가, 50MB·중복 거부, 현재 목록 통지(`onFileItemsChange`/`onFileNamesChange`)를
  이미 모두 제공한다. 동작은 그대로 쓰고 시각만 다르다.
  - 결정(게이트 ② 채택): `variant` 에 `'observation'` 을 추가한다(`'default' | 'task' | 'observation'`). 이 변형은 라벨 `첨부`,
    위 표의 카드 padding·라벨 타이포·카드↔드롭존 16px·안내 18px 을 적용하고, 첨부가 0개여도 라벨을 보인다(`task` 와 같음).
    chip 은 신규 공용 `AttachmentChip { fileName, onDownload, onRemove? }`(`src/shared/ui/AttachmentChip`, Figma 유형 아이콘·빨강 24px 제거 아이콘)을
    `onRemove` 와 함께 렌더한다(Figma chip 규격 h56·gap 8·padding 12·`textFaint` 테두리). 드롭존은 신규 공용 `FileDropZone`
    (`AttachmentField` 내부 드롭존 추출, 기존 변형의 외형·동작 불변)을 쓰고 점선 테두리는 기존 `colors.textGuide` 를 유지한다. 기존 `default`·`task` 변형은 바뀌지 않는다.
  - 기각: feature 안에 첨부 필드를 복제 — 동작이 같은 컴포넌트를 복제하게 된다(code-rules §8).
- `AttachmentList`(조회 전용, chip 56h·gap 8·`textFaint` 테두리)는 이 화면의 chip 규격과 같지만 제거·추가가 없어 쓰지 않는다.

## 접근성

- 제목 input 과 관찰사항 textarea 는 `<label for>` 로 프로그램적 이름(`제목`, `관찰사항`)을 갖고, 필수이면 `aria-required="true"` 를 준다.
  시각 `*` 는 그리지 않는다(Figma).
- 날짜·관찰자는 `readOnly` input 으로 이름(`날짜`, `관찰자`)과 값을 읽을 수 있고 편집 불가가 보조기기에 전달된다.
  `disabled` 는 쓰지 않는다(탭 순서에서 빠지고 값을 읽기 어렵다).
- 텍스트 입력(제목·관찰사항·날짜·관찰자)에는 포커스 링을 그리지 않고 캐럿이 대신한다. 버튼·chip 컨트롤·드롭존은 `focus-visible` outline 을 그린다
  (2026-09-15 Figma·저장소 근거 판단: `task-create` 카드 안 텍스트 입력 포커스 링 없음(2026-09-08 개발자 결정) — `individual-form` 과 같은 규칙).
- 필수값 오류 줄은 `role="alert"` 와 id 를 갖고 제목 input·관찰사항 textarea 의 `aria-describedby` 로 연결한다. 검증 뒤 포커스는 옮기지 않는다.
- 첨부 chip 은 `${파일명} 다운로드`, `${파일명} 삭제` 이름을 제공한다. 첨부 영역은 `role="group"` 이름 `첨부파일`(기존 `AttachmentField`).
- 업로드 드롭존은 키보드로 조작 가능한 `파일 업로드` 버튼이다. 50MB 초과·중복 오류는 `role="alert"` 로 알린다.
- `LeaveConfirmationDialog` 는 modal semantics, 포커스 트랩, 닫힐 때 포커스 복귀를 제공한다(기존 구현).
- 저장 실패 문구는 `role="status"` 로 알린다(`TaskForm` `SubmitStatus` 승계).
- 기본 키보드 순서: 뒤로가기 → 제목 → 날짜 → 관찰자 → 관찰사항 → 첨부 chip(다운로드 → 삭제, chip 순) → 파일 업로드 → 저장하기.
- chip 아이콘 버튼(24px)은 반응형 절의 44px 터치 영역 규칙을 적용한다(시각 크기는 24px 유지).

## 반응형

- 980px 이하에서는 제목 크기와 카드 padding 을 줄이고 본문은 가용 너비를 사용한다(저장소 980px 선례 — 결정 사항).
- 첨부 chip 은 줄바꿈되고, 긴 파일명은 말줄임한다(`AttachmentField` 기존 동작).
- 가로 스크롤 없이 모든 입력·첨부·모달을 조작할 수 있어야 한다.
- 컨트롤의 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

기준 URL `/species/1/individuals/1/observations/1/edit`(관찰 1). 필수값 오류는 인라인 오류 줄이다(개발자 결정).

- S1: 관찰 상세 제목 행 케밥 `수정` → 이 화면으로 이동한다.
- S2: 개체 상세 관찰 표 행 케밥 `수정` → 그 관찰의 이 화면으로 이동한다.
- S3: 진입 → `뒤로가기`, 제목 `관찰 및 특이사항`, 부제 `카피바라 · 동식이의 정보를 수정합니다`, `저장하기` 가 보인다.
- S4: 진입 → 제목·날짜(`2026.06.01`)·관찰자(`김유영`)·관찰사항이 저장된 값으로 채워져 있다.
- S5: 진입 → 저장된 첨부 개수만큼 chip 이 보이고 각 chip 에 다운로드·삭제 컨트롤이 있다.
- S6: 날짜·관찰자 입력에 타이핑해도 값이 바뀌지 않는다.
- S7: 제목·관찰사항을 고치고 `저장하기` → 관찰 상세로 이동하고 바뀐 값이 보인다.
- S8: chip 다운로드 클릭 → 그 파일명으로 다운로드가 일어난다.
- S9: 기존 chip 제거 → chip 이 즉시 사라지고, 저장 후 관찰 상세에서도 빠져 있다.
- S10: 드롭존으로 파일 추가 → chip 이 뒤에 추가되고, 저장 후 관찰 상세에 보인다.
- S11: 아무것도 바꾸지 않고 `뒤로가기` → 확인 없이 관찰 상세로 이동한다.
- S12: 제목을 비우거나 공백만 두고 `저장하기` → 요청 없이 제목 카드 아래에 `제목을 입력해주세요!` 오류 줄이 보이고 포커스는 옮겨지지 않는다.
- S13: 관찰사항을 비우고 `저장하기` → 요청 없이 관찰사항 카드 아래에 `관찰사항을 입력해주세요!` 오류 줄이 보인다.
- S14: 제목·관찰사항을 모두 비우고 `저장하기` → `제목을 입력해주세요!` · `관찰사항을 입력해주세요!` 두 오류 줄이 함께 보인다.
- S15: 첨부를 모두 제거하고 `저장하기` → 오류 줄 없이 저장되고 `첨부` 라벨은 제거 직후에도 남아 있다.
- S16: 50MB 를 넘는 파일 추가 → chip 이 늘지 않고 50MB 초과 오류 문구가 보인다.
- S17: 값을 바꾼 뒤 `뒤로가기` → `정말 나가시겠습니까?` 모달이 뜨고, `취소` 시 입력이 유지되며 `확인` 시 관찰 상세로 이동한다.
- S18: 값을 바꾼 뒤 사이드바 `개체관리 바로가기` 클릭 또는 브라우저 뒤로가기 → 같은 이탈 확인 모달이 뜬다.
- S20: 저장 실패 → URL 과 입력·첨부가 유지되고 `저장하지 못했습니다. 다시 시도해 주세요.` 가 보인다.
- S21: 없는 `observationId`(또는 URL 의 개체·종과 맞지 않는 관찰)로 진입 → `관찰 기록을 찾을 수 없습니다.` 와 `개체 상세로 돌아가기` 링크가 보인다.
- S22: 키보드만으로 편집·첨부 제거·파일 업로드 열기·저장을 수행할 수 있다.

(S19 저장 중복 제출은 삭제 — 번호 공백 유지. 사유는 결정 사항과 시나리오 초안 승인 메모.)

## 결정 사항

- 라우트 `/species/:speciesId/individuals/:individualId/observations/:observationId/edit`, 뒤로가기·저장 성공 모두 관찰 상세다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 공통 라우트, `task-edit` 이동 규칙).
- 이 화면은 수정 전용이다. 관찰 등록 웹 화면은 만들지 않고 삭제 버튼도 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: 웹 등록 프레임 없음(앱 섹션 `1:755`), `1282:15007` 에 삭제 버튼 없음).
- 제목 `관찰 및 특이사항`·부제 `{종 국명} · {개체명}의 정보를 수정합니다` 는 Figma 그대로다 (2026-09-15 Figma·저장소 근거 판단: Figma `1299:15012`·`1299:15011`).
- **날짜·관찰자는 읽기 전용이다.** 저장 요청에 넣지 않는다 (2026-09-15 Figma·저장소 근거 판단: 값 색이 placeholder 색 `#848491`, 캘린더 아이콘 없음, 앱 작성 메타데이터).
- **필수값 오류는 인라인이다.** 필수는 제목·관찰사항이고, `reservation-form` 패턴(제출 시 전체 검증 · 모든 오류 줄 동시 표시 · 다음 제출 때 갱신 · 첫 오류로 스크롤, 포커스 이동 없음 · `role="alert"` + `aria-describedby`)으로 `제목을 입력해주세요!` · `관찰사항을 입력해주세요!` 를 카드 아래에 보인다. `ValidationDialog` 는 쓰지 않는다 (2026-09-15 개발자 결정).
- 필수 별표(`*`)는 그리지 않는다 (2026-09-15 Figma·저장소 근거 판단: `1282:15007` 라벨에 별표 없음).
- 수정 성공 토스트·첨부 추가 토스트는 넣지 않는다 (2026-09-15 Figma·저장소 근거 판단: `task-edit`·개체관리 토스트 섹션 `311:12786` 에 없음).
- 저장 실패는 버튼 위 문구(`role="status"`)로 알린다. `ErrorDialog` 는 쓰지 않는다 (2026-09-15 Figma·저장소 근거 판단: `TaskForm` `SubmitStatus` 선례).
- 이탈 보호는 `LeaveConfirmationDialog` 다 (2026-09-15 Figma·저장소 근거 판단: 같은 yot 파일 업무 수정 `really exit?` `1:3606` 선례).
- 라벨은 32px Medium `colors.textStrong`, 텍스트 높이 39 로 통일한다 (2026-09-15 Figma·저장소 근거 판단: Figma 카드 5개 중 3개 값). Figma 의 `Inter` 지정은 theme `font.body` 로 둔다.
- 제목·날짜·관찰자·관찰사항 카드는 신규 공용 `FormFieldCard`(`labelSize` 32)를 쓴다 (2026-09-15 Figma·저장소 근거 판단: 카드 규격이 종·개체 폼 `field / *` 와 같다 — design-rules §1).
- 첨부는 `AttachmentField` 에 `variant="observation"` 을 추가해 재사용한다. chip 은 신규 공용 `AttachmentChip`(Figma 유형 아이콘·빨강 24px 제거 아이콘), 드롭존은 신규 공용 `FileDropZone`(테두리 `textGuide`)이다. 기존 변형과 `AttachmentList` 는 바뀌지 않는다 (2026-09-15 Figma·저장소 근거 판단: 같은 동작의 기존 컴포넌트 재사용(code-rules §8), design-rules §1).
- 첨부 허용 유형은 제한하지 않고 50MB·중복은 거부한다 (2026-09-15 Figma·저장소 근거 판단: `AttachmentField` 기존 동작).
- 관찰사항 입력은 최소 160px, 내용에 따라 늘어난다 (2026-09-15 Figma·저장소 근거 판단: `task-create` 상세 내용 입력 선례).
- 텍스트 입력에는 포커스 링을 그리지 않는다 (2026-09-15 Figma·저장소 근거 판단: `task-create` 2026-09-08 개발자 결정 — `individual-form` 과 같은 규칙).
- 없는 관찰·경로 체인 불일치(관찰 ↔ `individualId`, 개체 ↔ `speciesId`)는 `관찰 기록을 찾을 수 없습니다.` + `개체 상세로 돌아가기` 다 (2026-09-15 Figma·저장소 근거 판단: `EditTaskPage` not-found 패턴, `observation-detail` 과 같은 체인 검증).
- 첨부 fixture 는 관찰 1 첨부 3건(`상처사진.jpg`, `상처사진_측면.jpg`, `처치기록.pdf`)이다 (2026-09-15 Figma·저장소 근거 판단: 관찰 표 `외 2개` — 수정·상세 Figma 의 chip 1개는 일부만 그린 것).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 신규 토큰 `color.choiceMuted`(`#70707D`)·`color.textValue`(`#5C5C68`)·`color.warningText`(`#8A5A00`)를 추가하고, 드롭존 점선 테두리는 기존 `colors.textGuide` 를 유지한다 (2026-09-15 Figma·저장소 근거 판단: map-tokens 신규 3색, 업무 폼 드롭존은 ⑦ 육안 확인까지 끝난 구현).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

없음. 게이트 ② 에서 이 화면의 미결을 모두 결정했다(2026-09-15). 남은 절차는 시나리오 승인(S1~S22, S19 제외)이다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
