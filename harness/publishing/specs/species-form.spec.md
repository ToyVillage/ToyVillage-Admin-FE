---
feature: species-form
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 68:8744
  relatedNodeIds:
    - 84:8781
    - 107:8777
    - 959:26335
requires_functional_test: true
paths: src/pages/species, src/features/species-form, src/entities/species
---

# 종 등록·수정 행동명세

## 상태와 근거

- Status: Draft — 게이트 ② 결정 반영(2026-09-15), 시나리오 승인 대기
- Last refreshed: 2026-09-15
- 기준 파일 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` › 섹션 `개체관리`(`300:12759`) ›
  `개체관리 · 등록·수정`(`311:12785`).
- 생성 화면 기준: `68:8744` (`species new`, 빈 폼).
- 수정 화면: `84:8781` (`species edit`, 카피바라 값이 채워진 폼 · 부제 · `저장하기`).
- 필수값 오류(인라인): `107:8777` (`species new (invalid)`) — 게이트 ② 에서 인라인 표현 채택(2026-09-15 개발자 결정).
- 법정분류 추가 모달: `959:26335` (`species new (add legal)`, dim `959:26347` + 모달 `959:26348`).
- 필드 컴포넌트(섹션 `127:9033`): `field / 국명`(`127:9308`) · `field / 영문명·학명`(`127:9323`) ·
  `field / 분류`(`127:9342`) · `field / 법정지정분류`(`127:9354`) · `field / 사진`(`127:9358`).
  업로드 드롭존은 업무 폼과 같은 `upload file`(`1:10511`) 인스턴스다.
- 참고(타 spec 소유): 종 상세 기본정보 카드 `species basic info`(`1191:14902`) — 법정지정분류를 배지로 표시.
  관찰 수정 `1282:15007` 의 첨부 chip(`1284:15038`) — 같은 `healthicons:no-outline` 아이콘을 제거 버튼으로 쓴다.
- 공통 브리프: 개체관리 7개 spec 공통 기준(라우트·데이터 모델·mock 소유권)을 따른다.
  목록 계약 `species-list.spec.md`, 상세 계약 `species-detail.spec.md`.
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-15)

`get_design_context`(기준 프레임 전체, `84:8781`·`107:8777` 전체, `959:26335` 는 dim·모달 영역)와
`get_metadata`(좌표·크기)로 실측했다. 원문은 `harness/artifacts/publishing/species-form.figma.txt`.

- **yot 실측 확인**: 카드 구성·순서·padding·gap, 입력 높이·radius, 분류군 pill 선택/비선택 색,
  법정지정분류 pill·추가 pill 규격, 사진 카드 두 높이(108 / 파일 chip 포함 184), 드롭존 규격,
  인라인 오류 행 규격·문구 3종, 법정분류 추가 모달 규격·문구, 수정 화면 부제·버튼 라벨.
- **Figma 근거 없음(결정으로 채움)**: 법정지정분류 pill 의 선택 상태 시각(variant 없음 → `accent`/`accentBg`), 사진 업로드 후 생성 화면 모습,
  50MB 초과·비이미지 오류 표시, 저장 실패 표시, 사진 필수 오류 줄, 법정분류 중복 오류, 이탈 확인 모달(업무 폼 `1:3606` 승계), 접근성·반응형 절 전체.
- **미검증**: 제거 아이콘 색(에셋 SVG 안의 색 — 스크린샷상 빨강. 구현은 기존 `RemoveIconButton` 을 유지하고 ⑦ 에서 확인).

## 목적

운영 관리자가 동물원에서 기르는 **종**을 등록하거나 이미 등록한 종 정보를 고친다. 국명·영문명·학명·분류군과
대표 사진을 필수로 받고, 세부 분류와 법정지정분류(목록에서 고르거나 직접 추가)를 선택으로 받는다.
실수로 이탈하거나 저장이 실패해도 입력을 잃지 않아야 한다.

## 범위

- 포함: 빈 폼 진입(생성), 기존 값 복원(수정), 텍스트 입력 4종, 분류군 단일 선택, 법정지정분류 기본 목록 선택·직접 추가·직접 추가 항목 제거,
  법정분류 추가 모달, 대표 사진 1장 등록·교체, 필수값 인라인 검증, 생성·저장, 중복 제출 방지, 이탈 보호, 없는 종 처리
- 제외: 실제 API 연동(`/api` 스킬 담당 — 개체·종 API 명세 없음), 종 목록·생성 성공 토스트 표시(`species-list`),
  종 상세·삭제(`species-detail`), 개체 등록·수정(`individual-form`), 사진 서버 업로드 본문, 사이드바 메뉴(`species-list`·`sidebar.spec.md`)

## 라우트와 진입

라우트는 개체관리 공통 라우트다(결정 사항).

- `/species/create` → 종 등록 화면. 종 목록(`/species`) 상단 CTA `개체 등록하기` 에서 들어온다.
- `/species/:speciesId/edit` → 해당 종의 수정 화면. 종 목록 행 케밥 `수정`, 종 상세 카드 케밥 `수정` 에서 들어온다.
- `뒤로가기`: 등록 → `/species`, 수정 → `/species/:speciesId`(상세). 어느 경로로 들어왔든 같다.
- 생성 성공 → `navigate('/species', { state: { toast: 'create-success' } })` 로 이동하고 목록이 `데이터 생성에 성공했습니다` 토스트를 띄운다(Figma `71:8888`, `species-list` 소유).
- 저장 성공 → `/species/:speciesId`(상세)로 이동한다. 토스트는 띄우지 않는다(결정 사항).
- 이동 후 토스트는 `task-list` 규약을 따른다 — 보내는 화면이 `navigate(<경로>, { state: { toast: 'create-success' } })` 또는
  `{ state: { toast: 'delete-success' } }` 로 넘기고, 받는 화면이 `location.state.toast` 를 읽어 띄운 뒤 닫힐 때
  `navigate(location.pathname, { replace: true, state: null })` 로 비운다(새로고침·재방문 시 다시 뜨지 않는다).
  토스트 키는 `create-success` / `delete-success` / `delete-error` 한 벌이다(`TaskListPage` `TaskListToastKey`, `delete-error` 는 화면 안에서만 쓴다).
- 없는 `speciesId` 로 수정 진입 → `종을 찾을 수 없습니다.` 와 `목록으로 돌아가기`(`/species`) 링크를 표시한다.
  조회 중에는 `종 정보를 불러오는 중입니다.` 를 표시한다(기존 `TaskDetailPage`·`EditTaskPage` not-found 패턴 — `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크.
  종의 부모는 목록이라 기존 문구 `목록으로 돌아가기` 를 그대로 쓴다).

## 동작 (behavioral spec — source of truth)

### 화면 머리

- 등록: 제목 `종 등록`. 부제는 없다.
- 수정: 제목 `종 수정`, 부제 `<국명>의 종 정보를 수정합니다`. `<국명>` 은 **저장된** 국명이며 입력 중에 바뀌지 않는다(Figma `84:8841`, 제목 부제는 화면 대상 설명).
- 하단 버튼 라벨: 등록 `생성하기` / 수정 `저장하기`(Figma `84:8847` 확인).

### 진입 기본 상태 (등록)

- 국명·영문명·학명·세부 분류 입력은 비어 있고 각각 `국명을 입력해주세요` / `영문명을 입력해주세요` /
  `학명을 입력해주세요` / `세부 분류를 입력해주세요` placeholder 를 보여준다.
- 분류군 pill 4개(`포유류` `파충류` `조류` `어류`) 중 **`포유류` 가 선택**돼 있다 (2026-09-15 Figma·저장소 근거 판단: Figma 모든 프레임(빈 생성 폼 포함)에 `포유류` 선택).
- 법정지정분류는 기본 선택지 pill 3개(`지정관리 야생동물` `멸종위기 야생생물 I급` `천연기념물`)가 모두 미선택으로 보이고,
  그 뒤에 `+ 법정분류 추가` pill 이 있다. 기본 선택지에는 X(제거) 버튼이 없다.
- 사진 카드에는 라벨과 안내 `대표 사진 1장만 등록할 수 있습니다.` 만 있고 파일 chip 은 없다. 아래에 업로드 드롭존이 있다.

### 복원 (수정)

- 진입 시 저장된 값이 채워진다 — 국명·영문명·학명·세부 분류 텍스트, 분류군 pill 선택, 법정지정분류, 사진 chip.
- 법정지정분류: 기본 선택지 3개는 항상 그 순서로 보이고, 저장값에 든 기본 선택지는 선택 상태다.
  저장값 중 기본 선택지에 없는 항목(직접 추가 항목)은 기본 선택지 뒤에 저장 순서대로 **선택 상태·X 버튼이 있는** pill 로 붙는다 (2026-09-15 개발자 결정).
- 사진 chip 에는 저장된 사진의 `photo.fileName` 이 보인다.
- 예: 종 `1` 카피바라 → `카피바라` / `Capybara` / `Hydrochoerus hydrochaeris` / `포유류` 선택 / 세부 분류 `설치목 - 천축서과` /
  `지정관리 야생동물` 만 선택 / 사진 chip `카피바라_2026.jpg`. 부제 `카피바라의 종 정보를 수정합니다`.

### 텍스트 입력 (국명·영문명·학명·세부 분류)

- 자유롭게 입력할 수 있다. 저장 시 앞뒤 공백을 제거하고, 공백만 있으면 빈 값으로 본다.
- 세부 분류는 **선택 입력**이다(별표 없음, 오류 없음). 형식은 Figma 수정 프레임 값 `설치목 - 천축서과`(`{목} - {과}`)를 따르도록
  placeholder 로만 안내하고 형식 검사는 하지 않는다. 비어 있으면 요청에서 생략한다 (2026-09-15 개발자 결정).
- 길이 제한·영문/라틴 문자 형식 검사는 두지 않는다(미결 — Figma·API 명세 없음).

### 분류군 (단일 선택)

- pill 하나를 클릭 → 그 pill 만 선택 상태가 된다. 다른 pill 을 클릭하면 선택이 옮겨 간다.
- 선택된 pill 을 다시 클릭해도 해제되지 않는다(`task-create` 우선순위 규칙 승계). 기본값이 있어 분류군 오류는 없다.

### 법정지정분류 (기본 목록에서 선택 + 직접 추가) (2026-09-15 개발자 결정)

Figma 근거: 안내 `해당하는 항목을 모두 선택해주세요. 목록에 없으면 직접 추가할 수 있습니다.`, 컴포넌트 설명
`다중 선택 pill + 직접 추가`, 생성·수정 프레임에 같은 pill 3개, 추가 모달 `959:26335`.

- pill 본문 클릭 → 선택을 토글한다. 여러 개를 동시에 선택할 수 있고 아무것도 선택하지 않아도 된다.
- 선택된 pill 은 기존 `accent` 계열로 표시한다 — 배경 `colors.accentBg`, 테두리 1px `colors.accent`, 글자 `colors.accent`(Figma 에 선택 variant 없음).
- X(제거) 버튼은 **직접 추가한 항목에만** 있다. X 클릭 → 그 pill 을 목록에서 뺀다(선택도 해제). 기본 선택지 3개에는 X 가 없다.
  (Figma 는 기본 선택지 pill 에도 X 를 그렸다 — 차이로 기록한다.)
- 직접 추가한 항목도 본문 클릭으로 선택을 해제할 수 있다. 저장은 선택된 항목만 담으므로, 해제한 직접 추가 항목은 다시 들어오면 목록에 없다.
- `+ 법정분류 추가` 클릭 → 법정분류 추가 모달이 열린다.

### 법정분류 추가 모달 (`959:26348`) (2026-09-15 개발자 결정)

- 열리면 제목 `법정분류 추가`, 빈 입력(`분류 이름을 입력해주세요`), 버튼 `취소` / `추가하기` 가 보이고 입력에 포커스가 간다.
- 입력이 비었거나 공백만 있으면 `추가하기` 가 **비활성**이다. 이때 입력에서 `Enter` 를 눌러도 아무 일도 일어나지 않는다.
- `추가하기` 클릭 또는 입력에서 `Enter` → 앞뒤 공백을 제거한 이름으로 처리한다.
  - 현재 목록(기본 선택지 + 직접 추가 항목)에 **같은 이름**(공백 제거 후 완전 일치)이 있으면 → 추가하지 않고 모달을 유지하며,
    입력 아래에 인라인 오류 `이미 있는 분류입니다!` 를 보인다(폼 오류 줄과 같은 `!` 원 + 18px `colors.danger`, `role="alert"`, 입력 `aria-describedby` 연결).
    오류는 다음 `추가하기` 때 다시 판정한다(`reservation-form` 인라인 오류 규칙).
  - 새 이름 → 목록 끝(`+ 법정분류 추가` 바로 앞)에 X 버튼이 있는 pill 로 추가하고 **즉시 선택 상태**로 만든 뒤 모달을 닫는다.
- `취소` / `Esc` / dim 클릭 → 아무것도 추가하지 않고 닫는다.
- 닫히면 포커스가 `+ 법정분류 추가` 로 돌아간다.
- 직접 추가한 이름은 **이 종의 `legalDesignations` 값으로만** 저장한다. 다른 종 화면의 선택지로 공유하지 않는다.

### 사진 (대표 사진 1장)

- 드롭존 클릭 → 파일 선택 창이 열린다(한 개만 고를 수 있다). 파일을 드롭존에 끌어다 놓아도 된다.
- 이미지 파일(MIME `image/*`) 하나를 올리면 → 사진 카드에 chip(유형 아이콘 → 다운로드 → 파일명, Figma `1057:14773` 순서)이 나타난다. 드롭존은 계속 보인다.
- 사진이 이미 있는 상태에서 새 이미지를 올리면 → 기존 사진을 **교체**한다. chip 은 항상 최대 1개다.
- chip 에는 제거 버튼이 없다. 사진은 새 업로드로만 바꾼다 (2026-09-15 Figma·저장소 근거 판단: Figma 수정 프레임 `84:8781`·`84:8848` 사진 chip 에 제거 컨트롤이 없고 사진이 필수).
- chip 의 다운로드 컨트롤 클릭 → 그 파일을 내려받는다(mock: 새 파일은 원본, 기존 사진은 파일명을 담은 임시 Blob — `AttachmentList` 규칙 승계).
- 거부하면 기존 사진을 그대로 두고 드롭존 아래에 오류 문구를 인라인 `role="alert"` 로 보인다 (2026-09-15 Figma·저장소 근거 판단: `AttachmentField` 오류 문구 위치·문구 계열).
  여러 조건에 걸리면 아래 순서의 첫 문구 하나만 보인다.
  - 한 번에 2개 이상 → `대표 사진은 1장만 등록할 수 있습니다.`
  - 이미지가 아닌 파일 → `이미지 파일만 등록할 수 있습니다.`
  - 50MB 초과 → `<파일명>은 50MB를 초과해 첨부할 수 없습니다.`
- 다음 업로드가 성공하면 거부 문구는 사라진다.
- 사진 등록 성공·실패 토스트는 띄우지 않는다(개체관리 Figma 토스트 섹션 `311:12786` 에 첨부 토스트 없음).

### 생성·저장

- 필수값: 국명, 영문명, 학명, 분류군(기본값 있음), 사진. 선택값: 세부 분류, 법정지정분류.
- 필수값 오류는 **인라인**으로 보인다 (2026-09-15 개발자 결정). `ValidationDialog` 는 쓰지 않는다(Figma `107:8905` 모달안은 폐기).
  기존 `src/features/reservation-form` 패턴(`model/validation.ts` `validateReservationForm` · `scrollToFirstError`, `ui/fields.tsx` `LabeledField` `ErrorRow`)을 그대로 따른다.
  - 제출 버튼을 누를 때만 전체를 검증한다. 요청을 보내지 않고, 실패한 **모든** 항목의 카드 바로 아래에 오류 줄을 한꺼번에 보인다.
  - 값을 고쳐도 오류 줄은 바로 사라지지 않는다. 다음 제출 때 다시 검증해 통과한 항목의 줄만 사라진다.
  - 첫 오류 줄 위치로 부드럽게 스크롤한다(`scrollIntoView({ behavior: 'smooth', block: 'center' })`). **포커스는 옮기지 않는다.**
  - 오류 줄은 `role="alert"` 와 id 를 갖고 해당 입력의 `aria-describedby` 로 연결한다(기존 구현에는 `aria-invalid` 가 없어 쓰지 않는다).
- 오류 줄과 문구(카드 순서) (2026-09-15 개발자 결정):
  1. 국명 빈 값 → `field / 국명` 카드 아래 `국명을 입력해주세요!`
  2. 영문명 또는 학명 빈 값 → `field / 영문명·학명` 카드 아래 한 줄 `영문명과 학명을 모두 입력해주세요!`(두 입력이 같은 오류 줄을 `aria-describedby` 로 가리킨다)
  3. 사진 없음 → `field / 사진` 카드 아래(드롭존 위) `사진을 등록해주세요!`(Figma 형식 확장 — `사진 업로드` 버튼이 가리킨다)
  - 분류군은 기본값이 있어 오류가 없고, 세부 분류는 선택 입력이라 오류가 없다(Figma `107:8777` 의 `세부 분류를 입력해주세요!` 줄은 따르지 않는다).
- 필수값이 모두 있으면 요청을 **한 번만** 보낸다. 요청 중에는 버튼을 비활성화하고 라벨을 `생성 중` / `저장 중` 으로 바꿔 중복 제출을 막는다
  (`TaskForm` 규칙 승계).
- 요청 본문의 `legalDesignations` 는 선택된 pill 의 이름을 화면 순서대로 담는다.
- 생성 성공 → `['species']` 를 무효화하고 `/species` 로 이동해 목록이 생성 성공 토스트를 띄운다. 새 종은 목록 기본 최신순이라 1페이지 첫 행에 놓인다(`species-list` 규칙).
- 저장 성공 → `['species']` 를 무효화하고 `/species/:speciesId` 로 이동한다. 수정 성공 토스트는 띄우지 않는다.
- 저장 실패 → 현재 URL 과 모든 입력(사진 포함)을 보존하고 버튼 위에 `생성하지 못했습니다. 다시 시도해 주세요.`(등록) /
  `저장하지 못했습니다. 다시 시도해 주세요.`(수정)를 `role="status"` 로 보인다(20px Medium `colors.danger`). 버튼은 다시 누를 수 있다
  (`TaskForm` `SubmitStatus` 승계). `ErrorDialog` 는 쓰지 않는다.

### 이탈 보호

- 등록: 기본 상태(빈 텍스트·분류군 `포유류`·법정지정분류 미선택·사진 없음)에서 하나라도 바뀌면 `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 시
  이탈 확인 모달(`LeaveConfirmationDialog` — 제목 `정말 나가시겠습니까?`, 본문 `저장하지 않고 돌아갈 시 입력된 정보가 삭제됩니다`,
  `취소` / `확인`)을 띄운다. 새로고침·탭 닫기는 브라우저 기본 확인을 띄운다.
- 수정: 저장값과 **달라진 값**(텍스트·분류군·선택된 법정지정분류와 그 순서·사진)이 있을 때만 같은 모달을 띄운다. 바뀐 값이 없으면 확인 없이 이동한다.
- `취소` 또는 `Esc` → 화면과 입력을 유지한다. `확인` → 이동한다.
- 생성·저장 성공에 의한 이동은 이탈 확인 대상이 아니다.
- 개체관리 Figma 에는 이탈 확인 모달 프레임이 없다 — 같은 yot 파일 업무 수정 `really exit?`(`1:3606`)을 승계한다.

## 화면 구조와 시각 규격

1920px 기준, 본문 너비 1320px(@x=300) 중앙 정렬. 페이지 배경 `colors.background`(`#F5F5F7`).
좌상단 메뉴 버튼(`36×36 @36,32`)은 기존 사이드바를 재사용한다. 글꼴은 `font.body` 하나로 통일한다
(Figma 는 Wanted Sans 와 Inter 가 섞여 있다).

1. `뒤로가기`(`back` 인스턴스, `@300,75` 1320×36) — chevron 36px + gap 10 + 24px SemiBold `colors.textGuide`. 기존 `BackLink`.
2. 제목(`68:8751` @300,144, 높이 48): 40px Medium `colors.text`.
   수정 부제(`84:8841` @300,200, 높이 29): 24px Medium `colors.textGuide`.
3. 폼(`form`): 등록 @y=230(제목 아래 38px) / 수정 @y=260(부제 아래 31px). **카드 세로 간격 16px**.
   카드 공통: 배경 `colors.surface`, radius 20px, padding 28px 32px, 폭 1320.
   라벨 공통: 20px Medium `colors.text`, 필수 별표 `*` 는 `colors.danger`, 라벨과 별표 gap 6px, 높이 24.
   입력 공통: 높이 66px, radius 8px, 배경 `colors.background`, 좌우 padding 24px, 24px Medium,
   placeholder `colors.textGuide`, 값 `colors.textStrong`. 라벨 아래 gap 12px.
   오류 줄은 해당 카드 바로 아래에 끼어들어 폼 높이가 늘어난다(아래 `인라인 오류 표현`).
4. `field / 국명`(1320×158 @y=0): 라벨 `국명 *` @32,28 → 입력 1256×66 @32,64.
5. `field / 영문명·학명`(1320×158 @y=174): 가로 2열, 열 gap 20px, 각 열 618 폭(@0 / @638).
   열마다 라벨(`영문명 *` / `학명 *`) → gap 12 → 입력 618×66.
6. `field / 분류`(1320×276.7 @y=348):
   - 라벨 `분류군 *` @32,28 → gap 12 → pill 행 @32,64(높이 54.7), pill gap 10px.
   - pill: radius 100px, padding 14px 32px, 22px Medium. 폭은 글자에 맞춘다(3글자 122.1 / 2글자 103.3).
     미선택 배경 `colors.surface` + 테두리 1px `colors.dialogBorder`(`#C6C6CE`) + 글자 `#70707D`(신규 토큰 `color.choiceMuted`),
     선택 배경 `colors.textStrong`(`#36363F`) + 글자 흰색(테두리 없음).
   - 세부 분류 블록 @32,130.7(1256×118): 위 padding 16 → 라벨 `세부 분류`(별표 없음, 높이 24) → gap 12 → 입력 1256×66.
7. `field / 법정지정분류`(1320×182.75 @y=640), 카드 내부 gap 20px:
   - 라벨 그룹(높이 52): 라벨 `법정지정분류`(별표 없음) → gap 6 → 안내 18px Medium `colors.optionMuted`(`#9999A5`).
   - pill 행 gap 10px. **Figma 는 한 줄 overflow-clip 이지만 항목이 늘면 줄바꿈한다**(flex-wrap, 행 간격 10px — 직접 추가로 항목이 늘어난다).
   - 기본 선택지 pill(X 없음): radius 100px, padding 14px 32px, 테두리 1px `colors.dialogBorder`, 22px Medium `#70707D`(`color.choiceMuted`).
   - 직접 추가 pill(X 있음): radius 100px, padding 14px 24px 14px 32px, 글자-아이콘 gap 8px, 같은 테두리·글자, 제거 아이콘은 기존 `RemoveIconButton`
     (Figma 24px 프레임·글리프 20px `inset 8.33%`, 스크린샷상 빨강 — 크기·색 차이는 ⑦ 육안 확인).
   - 선택 상태: 배경 `colors.accentBg`, 테두리 1px `colors.accent`, 글자 `colors.accent`(X 아이콘 색은 기존 `RemoveIconButton` 그대로).
   - `+ 법정분류 추가` pill: radius 100px, padding 14px 32px 14px 24px, gap 6px, 테두리 1px `colors.textGuide`,
     plus 아이콘 24px + 22px Medium `colors.textGuide`.
8. `field / 사진`(카드 gap 20px): 사진 없음 1320×108 / 사진 있음 1320×184(`127:9358`).
   - 라벨 그룹(높이 52): `사진 *` → gap 6 → 안내 `대표 사진 1장만 등록할 수 있습니다.` 18px Medium `colors.optionMuted`.
   - 파일 chip(`uploaded file` `1057:14773`) @32,100: 높이 56(padding 16px 12px), 테두리 1px `colors.textFaint`(`#AFAFBA`),
     radius 없음, gap 8px. 순서는 Figma 추출값 그대로 **유형 아이콘 20px → 다운로드 24px → 파일명 16px Medium `colors.textStrong`** 이고 제거 버튼은 없다
     (`84:8781`·`84:8848` 두 프레임이 같다). 규격은 기존 `AttachmentList` chip 과 같고 순서만 다르다.
     유형 아이콘은 Figma `teenyicons:jpg-solid` 계열 에셋(`features/create-resource/ui/assets/file-*.svg` 를 `shared/ui/assets` 로 옮겨 공유)을 쓴다.
9. `upload file`(1320×240, 사진 카드 아래 16px): 배경 `colors.tableHeaderStrong`(`#DDDDE3`),
   점선 테두리 2px — Figma `#5C5C68`, 구현은 기존 `AttachmentField` 드롭존의 `colors.textGuide`(새 토큰 없음 — 결정 사항), radius 20px. 가운데에 업로드 아이콘 48px → gap 12 →
   `파일을 끌어서 놓거나 클릭하여 업로드` / `(최대 50MB)` 두 줄 18px Medium `colors.textGuide` 가운데 정렬.
   거부 문구는 드롭존 아래 12px, 16px `colors.danger`, 가운데 정렬(`AttachmentField` `ErrorMessage` 승계).
10. 하단 버튼(`68:8801`, 123×61): 폼 아래 22px, 본문 우측 끝 정렬. 배경 `colors.text`, radius 8px, padding 16px 20px,
    라벨 24px SemiBold 흰색. 실패 문구는 버튼 위 20px Medium `colors.danger`(`TaskForm` `SubmitStatus` 승계, Figma 없음).
    수정 프레임(`84:8846` @y=1485)은 버튼이 드롭존(폼 끝 y=1539.5)과 겹쳐 그려졌다 — 생성 화면 간격(22px)을 쓴다(생성 프레임 실측).
11. 법정분류 추가 모달(`959:26348`):
    - dim 전체 화면 Figma `rgba(0, 0, 0, 0.4)`(`959:26347`) — 기존 모달 dim(0.5)을 유지하고 ⑦ 육안 확인에서 판단한다.
    - 모달 600×273, 화면 가운데, 배경 `colors.surface`, radius 20px, padding 40px, 세로 gap 24px.
    - 제목 `법정분류 추가` 28px Medium `colors.textStrong`(높이 34).
    - 입력 520×63: 배경 `colors.background`, radius 8px, padding 18px 24px, 22px Medium, placeholder `colors.optionMuted`.
    - 버튼 행 오른쪽 정렬 gap 12px: `취소` 100×48 테두리 1px `colors.textGuide` radius 8px 20px Medium `colors.textGuide` /
      `추가하기` 117×48 배경 `colors.textStrong` radius 8px padding 11px 20px 22px Medium 흰색. 비활성은 기존 비활성 버튼처럼 흐리게(opacity) 둔다(Figma 없음 — ⑦ 확인).
    - 중복 오류 줄: 입력 바로 아래 `!` 원 22px + `이미 있는 분류입니다!` 18px Medium `colors.danger`(폼 오류 줄 규격, 모달 세로 gap 에 끼어든다).

### 인라인 오류 표현 (Figma `107:8777` — 게이트 ② 채택, 2026-09-15 개발자 결정)

- 오류 줄(Figma `107:8777` 종 · `107:8848` 개체 실측): 해당 카드 **바로 아래**(폼 gap 16px 그대로) 1320×22, padding-left 32px, gap 8px.
  경고 원 22×22 radius 11px 배경 `colors.danger`, 가운데 `!` 14px SemiBold 흰색(@9,3) → 문구 18px Medium `colors.danger`.
  입력 박스 테두리는 바뀌지 않는다(Figma 오류 프레임의 입력은 기본 모습 그대로).
- 문구: `국명을 입력해주세요!`(국명 카드 아래) / `영문명과 학명을 모두 입력해주세요!`(영문명·학명 카드 아래 한 줄) /
  `사진을 등록해주세요!`(사진 카드 아래, Figma 형식 확장). Figma 의 `세부 분류를 입력해주세요!` 줄은 쓰지 않는다(세부 분류는 선택 입력).

### 신규 semantic color 토큰 (게이트 ② 추가 확정)

`yarn harness:map-tokens species-form` 결과 신규 2색(`#70707D`, `#5C5C68`). 나머지는 기존 토큰과 일치한다.
개체관리 공통 신규 토큰(모든 개체관리 spec 같은 표):

| 값 | 토큰 | 용도 | 쓰는 spec |
| --- | --- | --- | --- |
| `#70707D` | `color.choiceMuted` | pill 미선택 글자(분류군·법정지정분류·성별). 기존 `optionMuted` 와 나란한 이름 | species-form, individual-form |
| `#5C5C68` | `color.textValue` | 종 상세 프로필 카드 정보 값 글자 | species-detail |
| `#8A5A00` | `color.warningText` | 법정지정분류 뱃지 글자(배경 `warningBg` 위) | species-detail |

- 드롭존 점선 테두리(Figma `#5C5C68`, `upload file` `1:10511`)에는 새 토큰을 만들지 않고 기존 업무 폼 구현(`AttachmentField` 드롭존 `colors.textGuide`)을 따른다. (확정)

`rgba(0, 0, 0, 0.4)`(dim)는 Figma 구현값이지만 기존 모달 0.5 를 유지한다(⑦ 확인).

## 데이터

타입·필드명은 개체관리 공통 데이터 모델을 따른다. `Species` 응답 타입과 mock 은 `species-list` 가 소유한다(`entities/species`).
이 spec 은 참조만 한다. 실제 API 는 연결하지 않는다.

```ts
// entities/species (species-list 소유 — 참조)
type TaxonGroup = 'MAMMAL' | 'REPTILE' | 'BIRD' | 'FISH' // 포유류 / 파충류 / 조류 / 어류
interface Species {
  id: string
  koreanName: string
  englishName: string
  scientificName: string
  taxonGroup: TaxonGroup
  subClassification?: string // `{목} - {과}` 예: `설치목 - 천축서과`
  legalDesignations: string[] // 선택된 기본 선택지 + 직접 추가 항목
  photo: { fileName: string; fileKey: string; url: string }
  individualCount: number
}

// entities/species/model — mock 입력 타입(응답과 분리). `entities/resource` 의 `CreateResourceInput` 명명을 따른다
// (`*Request` 는 `/api` 연동 때 HTTP 요청 타입에 쓴다).
interface CreateSpeciesInput {
  koreanName: string // trim
  englishName: string // trim
  scientificName: string // trim
  taxonGroup: TaxonGroup
  subClassification?: string // trim, 빈 값이면 생략
  legalDesignations: string[] // 선택된 pill 이름, 화면 순서
  photo: PhotoInput
}
type UpdateSpeciesInput = CreateSpeciesInput

// 사진은 새 파일(생성·교체)이거나 저장된 사진 유지(수정)다. individual-form 과 같은 형태.
type PhotoInput =
  | { kind: 'new'; file: File }
  | { kind: 'existing'; photo: { fileName: string; fileKey: string; url: string } }

// features/species-form/model — 폼 상태
interface SpeciesFormValues {
  koreanName: string
  englishName: string
  scientificName: string
  taxonGroup: TaxonGroup // 진입 기본값 'MAMMAL'
  subClassification: string
  legalDesignations: string[] // 선택값
  photo: PhotoValue | null // shared/ui PhotoUploadField 범용 타입 { fileName; file?; url? } — individual-form 과 같다
}
type SpeciesFormErrors = Partial<Record<'koreanName' | 'englishScientificName' | 'photo', string>> // 오류 줄 문구
```

- 상수: `entities/species/model/labels.ts` 의 `taxonGroupLabels`(species-list 명세 — `MAMMAL: '포유류'` …, 순서 포유류 → 파충류 → 조류 → 어류),
  같은 파일에 `legalDesignationPresets = ['지정관리 야생동물', '멸종위기 야생생물 I급', '천연기념물'] as const`(기본 선택지, 개발자 결정).
- 직접 추가한 법정분류는 **그 종의 `legalDesignations` 값으로만** 저장한다. 다른 종 화면의 선택지에는 나타나지 않는다(개발자 결정).
- 검증은 `features/species-form/model/validation.ts` 의 순수 함수(`validateSpeciesForm(values): SpeciesFormErrors`)로 둔다(`reservation-form` `validateReservationForm` 선례).
- 수정 복원 시 `photo` 는 `{ fileName: photo.fileName, url: photo.url }` 로 `PhotoValue` 를 만든다. 요청은 새 파일이면 `{ kind: 'new' }`, 아니면 `{ kind: 'existing', photo }` 다.
- 호출 계층(퍼블리싱 단계, 개체관리 공통): 페이지·폼이 TanStack Query `queryFn` / `mutationFn` 에서 `@/entities/<entity>` 공개 index 가
  내보내는 `model/mock.ts` mock 함수를 직접 부른다(`WorkLogListPage` → `getMockWorkLogs` 선례). `entities/<entity>/api/*` 는 지금 만들지 않고
  `/api` 연동 때 추가해 호출부를 바꾼다(`entities/resource` 는 연동 뒤 `api/*` 와 `model/mock.ts` 가 공존한다). endpoint 는 설계하지 않는다.
- mock 경계: 종 mock 함수·키는 `species-list` 명세 이름을 그대로 쓴다 — 조회 `getMockSpecies(id)`, 생성 `createMockSpecies(input: CreateSpeciesInput)`,
  수정 `updateMockSpecies({ id, input }: { id: string; input: UpdateSpeciesInput })`. 결과는 `speciesStorageKey`(`toyvillage:species`)에 저장하고
  목록 정렬·위치는 그 spec 규칙을 따른다. 새 사진은 mock 이 `fileKey`(`mock-species-{id}`)와 표시용 `url` 을 발급한다.
- 실패 경로 검증용 주입: `speciesFailStorageKey`(`toyvillage:species:fail`)에 `create` | `update` 를 넣으면 해당 요청이 한 번 실패한다
  (`entities/resource` 선례). 실제 API 연동 시 제거한다. 지연 주입 키는 두지 않는다.
- query key(species-list 명세): 목록 `['species', 'list']`, 단건 `['species', speciesId]`. 생성·수정 뒤 `['species']` 를 무효화한다.

### 공통 fixture (참조)

- 종 `1` 카피바라 / Capybara / Hydrochoerus hydrochaeris / 포유류 / 세부 분류 `설치목 - 천축서과` / 법정지정분류 `지정관리 야생동물` / 사진 `카피바라_2026.jpg`
- 종 `2` 플라밍고 / Flamingo / Phoenicopterus roseus / 조류
- 종 `3` 반달가슴곰 / Asiatic black bear / Ursus thibetanus / 포유류 / 법정지정분류 `멸종위기 야생생물 I급`, `천연기념물`

## 컴포넌트 구조/props

재사용 우선. 근거는 `harness/artifacts/publishing/species-form.component-map.md`.

- `CreateSpeciesPage` — `/species/create`(`src/pages/species`). 제목 h1, `BackLink to="/species"`, `SpeciesForm mode="create"`,
  `useBlocker` + `LeaveConfirmationDialog`, 성공 시 `navigate('/species', { state: { toast: 'create-success' } })`
  (`CreateTaskPage` 구조 승계).
- `EditSpeciesPage` — `/species/:speciesId/edit`. 조회·로딩·없는 종 상태, 제목 + 부제, `BackLink to="/species/:speciesId"`,
  `SpeciesForm mode="edit"`, 성공 시 상세로 이동(`EditTaskPage` 구조 승계).
- `SpeciesForm { mode: 'create' | 'edit'; initialSpecies?: Species; onCompleted: () => void; onDirtyChange: (isDirty: boolean) => void }`
  — `features/species-form/ui`. 필드 조합·인라인 검증(오류 상태 소유)·mutation·실패 문구·제출 버튼. `TaskForm` 과 같은 props 규약.
- `TaxonGroupField { value: TaxonGroup; onChange }` — `features/species-form/ui`.
  시각은 신규 공용 `PillRadioGroup` 을 쓴다(아래).
- `LegalDesignationField { presets: readonly string[]; value: string[]; onChange: (value: string[]) => void }` — `features/species-form/ui`.
  표시 목록(기본 선택지 + 직접 추가 항목)은 내부 상태다. 수정 진입 시 `value` 중 기본 선택지에 없는 항목으로 직접 추가 목록을 초기화하고,
  선택값만 밖으로 올린다. X 는 직접 추가 항목에만 렌더한다(`RemoveIconButton`).
- `LegalDesignationAddDialog { existingNames: string[]; onCancel: () => void; onAdd: (name: string) => void }` — 빈 값 비활성·중복 인라인 오류(`이미 있는 분류입니다!`) 소유.
  `features/species-form/ui`. 구조·포커스 트랩·`inert` 처리는 `features/create-notice/ui/TeamAddDialog.tsx` 를 따른다
  (그 파일은 문구·규격이 달라 직접 재사용하지 않는다).
- `PhotoUploadField { label: string; required?: boolean; hint?: string; value: PhotoValue | null; onChange: (value: PhotoValue) => void; error?: string; maxFileSize?: number }`
  (`PhotoValue = { fileName: string; file?: File; url?: string }`) — **신규 공용**(`shared/ui`, 게이트 ② 채택).
  Figma `field / 사진`(`127:9358`) + `upload file`(`1:10511`). `species-form`·`individual-form` 이 같은 인스턴스라 한 컴포넌트·같은 동작으로 둔다.
  도메인 타입에 의존하지 않는다. 내부에서 `FormFieldCard`(`label`·`required`·`hint`)를 쓴다.
  단일 이미지(`image/*`)·교체·chip(유형 아이콘 → 다운로드 → 파일명, 제거 버튼 없음)·드롭존·거부 문구를 소유한다.
  `error?: string`(사진 필수 오류 줄 — 카드 아래), `errorId` 연결, `maxFileSize` 기본값 50MB. 드롭존은 `FileDropZone` 을 쓴다.
  (검증 뒤 포커스를 옮기지 않으므로 업로드 버튼 ref 는 노출하지 않는다.)
- `FileDropZone` — **신규 공용**(`shared/ui`, 기존 shared 변경 포함 — 게이트 ② 채택). Figma `upload file`(`1:10511`) INSTANCE 는
  지금 `AttachmentField` 내부 `DropZone` 에만 구현돼 있어 추출한다. 추출만으로는 `AttachmentField`(업무 폼) 외형·동작이 바뀌지 않는다.
  클릭·드래그 앤 드롭·키보드 조작을 소유하고 고른 파일 목록을 호출부에 넘긴다(props 는 ③에서 확정).
  점선 테두리는 기존 `colors.textGuide` 를 쓴다(확정).
- `PillRadioGroup { legend: string; required?: boolean; name: string; options: { value: string; label: string; icon?: ReactNode }[]; value: string | null; onChange: (value: string) => void; errorId?: string }`
  — **신규 공용**(`shared/ui`, 게이트 ② 채택). 기존 단일 선택 pill 은 `TaskPriorityField`(accent 색·252px 고정)와
  `ResourceForm`·`NoticeForm` 분류 칩(feature 로컬 styled 중복)뿐이라 규격이 다르다. `individual-form` 성별 pill
  (`127:9376`, 아이콘 + gap 6 — `icon` 옵션)과 같은 구조라 공용으로 둔다. 이름·props 는 `individual-form` spec 과 맞췄다
  (그쪽 feature 래퍼는 `IndividualSexField`).
- `FormFieldCard { label?: string; required?: boolean; htmlFor?: string; hint?: string; error?: string; errorId?: string; children }` — **신규 공용**
  (`shared/ui`, 게이트 ② 채택 — `species-form`·`individual-form`·`observation-edit` 공통). `error` 가 있으면 카드 바로 아래에 오류 줄을 그린다. 흰 카드(padding 28px 32px · radius 20px) +
  라벨 20px Medium(필수 별표) + 본문. `hint` 는 라벨 아래 18px 한 줄(간격 6px)이고 `aria-describedby` 로 연결한다.
  - 라벨 행은 `FormFieldLabel { htmlFor?; required?; children }` 로 함께 내보낸다. 카드 하나에 라벨이 여럿이면(영문명 + 학명)
    `label` 없이 카드를 쓰고 안에서 `FormFieldLabel` 을 쓴다.
  - 분류군·성별 카드는 `label` 없이 카드를 쓰고 `PillRadioGroup` 이 같은 모양의 `legend` 를 그린다. `PhotoUploadField` 는 내부에서 이 카드를 쓴다.
  - 관찰 수정 라벨 32px 용 `labelSize?: 20 | 32`(기본 20)를 둔다(게이트 ② 채택).
- 텍스트 입력(66px 회색 박스)은 `SpeciesForm` 내부 styled 로 둔다.
- `LeaveConfirmationDialog` / `BackLink` — 기존 재사용. `ValidationDialog` 는 쓰지 않는다(인라인 오류 — 개발자 결정).

## 접근성

- 텍스트 입력은 `<label>` 과 연결하고 필수 항목은 `aria-required="true"` 를 준다. 별표는 시각 표시일 뿐이다.
- 오류 줄은 `role="alert"` 와 id 를 갖고 해당 입력(영문명·학명은 둘 다, 사진은 `사진 업로드` 버튼)의 `aria-describedby` 로 연결한다. 검증 뒤 포커스는 옮기지 않는다.
- 분류군은 `fieldset` + `legend`(`분류군`) + radio semantics 다(시각은 pill). 방향키로 선택을 옮길 수 있다.
- 법정지정분류는 `role="group"` 에 라벨을 연결하고 안내 문구를 `aria-describedby` 로 묶는다.
  항목 pill 은 `aria-pressed` 를 가진 버튼, 직접 추가 항목의 제거 버튼 이름은 `<이름> 삭제`, 추가 버튼 이름은 `법정분류 추가`(`aria-haspopup="dialog"`).
- 법정분류 추가 모달은 `role="dialog"` `aria-modal="true"`, 제목으로 라벨링, 입력 이름 `분류 이름`,
  열릴 때 입력 포커스, 포커스 트랩, `Esc` 닫기, 닫힐 때 호출 버튼으로 포커스 복귀. 비활성 `추가하기` 는 `disabled`, 중복 오류는 `role="alert"`.
- 사진: 드롭존은 키보드로 조작 가능한 `사진 업로드` 버튼이다. 숨긴 file input 은 `accept="image/*"`.
  chip 다운로드 버튼 이름은 `<파일명> 다운로드` 다(제거 버튼 없음). 거부 오류는 `role="alert"`.
- 저장 실패 문구는 `role="status"` 로 알린다(`TaskForm` `SubmitStatus` 승계).
- 검증 모달·이탈 확인 모달은 기존 공용 컴포넌트의 modal semantics 를 그대로 쓴다.
- 버튼·pill·드롭존은 `focus-visible` outline 을 그린다. 텍스트 입력에는 포커스 링을 그리지 않고 캐럿이 대신한다(`task-create` 2026-09-08 개발자 결정 — `individual-form`·`observation-edit` 과 같은 규칙).
- 기본 키보드 순서: 뒤로가기 → 국명 → 영문명 → 학명 → 분류군 → 세부 분류 → 법정지정분류 pill(본문 → 제거) →
  `법정분류 추가` → 사진 chip 다운로드 → 사진 업로드 → 생성하기/저장하기. (법정지정분류 pill 은 본문 → 제거(직접 추가 항목만) 순)

## 반응형

Figma 에 근거가 없어 기존 폼의 980px 규칙을 승계한다(결정 사항).

- 980px 이하: 영문명·학명을 세로로 쌓고, 카드 padding 을 24px 로 줄인다.
- pill 행은 줄바꿈한다. 드롭존 최소 높이 180px(`AttachmentField` 승계).
- 법정분류 추가 모달 폭은 `min(100% - 80px, 600px)`.
- 가로 스크롤 없이 모든 입력과 모달을 조작할 수 있어야 한다.

## 기능 테스트 수용 기준 (게이트 ② 결정 반영 — 시나리오 승인 대기)

- S1: `/species/create` 진입 → 제목 `종 등록`, 네 입력의 placeholder, 분류군 `포유류` 선택, 기본 선택지 3개 미선택(X 없음), 사진 chip 없음,
  버튼 `생성하기` 가 보인다.
- S2: 분류군 `조류` 클릭 → `조류` 만 선택된다. 이어서 `어류` 클릭 → 선택이 `어류` 로 옮겨 간다.
- S3: 기본 선택지 `지정관리 야생동물`·`천연기념물` 클릭 → 둘 다 선택된다. `천연기념물` 을 다시 클릭 → 그것만 해제된다.
- S4: `+ 법정분류 추가` 클릭 → 모달이 열리고 제목·placeholder·`취소`/`추가하기`(비활성) 가 보이며 입력에 포커스가 있다.
- S5: 모달에 새 이름을 입력하고 `추가하기` → 모달이 닫히고 `+ 법정분류 추가` 앞에 X 버튼이 있는 선택된 pill 이 추가된다.
- S6: 이미지 파일 1개 업로드 → 사진 카드에 그 파일명의 chip 이 나타난다.
- S7: 필수값을 모두 채우고 `생성하기` → `/species` 로 이동하고 `데이터 생성에 성공했습니다` 토스트가 보이며, 목록 1페이지 첫 행에 새 종이 보인다.
- S8: `/species/1/edit` 진입 → 제목 `종 수정`, 부제 `카피바라의 종 정보를 수정합니다`, 버튼 `저장하기` 가 보인다.
- S9: `/species/1/edit` 복원 → 국명·영문명·학명·세부 분류 `설치목 - 천축서과` 값, `포유류` 선택, `지정관리 야생동물` 만 선택, 사진 chip `카피바라_2026.jpg` 가 보인다.
- S10: 수정 화면에서 국명을 고치고 `저장하기` → `/species/1` 로 이동하고 상세에 바뀐 국명이 보인다.
- S11: 아무것도 입력하지 않고 `생성하기` → 요청 없이 `국명을 입력해주세요!`·`영문명과 학명을 모두 입력해주세요!`·`사진을 등록해주세요!` 오류 줄이 각 카드 아래에 함께 보이고 포커스는 옮겨지지 않는다.
- S12: 국명만 입력하고 `생성하기` → 국명 오류 줄 없이 `영문명과 학명을 모두 입력해주세요!`·`사진을 등록해주세요!` 줄이 보인다.
- S13: 국명·영문명만 입력하고 `생성하기` → `영문명과 학명을 모두 입력해주세요!` 줄이 보인다.
- S14: 오류 줄이 보인 뒤 국명을 채움 → 줄이 그대로 남고, 다시 `생성하기` 를 누르면 국명 오류 줄만 사라진다.
- S15: 사진만 빼고 입력하고 `생성하기` → 사진 카드 아래에 `사진을 등록해주세요!` 줄만 보인다.
- S16: 국명에 공백만 입력하고 나머지를 채운 뒤 `생성하기` → `국명을 입력해주세요!` 줄이 보인다.
- S17: 세부 분류·법정지정분류를 비운 채 필수값만 채우고 `생성하기` → 오류 줄 없이 생성에 성공한다.
- S18: 모달 입력이 비었거나 공백만 있음 → `추가하기` 가 비활성이고 `Enter` 를 눌러도 pill 이 추가되지 않는다.
- S19: 모달에 `천연기념물` 입력 후 `추가하기` → 새 pill 없이 모달이 유지되고 `이미 있는 분류입니다!` 가 보인다.
- S20: 모달에서 `취소`(또는 `Esc`) → 아무것도 추가되지 않고 모달이 닫히며 `+ 법정분류 추가` 에 포커스가 돌아온다.
- S21: 직접 추가한 pill 의 X 클릭 → 그 pill 이 목록에서 사라진다. 기본 선택지 pill 에는 X 가 없다.
- S22: 사진이 있는 상태에서 다른 이미지 업로드 → chip 은 1개이고 새 파일명으로 바뀐다.
- S24: 이미지가 아닌 파일 업로드 → chip 이 생기지 않고 `이미지 파일만 등록할 수 있습니다.` 가 보인다.
- S25: 50MB 를 넘는 이미지 업로드 → chip 이 생기지 않고 50MB 초과 문구가 보인다.
- S26: 이미지 2개를 한 번에 선택 → chip 이 생기지 않고 `대표 사진은 1장만 등록할 수 있습니다.` 가 보인다.
- S27: 등록 화면에서 입력 후 `뒤로가기` → `정말 나가시겠습니까?` 모달이 뜨고, `취소` 시 입력이 유지된다.
- S28: 수정 화면에서 아무것도 바꾸지 않고 `뒤로가기` → 확인 없이 `/species/1` 로 이동한다.
- S30: 저장 요청 실패 → URL 이 `/species/1/edit` 로 유지되고 입력이 보존되며 `저장하지 못했습니다. 다시 시도해 주세요.` 가 보인다.
- S31: 없는 id 로 `/species/999/edit` 진입 → `종을 찾을 수 없습니다.` 와 `목록으로 돌아가기` 링크가 보인다.
- S32: 키보드만으로 입력·분류군 선택·법정분류 선택/추가/직접 추가 항목 제거·사진 업로드 컨트롤·생성을 수행할 수 있다.

(S23 사진 제거·S29 생성 중복 제출은 삭제 — 번호 공백 유지. 사유는 결정 사항과 시나리오 초안 승인 메모.)

## 결정 사항

- 라우트 `/species/create` · `/species/:speciesId/edit`, 뒤로가기(등록 → `/species`, 수정 → 상세)·성공 이동 대상은 개체관리 공통 라우트를 따른다 (2026-09-15 Figma·저장소 근거 판단: 사이드바 활성 판정 `pathname.startsWith(route + '/')`, `task-create`/`task-edit` 이동 규칙).
- 등록·수정을 한 spec·한 폼(`SpeciesForm mode`)으로 다룬다. 차이는 제목·부제·버튼 라벨·복원·이탈 판정뿐이다 (2026-09-15 Figma·저장소 근거 판단: `TaskForm` 구조).
- **필수값 오류는 인라인이다.** `ValidationDialog` 는 쓰지 않고 Figma `107:8905` 모달안은 폐기한다. 동작은 `reservation-form` 패턴(제출 시 전체 검증 · 모든 오류 줄 동시 표시 · 다음 제출 때 갱신 · 첫 오류로 스크롤, 포커스 이동 없음 · `role="alert"` + `aria-describedby`), 외형은 Figma `107:8777` 실측이다. 문구는 `국명을 입력해주세요!` · `영문명과 학명을 모두 입력해주세요!` · `사진을 등록해주세요!` (2026-09-15 개발자 결정).
- 세부 분류는 선택 입력(별표 없음, 오류 없음)이고 형식은 `{목} - {과}`(Figma 수정 프레임 `설치목 - 천축서과`)다 (2026-09-15 개발자 결정).
- 분류군은 진입 시 `포유류` 가 선택돼 있고 분류군 오류는 없다 (2026-09-15 Figma·저장소 근거 판단: Figma 모든 프레임(빈 생성 폼 포함)에 `포유류` 선택).
- 법정지정분류는 기본 선택지 3개(`legalDesignationPresets`)를 눌러 선택/해제하고, `+ 법정분류 추가` 모달로 추가한 이름은 목록 끝에 즉시 선택 상태로 붙는다. X 는 직접 추가 항목에만 있고 누르면 목록에서 뺀다(Figma 는 기본 선택지에도 X 를 그렸다 — 차이). 선택 표시는 `accent`/`accentBg`. 직접 추가 항목은 그 종에만 저장한다. 수정 화면은 기본 선택지 + 저장된 직접 추가 항목(선택·X)으로 복원한다 (2026-09-15 개발자 결정).
- 법정분류 추가 모달은 빈 값·공백만이면 `추가하기` 를 비활성으로 두고, 이미 목록에 있는 이름이면 모달 안 인라인 `이미 있는 분류입니다!` 를 보인다 (2026-09-15 개발자 결정). 모달은 `features/species-form` 전용이다 (2026-09-15 Figma·저장소 근거 판단: `TeamAddDialog` 구조 승계, 문구·규격이 달라 공용화하지 않는다).
- 사진은 1장만 둔다 — chip 은 유형 아이콘 → 다운로드 → 파일명이고 제거 버튼이 없으며 새 업로드로 교체한다. 여러 파일·이미지 외·50MB 초과는 드롭존 아래 인라인 `role="alert"` 3종 문구로 거부한다 (2026-09-15 Figma·저장소 근거 판단: Figma `84:8781`·`84:8848`·`127:9358` chip, `AttachmentField` 오류 위치).
- 저장 실패는 버튼 위 문구(`role="status"`)로 알린다. `ErrorDialog` 는 쓰지 않는다 (2026-09-15 Figma·저장소 근거 판단: `TaskForm` `SubmitStatus` 선례).
- 이탈 확인은 `LeaveConfirmationDialog` 다 (2026-09-15 Figma·저장소 근거 판단: 같은 yot 파일 업무 수정 `really exit?` `1:3606` 선례).
- 폼↔제출 버튼 간격은 22px 다 (2026-09-15 Figma·저장소 근거 판단: 생성 프레임 실측, 수정 프레임의 겹침은 그리기 오류).
- 사진 등록 성공·실패 토스트는 띄우지 않는다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 토스트 섹션 `311:12786` 에 생성 성공만 있다).
- 수정 저장 성공 토스트는 띄우지 않고 상세 이동으로 피드백을 대신한다 (2026-09-15 Figma·저장소 근거 판단: `task-edit`·개체관리 Figma 에 수정 성공 토스트가 없다).
- 이동 후 토스트는 `task-list` navigate state 규약(`create-success` / `delete-success` / `delete-error`)을 따른다 (2026-09-15 Figma·저장소 근거 판단: `TaskListPage`·`CreateTaskPage`·`TaskDetailPage` 선례, 삭제 토스트 문구는 업무관리 `1:3398`/`1:3360`).
- 없는 id 는 `<대상>을(를) 찾을 수 없습니다.` + 부모 화면 링크(종 `목록으로 돌아가기` · 개체 `종 상세로 돌아가기` · 관찰 `개체 상세로 돌아가기`)로 보인다 (2026-09-15 Figma·저장소 근거 판단: `TaskDetailPage`·`EditTaskPage` not-found 패턴).
- mock 함수·localStorage 키·query key 는 소유 spec(종 `species-list` · 개체 `species-detail` · 관찰 `individual-detail`) 이름을 쓰고, 지연 주입 키는 두지 않는다 (2026-09-15 Figma·저장소 근거 판단: `entities/resource/model/mock.ts` 패턴, 저장소 mock 에 지연 주입 선례가 없고 지연은 `/api` 단계 route mock `mutationDelayMs` 에서 검증).
- 사진 데이터는 `photo: { fileName: string; fileKey: string; url: string }` 이다. 종 1 `카피바라_2026.jpg`, 개체 1 `동식이_2026.jpg` 이고 나머지도 항목마다 다른 파일명을 둔다(이미지 바이트는 공용 에셋 1장 가능) (2026-09-15 Figma·저장소 근거 판단: 저장소 첨부 규약 `{ fileName, fileKey }` + 표시용 `url`, Figma 종 수정 chip `동식이_2026.jpg` 는 복사 오류).
- 사진 mock 입력은 `species-form`·`individual-form` 공통 `PhotoInput = { kind: 'new'; file } | { kind: 'existing'; photo }` 이다 (2026-09-15 Figma·저장소 근거 판단: 같은 `PhotoUploadField` 값을 넘기고 저장 형태가 `photo` 로 같다).
- 종 1 fixture 세부 분류는 `설치목 - 천축서과` 다 (2026-09-15 개발자 결정).
- 신규 토큰 `color.choiceMuted`(`#70707D`)·`color.textValue`(`#5C5C68`)·`color.warningText`(`#8A5A00`)를 추가하고, 드롭존 점선 테두리는 기존 `colors.textGuide` 를 유지한다 (2026-09-15 Figma·저장소 근거 판단: map-tokens 신규 3색, 업무 폼 드롭존은 ⑦ 육안 확인까지 끝난 구현).
- 신규 공용 `FormFieldCard`(+`FormFieldLabel`, 관찰 수정용 `labelSize`)·`PillRadioGroup`·`PhotoUploadField`·`FileDropZone` 을 채택한다. `PhotoUploadField` chip 유형 아이콘은 Figma 아이콘 에셋(`features/create-resource/ui/assets/file-*.svg` → `shared/ui/assets`)을 쓴다 (2026-09-15 Figma·저장소 근거 판단: design-rules §1 같은 INSTANCE 2곳 이상(종·개체 폼 `field / *`·`upload file`)).
- 기존 shared 시각 차이(`DataTable` 헤더 글자색·검색 아이콘 크기, `Toast` 그림자, 모달 제목 굵기·dim 0.4/0.5, `RemoveIconButton` 크기·색, `KebabMenu` 그림자 blur)는 기존 구현을 유지하고 ⑦ 육안 확인에서 판단한다 (2026-09-15 Figma·저장소 근거 판단: 전 화면 공용 구현이라 개체관리 화면 기준으로 바꾸지 않는다).
- 반응형은 기존 화면의 980px 규칙을 승계한다 (2026-09-15 Figma·저장소 근거 판단: 개체관리 Figma 에 좁은 화면 프레임이 없다).

## 미결 사항

- [ ] **텍스트 입력 길이 제한·중복 종(같은 국명/학명) 검사** — Figma·Notion API 명세 모두 근거가 없어 게이트 ② 에서도 정하지 않았다.
      이번 슬라이스는 두지 않고, 서버 제약이 정해지는 `/api` 계약 때 결정한다.

### 범위 밖

- `RowActionMenu`↔`KebabMenu` 통합, `Wanted Sans`/`Inter` 글꼴 정리, 실제 API 연동(`/api` 스킬), 먹이 급여 화면, 직원 권한별 UI 분기.
