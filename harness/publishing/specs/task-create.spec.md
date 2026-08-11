---
feature: task-create
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 3477:3597
requires_functional_test: true
paths: src/pages/tasks, src/features/create-task, src/entities/task
---

# 업무 등록 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-08-11
- 생성 화면 기준: Figma `3477:3597` ("task make", 빈 폼)
- 오버레이: `3843:5049`(완료기한 캘린더), `3851:5193`(공개범위 드롭다운), `3843:5105`(담당자 드롭다운)
- 검증 모달: `3878:4348`, `3878:4406`, `3878:4464`, `3878:4290`, `3878:4174`, `3878:4232`
- 토스트: `4310:7720`, `4310:7719`
- 추출 캐시: `harness/artifacts/publishing/task-create.figma.txt`
- 목록 계약: `harness/publishing/specs/task-list.spec.md`

## 목적

운영 관리자가 직원에게 내릴 새 업무 지시를 작성한다. 우선순위·완료기한·공개범위·담당자와 제목·상세 내용을
입력하고 참고 자료를 첨부해 등록한다. 실수로 이탈해도 입력을 잃지 않아야 한다.

## 범위

- 포함: 빈 폼 진입, 우선순위 선택, 완료기한 선택, 공개범위 선택, 담당자 선택, 제목·상세 내용 입력,
  첨부 추가·제거, 필수값 검증, 생성, 이탈 보호, 첨부 결과 토스트
- 제외: 실제 API 연동(`/api` 스킬 담당), 수정·삭제(`task-edit`), 업무 보고 화면, 첨부 파일 서버 업로드 본문

## 라우트와 진입

- 목록의 `업무 등록하기` 클릭 → `/tasks/create` 로 이동한다.
- `뒤로가기` 클릭 → `/tasks` 로 돌아간다(입력이 있으면 이탈 확인을 거친다).
- 생성 성공 → `/tasks` 로 이동한다.

## 동작 (behavioral spec — source of truth)

- 진입 시 모든 필드는 비어 있다. 우선순위는 아무것도 선택되지 않고, 완료기한은 `연도. 월. 일`,
  공개범위는 `전체 직원`, 담당자는 `직원 목록에서 선택`, 제목은 `제목을 입력해주세요`,
  상세 내용은 `상세 업무 내용을 입력해주세요` placeholder 를 보여준다.
  공개범위의 `전체 직원` 은 **선택되지 않은 placeholder** 이며 검증 대상이다(Figma 에 `공개범위를 선택해주세요`
  검증 모달이 존재한다).
- 우선순위 `상` / `중` / `하` 중 하나 클릭 → 그 항목만 선택 상태가 된다(단일 선택, 토글 해제 없음).
- 완료기한 필드 클릭 → 날짜 선택기가 열리고, 날짜를 고르면 `YYYY.MM.DD` 형식으로 표시된다.
- 공개범위 필드 클릭 → `전체 직원` / `팀이름 1` / `팀이름 2` 옵션이 열리고, 선택하면 목록이 닫히며 값이 바뀐다.
- 담당자 필드 클릭 → 직원 목록이 열리고, 선택하면 목록이 닫히며 값이 바뀐다.
- 드롭다운이 열린 상태에서 바깥 클릭 또는 `Esc` → 선택 없이 닫히고 기존 값이 유지된다.
- 제목·상세 업무 내용에 텍스트를 입력할 수 있다. 저장 시 앞뒤 공백을 제거한다.
- 업로드 드롭존 클릭 또는 파일 드래그 앤 드롭 → 파일이 첨부자료 목록에 chip 으로 추가된다(다중 가능).
- 첨부 chip 의 제거 컨트롤 클릭 → 해당 첨부가 목록에서 사라진다.
- 파일 하나가 50MB 를 초과하면 → 첨부하지 않고 오류를 알린다.
- 첨부 추가에 성공 → 성공 아이콘 + `첨부파일 등록에 성공했습니다` 토스트를 표시한다.
- 첨부 추가에 실패 → 실패 아이콘 + `첨부파일 등록에 실패했습니다` 토스트를 표시한다.
  (Figma `#4310:7720` 은 실패 아이콘에 성공 문구가 붙어 있으나 컴포넌트 기본값 잔재로 보고 채택하지 않는다.)
- `생성하기` 클릭 시 필수값이 비어 있으면 → 요청을 보내지 않고 첫 번째 누락 항목의 검증 모달을 띄운다.
  모달의 `확인` 을 누르면 해당 필드로 포커스가 이동한다. 검증 순서와 문구는 아래 "검증" 절을 따른다.
- 모든 필수값이 채워진 상태에서 `생성하기` 클릭 → 생성 요청을 한 번만 보낸다. 요청 중에는 중복 제출을 막는다.
- 생성 성공 → 업무 목록 query 를 갱신하고 `/tasks` 로 이동한다. 목록에 새 업무가 보인다.
- 생성 실패 → 현재 URL 과 모든 입력을 보존하고 실패를 알린다.
- 입력이 하나라도 있는 상태에서 `뒤로가기` / 사이드바 이동 / 브라우저 뒤로가기 → 이탈 확인 모달
  `정말 나가시겠습니까?` 를 띄운다. `취소` 또는 `Esc` 는 현재 화면과 입력을 유지하고, `확인` 은 이동한다.
- 생성 성공에 의한 이동은 이탈 확인 대상에서 제외한다.

## 검증

필수: 우선순위, 완료기한, 공개범위, 담당자, 제목, 상세 업무 내용. 첨부자료는 선택이다.

검증 순서와 모달 문구(화면의 시각적 순서와 동일):

1. 우선순위 미선택 → `우선순위를 선택해주세요`
2. 완료기한 미선택 → `완료기한을 선택해주세요`
3. 공개범위 미선택 → `공개범위를 선택해주세요`
4. 담당자 미선택 → `담당자를 선택해주세요`
5. 제목 공백 → `제목을 입력해주세요`
6. 상세 업무 내용 공백 → `상세 업무 내용을 입력해주세요`

검증 모달은 메시지 한 줄과 전체폭 `확인` 버튼 하나로 구성된다(기존 `ValidationDialog` 와 동일한 형태).
Figma 는 6개 상태를 개별 프레임으로만 제공하고 순서를 명시하지 않으므로, **화면의 시각적 순서를 검증 순서로
확정**한다. 완료기한은 과거 날짜도 허용한다(캘린더에 비활성 규칙이 없다).
완료기한 표시 형식은 폼에서 `YYYY.MM.DD`, 목록에서 `YYYY-MM-DD` 로 Figma 를 그대로 따른다.

## 화면 구조와 시각 규격

1920px 기준, 본문 너비 1320px 중앙 정렬. 페이지 배경 `colors.background`.
좌상단 메뉴 버튼은 기존 사이드바를 재사용한다.

1. `뒤로가기`(`y=75`, 1320×36): chevron 36px + 라벨 24px SemiBold, 색 `colors.textGuide`, gap 10px.
2. 폼 컨테이너(`y=219`, 1320×1268): 세로 배치, 카드 간 gap 32px.
3. 우선순위 그룹(815×134, gap 20px): 라벨 `우선순위를 선택해주세요` 22px Medium `colors.textStrong`.
   버튼 3개는 각 240×88, radius 800px, gap 120px. 미선택 배경 `colors.surface` + 글자 `colors.text`,
   선택 시 배경 `colors.accentBg` + 글자 `colors.accent`. 라벨 32px Medium.
4. 3열 카드 행(1320×190, gap 21px) — 각 카드 426px, radius 20px, 배경 `colors.surface`, padding 40px:
   - 완료기한: 라벨 `완료기한` 20px Medium, 입력 346×68 radius 8px 배경 `colors.background`,
     padding 20/24px, 값 22px Medium + 캘린더 아이콘 28px.
   - 공개범위: 라벨 `공개범위를 선택해주세요` 22px Medium, 입력 346×66 radius 8px 배경 `colors.background`,
     값 22px Medium + chevron 24px(`colors.textFaint`).
   - 담당자: 라벨 `담당자를 선택해주세요` 22px Medium, 입력 346×64 radius 8px 배경 `colors.background`,
     padding 12/20px, placeholder `직원 목록에서 선택` 22px Medium `colors.textFaint` + chevron.
5. 제목 카드(1320×164, radius 20px, padding 40px, gap 10px): 라벨 `제목 *` 22px Medium,
   입력 40px Medium(placeholder `colors.textGuide`). `*` 는 위험색으로 표시한다.
6. 상세 업무 내용 카드(1320×240, radius 20px): 라벨 `상세 업무 내용 *` 22px Medium,
   입력 18px Medium(placeholder `colors.textGuide`).
7. 첨부자료 카드(1320×140, radius 20px): 라벨 `첨부자료` 22px Medium `colors.textGuide`.
   파일 chip 은 높이 56px, padding 16/12px, gap 8px, 테두리 1px `colors.textFaint`,
   유형 아이콘 20px(pdf `#FF7777`, png `#00B48A`, jpg `#FFCB77`) + 파일명 16px + 다운로드 24px + 제거 24px.
   빈 상태에서는 chip 이 없다.
8. 업로드 드롭존(1320×240, radius 20px): 배경 `#DDDDE3`, 점선 테두리 2px `#5C5C68`,
   업로드 아이콘 48px + 안내 `파일을 끌어서 놓거나 클릭하여 업로드\n(최대 50MB)` 18px Medium `colors.textGuide`.
9. `생성하기` 버튼(우하단, 123×61): 배경 `colors.text`, radius 8px, padding 16/20px, 라벨 24px SemiBold 흰색.

Figma의 파생 프레임(`3843:5049`, `3843:5105`, `3851:5193`)에는 버튼 라벨이 `저장하기` 로 남아 있으나
생성 화면의 기준 라벨은 기본 프레임(`3477:3597`)의 `생성하기` 다.

## 데이터와 API 경계

```ts
interface CreateTaskInput {
  priority: TaskPriority // 상 / 중 / 하
  dueDate: string // YYYY-MM-DD
  visibility: string // 공개범위
  assigneeId: string // 담당자
  title: string
  content: string
  attachments: string[]
}
```

- 생성 endpoint 후보: `POST /tasks`
- 담당자 목록 endpoint 후보: `GET /employees`
- query key: `['tasks']`
- 이번 슬라이스는 localStorage 기반 mock 으로 대체한다. 실제 API 는 연결하지 않는다.
- 담당자·공개범위 옵션은 mock 상수로 둔다. 실제 API 연결 시 첨부는 multipart 또는 선업로드 계약을 별도로 확정한다.

## 컴포넌트 구조/props

- `CreateTaskPage` — `/tasks/create` 페이지.
- `TaskForm { mode: 'create' | 'edit', initialValue?, onSubmit, onDelete? }` — 생성·수정 공용 폼.
  `task-edit` 과 동일한 필드를 쓰므로 복제하지 않고 mode 로 분기한다.
- `TaskPriorityField { value, onChange }` — 우선순위 3분할 pill.
- `TaskDueDateField { value, onChange }` — 완료기한. 기존 `CloseScheduleDateField`(create-close-schedule)와
  마크업·placeholder(`연도. 월. 일`)·캘린더 아이콘이 동일하다. **공용화 후보**.
- `TaskSelectField { label, placeholder, options, value, onChange }` — 공개범위·담당자 공용 셀렉트.
- `TaskAttachmentField` — 첨부 chip + 드롭존. 기존 `NoticeAttachmentField` / `ResourceUploadField` 와
  동작·문구(`파일을 끌어서 놓거나 클릭하여 업로드 (최대 50MB)`)가 동일하다. **공용화 후보**.
- `ValidationDialog`(기존 `src/shared/ui`) — 검증 모달 재사용.
- `LeaveConfirmationDialog`(기존 `src/features/create-notice/ui`) — 이탈 확인 모달. **공용화 후보**.
- `Toast` — 첨부 결과 토스트. `task-list` 와 동일한 신규 공용 컴포넌트 후보.

## 접근성

- 우선순위는 fieldset/legend + radio semantics 를 유지한다.
- 제목 input 과 상세 내용 textarea 는 프로그램적 label 과 required 상태를 제공한다.
- 공개범위·담당자는 키보드로 열고 닫고 선택할 수 있으며 `Esc` 로 닫힌다.
- 파일 chip 은 `${파일명} 다운로드`, `${파일명} 삭제` 이름을 제공한다.
- 업로드 드롭존은 키보드로 조작 가능한 `파일 업로드` 버튼이다.
- 검증 모달과 이탈 확인 모달은 modal semantics, 포커스 트랩, 호출 컨트롤 복귀를 제공한다.
- 기본 키보드 순서: 뒤로가기 → 우선순위 → 완료기한 → 공개범위 → 담당자 → 제목 → 상세 내용 →
  첨부 컨트롤 → 파일 업로드 → 생성하기.

## 반응형

- 980px 이하에서는 3열 카드 행을 세로로 쌓고 카드 padding 과 제목 입력 크기를 줄인다.
- 우선순위 버튼은 좁은 화면에서 폭을 나눠 쓰고 gap 을 줄인다.
- 가로 스크롤 없이 모든 입력과 모달을 조작할 수 있어야 한다.

## 기능 테스트 수용 기준

- S1: 목록의 `업무 등록하기` → `/tasks/create` 로 이동하고 빈 폼이 보인다.
- S2: 우선순위 `중` 클릭 → `중`만 선택 상태가 된다.
- S3: 완료기한 선택 → 선택한 날짜가 필드에 표시된다.
- S4: 공개범위 드롭다운에서 다른 값 선택 → 값이 바뀌고 목록이 닫힌다.
- S5: 담당자 드롭다운에서 값 선택 → placeholder 가 선택값으로 바뀐다.
- S6: 드롭다운을 연 뒤 `Esc` → 선택 없이 닫히고 기존 값이 유지된다.
- S7: 모든 필수값 입력 후 `생성하기` → `/tasks` 로 이동하고 목록에 새 업무가 보인다.
- S8: 우선순위만 비운 채 `생성하기` → 요청 없이 `우선순위를 선택해주세요` 모달이 뜬다.
- S9: 제목만 비운 채 `생성하기` → `제목을 입력해주세요` 모달이 뜨고 확인 후 제목으로 포커스가 이동한다.
- S10: 상세 업무 내용만 비운 채 `생성하기` → `상세 업무 내용을 입력해주세요` 모달이 뜬다.
- S11: 파일 추가 → chip 이 나타나고 성공 토스트가 보인다. 제거하면 chip 이 사라진다.
- S12: 입력이 있는 상태에서 `뒤로가기` → 이탈 확인 모달이 뜨고 `취소` 시 입력이 유지된다.
- S13: 생성 요청 중 재클릭 → 중복 요청을 보내지 않는다.
- S14: 키보드만으로 전체 입력·검증·생성을 수행할 수 있다.

## 결정 사항 (게이트 ② 승인)

- 라우트는 `/tasks/create` 로 확정한다.
- 검증 순서는 화면 시각 순서(우선순위 → 완료기한 → 공개범위 → 담당자 → 제목 → 상세 내용)로 확정한다.
- 공개범위 옵션은 Figma 폼 드롭다운(`전체 직원 / 팀이름 1 / 팀이름 2`)을 그대로 쓰고, 목록 표기와는 별개로 둔다.
- 공개범위의 `전체 직원` 표시는 placeholder 로 해석하고 미선택 시 검증한다.
- 완료기한 표시 형식은 Figma 그대로 폼 `YYYY.MM.DD`, 목록 `YYYY-MM-DD` 를 유지한다. 과거 날짜를 허용한다.
- 첨부 토스트는 성공/실패 아이콘과 문구를 맥락에 맞게 매칭한다(Figma 잔재 미채택).
- 생성 성공 토스트는 만들지 않는다. 성공 시 `/tasks` 로 이동하는 것으로 피드백을 대신한다.
- 이탈 확인은 생성 화면에도 적용한다(기존 `create-notice` 관례).
- 공용화: `TaskDueDateField` / `TaskAttachmentField` / `LeaveConfirmationDialog` / `Toast` 를 shared 로 올린다.

## 미결 사항 (이번 범위 밖)

- [ ] 실제 업무 API endpoint 와 첨부 업로드 계약 / 백엔드 담당 — `/api` 스킬에서 처리한다.
- [ ] 50MB 초과 파일 오류의 표시 방식(Figma 에 해당 상태 없음) — 기존 `NoticeAttachmentField` 방식을 따른다.
