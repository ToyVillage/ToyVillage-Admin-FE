---
feature: task-report
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 3118:4294
  nodes:
    - 3118:4294 # 목록
    - 3350:3962 # 상세(심사)
    - 3350:4018 # 상세 + 반려 사유 모달
requires_functional_test: true
paths: src/pages/task-reports, src/entities/task-report, src/features/review-task-report
---

# 업무보고 행동명세 (목록 + 심사 상세)

## 상태와 근거

- Status: Approved (yunho09 승인, 시나리오 S1–S23 — 반려 사유 모달 슬라이스 포함 2026-08-22 재승인)
- Last refreshed: 2026-08-21
- 목록 화면 기준: Figma `3118:4294` ("task report" / 업무보고)
- 상세(심사) 화면 기준: Figma `3350:3962` ("report management")
- 반려 사유 모달 기준: Figma `3350:4018` ("Reason for Rejection") — 상세 화면 위 오버레이 `3125:4869`
- 결과 표시(이번 범위 제외, 다음 슬라이스): `4310:7791`(반려 성공 토스트), `4515:8096`(승인 성공 토스트),
  `4310:7729`(반려 실패 토스트), `4515:8115`(승인 실패 토스트),
  `3803:4932`/`3803:4994`(같은 실패를 모달로 표현한 중복본)
- 추출 캐시: `harness/artifacts/publishing/task-report.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

`task-list` spec 이 "업무 보고(task report) 화면"을 범위에서 명시적으로 제외하고 있었고,
`TaskDetailPage` 의 `업무 보고 상세조회` 버튼은 "이동 대상 화면이 이번 범위에 없어 표시만 한다"는
주석과 함께 `disabled` 로 남아 있다. 이 spec 이 그 화면을 채운다.

## 목적

운영 관리자가 직원이 제출한 업무보고를 심사 상태(심사대기·완료·반려·재제출)별로 훑고,
한 건을 열어 제출 내용과 첨부자료를 확인한 뒤 승인하거나 반려한다.

## 범위

- 포함: 업무보고 목록(탭 필터·표·페이지네이션·빈 상태), 업무보고 상세 조회(메타 요약·제목·상세 내용·첨부자료 다운로드),
  승인/반려 처리와 처리 후 목록 이동, **반려 시 반려 사유 모달(2026-08-21 추가)**, 업무 상세에서 업무보고로의 진입,
  사이드바에 `업무 보고 바로가기` 항목 추가(개발자 승인 — TODO-2 해결. 이후 Figma 사이드바 `1541:1412`에도 반영됨)
- 제외: **승인·반려 결과 표시(성공 토스트·실패 토스트·실패 모달) — 개발자 결정으로 다음 슬라이스**,
  실제 API 연동(`/api` 스킬 담당 — 이번 슬라이스는 mock 경계), 보고 작성·수정·삭제(직원 화면),
  재제출 요청 처리, 검색·정렬·다중 선택, 사이드바 자체의 열림/닫힘 등 동작 계약 변경(`sidebar.spec.md` 담당)

## 라우트와 진입

- `/task-reports` → 업무보고 목록.
- `/task-reports/:id` → 업무보고 상세(심사).
- `/tasks/:id`(업무 상세)의 `업무 보고 상세조회` 버튼 → **그 업무에 올라온 업무보고 상세**(`/task-reports/:reportId`)로 이동한다.
  해당 업무의 보고가 없으면 이동할 상세가 없으므로 버튼을 비활성으로 둔다(기존 동작 유지).
- 사이드바에 `업무 보고 바로가기` 항목을 추가한다. 클릭 → `/task-reports` 로 이동하고 사이드바가 닫힌다.
  사이드바 자체의 동작 계약은 `harness/publishing/specs/sidebar.spec.md` 를 따르며 이 spec 은 항목 추가만 한다.
  아이콘은 Figma 에 업무보고용 에셋이 없어 업무관리와 같은 `task` 아이콘을 재사용한다.
- 목록 화면 안에는 별도 진입 버튼을 두지 않는다(Figma 근거 없음).
  - 라우트를 `/tasks/...` 아래가 아니라 별도 네임스페이스로 두는 이유: `/tasks/:id` 와의 정적/동적 세그먼트 경합을 피하고,
    업무보고 목록이 특정 업무 한 건이 아니라 전체 심사 큐이기 때문이다.
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout`(App.tsx)이 전역 렌더하므로 두 페이지는 본문만 담당한다.

## 화면 구조 — 목록 (Figma 3118:4294)

1920px 데스크톱 기준, 본문 폭 1320, 좌측 x300. 페이지 배경 `background`(#F5F5F7).

1. 타이틀 @300,124: `업무보고`(60 SemiBold, `text`) + `토이빌리지 업무 보고 관리`(32 Medium, `textGuide`).
   업무관리 목록과 달리 우측 등록 버튼이 없는 `nonadd_title` 변형이다.
2. 탭바 @300,278 (h46): `심사대기 n` `완료 n` `반려 n` `재제출 n`. 활성 탭은 22 SemiBold `text` + 하단선,
   비활성은 22 Medium `textGuide`. Figma 의 `팀이름 3` 탭은 `visible=false` 라 구현 대상이 아니다.
3. 표 @300,356 (w1320): 헤더 h72 `tableHeaderStrong`(#DDDDE3), 행 h100 `surface`, 행 구분선 `#AFAFBA`.
   컬럼 순서는 `담당자` `제목` `상태` `우선순위` `완료기한` `공개범위` 로 업무관리 목록 표와 동일한
   컴포넌트 계열(#4267:4693 vs #3721:3736)이다. 헤더 우측 끝의 32x32 빈 프레임은 자식이 없어 렌더 대상이 아니다.
4. 페이지네이션: 표 아래 가운데. 이전/다음 chevron 28, 번호 32x32 radius24, 활성 `accentBg`/`accent`,
   비활성 `pageMuted`.

## 화면 구조 — 상세 (Figma 3350:3962)

본문 폭 1320, 좌측 x300. 페이지 배경 `background`.

0. 뒤로가기 링크 @300,75: chevron(24, `textGuide`) + `뒤로가기`(24 SemiBold, `textGuide`).
   업무 상세(`TaskDetailPage`)·업무 등록 화면의 `TaskBackLink` 와 같은 규격이며, 목록 `/task-reports` 로 이동한다.
1. 메타 요약행 @300,164 (h42, gap 20): `우선순위:` + 우선순위 배지(원형/pill, radius80, `accentBg`+`accent` 등 기존 배지 색),
   `상태:` + 상태 pill(w80 h40, radius80, `warningBg`+`warning` 등), `담당자: {이름}`, `완료 기한: {YYYY-MM-DD}`,
   `공개 범위: {값}`. 라벨 20 Medium, 값 22 Medium, 모두 `text`.
2. 제목 카드 (h162, `surface`, radius20, padding40): 라벨 `제목`(22 Medium) + 값(40 Medium).
3. 상세 내용 카드 (h240, `surface`, radius20, padding40): 라벨 `상세 업무 내용 *`(별표 `danger`) + 본문(18 Medium).
4. 첨부자료 카드 (h140, `surface`, radius20): 라벨 `첨부자료`(24 Medium, `textGuide`) + 파일 chip 목록.
   chip 은 확장자 아이콘 + 파일명(16 Medium) + 다운로드 아이콘, 테두리 `#AFAFBA`.
   삭제(X) 아이콘 노드는 `visible=false` 이고 업로드 드롭존도 없다 → **조회 전용**이다.
5. 하단 우측 버튼 2개 (각 123x61, radius8, 24 SemiBold): `반려하기`(투명 배경 + `danger` 2px 테두리·글자),
   `승인하기`(`text` 배경 + `surface` 글자). 기존 `TaskForm` 의 삭제/저장 버튼과 규격이 동일하다.

상세 화면 상단에 뒤로가기 링크를 둔다(2026-08-14 개발자 제공 디자인 반영 — 최초 슬라이스에는 없었다).
목록 복귀는 뒤로가기 또는 승인·반려 처리 후 이동으로 일어난다.

## 화면 구조 — 반려 사유 모달 (Figma 3350:4018)

상세 화면 위에 오버레이(`#000000` 50%)를 덮고 가운데에 모달을 띄운다.

1. 모달: w560, radius20, `surface`, padding40, 세로 배치 gap20 (높이는 내용에 맞춘다 — Figma 432).
2. 제목: `반려 사유를 작성해주세요` (28 SemiBold, `text`, 가운데 정렬).
3. 사유 입력: w480 h206, radius12, 배경 `background`, padding20, 여러 줄 입력.
   placeholder `반려 사유 작성` (22 Medium, `textFaint`).
4. `확인` 버튼: 가로 채움(480) h73, radius12, 배경 `text` + 글자 `surface`(28 Medium), 테두리 `dialogBorder`.
   Figma 에는 취소 버튼도 닫기(X) 아이콘도 없다.

## 동작 (source of truth)

### 목록

- `/task-reports` 진입 → 업무보고 목록을 조회한다. 로딩 중에는 로딩 안내, 실패하면 오류 안내를 보인다
  (기존 `TaskListPage` 의 상태 패턴을 따른다).
- 기본 활성 탭은 `심사대기` 이고, 그 심사 상태의 보고만 표시한다.
- 탭 라벨은 `{상태명} {건수}` 형태로, 건수는 조회 결과에서 파생한다.
- 탭 클릭 → 해당 심사 상태로 목록을 필터하고 1페이지로 되돌린다.
- 한 페이지에 3건을 표시한다(Figma 표 높이 372 = 헤더 72 + 행 100 × 3). 결과가 3건을 넘으면 페이지네이션을 보인다.
- 행 클릭/Enter → 해당 보고의 `/task-reports/:id` 로 이동한다.
- 표시할 행이 없으면 `등록된 업무보고가 없습니다.` 를 보이고 페이지네이션을 감춘다.
- 승인·반려 후 돌아온 경우에도 이번 범위에서는 결과 토스트를 표시하지 않는다(다음 슬라이스).
  처리 결과는 해당 보고가 `완료`/`반려` 탭으로 옮겨간 것으로 확인한다.

### 상세

- `/task-reports/:id` 진입 → URL 의 `:id` 로 보고 단건을 조회한다. 로딩 중 안내, 없으면 "찾을 수 없음" +
  목록 링크를 보인다(기존 `TaskDetailPage` 상태 패턴).
- 조회한 보고의 우선순위·상태·담당자·완료 기한·공개 범위를 메타 요약행에, 제목·상세 내용을 각 카드에 렌더한다.
- 첨부자료는 파일명과 확장자 배지로 표시하고, 다운로드 아이콘 클릭 시 해당 파일을 내려받는다. 삭제·추가 수단은 없다.
- `뒤로가기` 클릭 → 아무 것도 처리하지 않고 `/task-reports` 로 이동한다. 상세는 편집 화면이 아니라 이탈 확인 dialog 를 두지 않는다.
- `승인하기` 클릭 → 보고를 승인 처리한다. 성공하면 `/task-reports` 로 이동한다.
- `반려하기` 클릭 → 이 시점에는 반려 처리를 보내지 않고 **반려 사유 모달**을 연다.
- 모달의 `확인` 클릭 → 입력한 사유와 함께 보고를 반려 처리한다. 성공하면 `/task-reports` 로 이동한다
  (모달 도입 전의 반려 동작과 결과는 같다).
- 반려 사유는 필수다. 입력이 비어 있거나 공백뿐이면 `확인` 을 비활성으로 둔다(개발자 결정 2026-08-21 —
  Figma 에 유효성 안내가 없어 별도 오류 문구는 그리지 않는다).
- 모달은 Esc 또는 오버레이 클릭으로 닫는다(Figma 에 취소 버튼이 없어 저장소의 기존 dialog 패턴을 따른다).
  닫으면 반려 처리는 일어나지 않고 상세에 머무른다.
- 모달이 열려 있는 동안 초점은 모달 안에 가둔다(기존 `DeleteConfirmationDialog` 와 같은 규칙).
- 반려 처리 중에는 `확인` 을 비활성화해 중복 제출을 막는다.
- 처리 실패 시 화면에 머무르고 버튼을 다시 누를 수 있게 되돌린다. 실패 안내(토스트·모달)는 이번 범위에서 그리지 않는다.
- 처리 중에는 두 버튼을 비활성화해 중복 제출을 막는다.
- 이미 완료·반려된 보고에서도 두 버튼은 그대로 보인다(Figma 상세는 상태 `반려` 인 상태로 두 버튼을 함께 보여준다).

## 데이터와 API 경계 (mock)

- 서버 상태는 TanStack Query 로만 다룬다. Query Key: `['task-reports']`, `['task-reports', id]`.
- 실제 API 는 연결하지 않는다. `src/entities/task-report/model/mock.ts` 가 교체 경계다
  (기존 `entities/task/model/mock.ts` 와 같은 localStorage 방식).
- mock 데이터는 Figma 행(이승현/김수인/이지아 · `업무 제목` · 완료 · 상/하/중 · 2026-07-03/07-01/07-28 · 전체 공개/특정 파트)을
  1페이지로 재현하고, 페이지네이션(1·2·3)을 재현하도록 `심사대기` 를 7건 두어 3페이지가 되게 한다.
  나머지는 `완료` 3건, `반려` 2건, `재제출` 2건.
- 반려 사유는 심사 상태와 같은 localStorage mock 경계에 보관한다
  (`toyvillage:task-reports:reject-reasons`, id → 사유). 실제 API 로 교체할 때 요청 body 로 옮긴다.
- 테스트 제어점은 기존 업무 mock 규약을 따른다: 처리 지연(`toyvillage:task-reports:mutation-delay`),
  요청 로그(`toyvillage:task-reports:mutation-log`). 실패 주입 키는 결과 표시 슬라이스에서 함께 추가한다.
  실제 API 로 교체할 때 함께 제거한다.

## 컴포넌트 구조/props

- `entities/task-report/model/types.ts`
  - `taskReportReviewStatuses = ['PENDING','APPROVED','REJECTED','RESUBMITTED']`, `TaskReportReviewStatus`
  - `TaskReport { id, taskId?, assigneeId, title, content, reviewStatus, taskStatus, priority, dueDate, visibility, attachments? }`
    (`taskId` 는 업무 상세의 `업무 보고 상세조회` 진입에 쓴다)
  - `TaskReportListItem` — 표 렌더용 파생 타입
- `entities/task-report/model/labels.ts` — `심사대기 / 완료 / 반려 / 재제출`
- `entities/task-report/ui/TaskReportTable.tsx` — 표. 컬럼 구성이 업무관리 목록과 같으므로
  `shared/ui/DataTable` 을 쓰고 상태/우선순위 셀은 기존 `entities/task` 의 `TaskStatusBadge`·`TaskPriorityBadge` 를
  재사용한다(entities → entities 는 ESLint 상 허용).
- `features/review-task-report/ui/TaskReportReviewActions.tsx` — `반려하기`/`승인하기` 버튼 + 처리 mutation.
  반려는 모달 확인 후에 mutation 을 보낸다.
- `features/review-task-report/ui/RejectReasonDialog.tsx` — 반려 사유 모달(제목·사유 입력·`확인`).
  `shared/ui` 의 확인 dialog 들은 문구가 고정된 alertdialog 라 입력이 있는 이 모달과 책임이 달라
  feature 안에 둔다. props: `pending`, `onCancel`, `onConfirm(reason)`.
- `pages/task-reports/TaskReportListPage.tsx`, `pages/task-reports/TaskReportDetailPage.tsx`
- `shared/ui/AttachmentList.tsx` (신규 후보) — 읽기 전용 첨부 목록(파일명 + 확장자 배지 + 다운로드).
  기존 `AttachmentField` 는 편집 전용(드롭존·삭제)이라 그대로 두고 건드리지 않는다. 게이트 승인 대상(TODO-2).

## 토큰

`task-report.token-diff.report.md` 기준 신규 색 후보는 `#FF7878`(첨부 pdf 아이콘) 하나뿐이고,
기존 `color.primary`(#FF8181)가 이미 같은 자리(첨부 chip 의 pdf 배지)에 쓰이고 있다 →
**신규 토큰을 만들지 않고 기존 `primary` 를 재사용**한다. 그 외 색·폰트는 모두 기존 theme 에 존재한다.

## 육안 확인 결과 (⑦ 통과, 2026-08-11)

개발자가 `yarn dev` 로 Figma 원본(`3118:4294`, `3350:3962`)과 비교해 승인했다. 재작업 항목 없음.

## 비고 / 제약 (게이트 결정 사항)

- **결과 표시 이월:** 승인·반려 성공 토스트와 실패 토스트/모달은 이번 범위에서 구현하지 않는다(개발자 결정).
  Figma 근거 노드는 위 "상태와 근거"에 남겨 두었고, 다음 슬라이스에서 표현 방식(토스트 vs 모달)을 함께 정한다.
- **TODO-1 (신규 shared 컴포넌트):** 읽기 전용 `AttachmentList` 를 `shared/ui` 에 추가한다.
- **TODO-2 (목록 진입 경로) — 해결:** 업무 상세의 `업무 보고 상세조회` 는 **상세 단건**으로 가는 버튼이라 목록 진입점이
  따로 필요했다. 당시 Figma 사이드바(`1541:1423`~)에 업무보고 항목이 없었지만, 업무관리 때와 같은 판단으로
  `업무 보고 바로가기` 항목을 추가했다(개발자 승인). 이후 Figma 사이드바(`1541:1412`)에도 반영됐다.
- **TODO-3 (상태 컬럼 의미):** 목록의 `상태` 컬럼은 `심사대기` 탭에서도 `완료` pill 로 그려져 있어, 심사 상태가 아니라
  **업무(task) 상태**로 읽힌다. 상세의 `상태: 반려` 도 같은 pill 계열이다. 이 해석대로 기존
  `TaskStatusBadge`(진행중/완료/반려)를 재사용하고, 심사 상태는 탭으로만 표현하는 것을 기본안으로 제안한다.
  심사 상태를 컬럼에도 노출하려면 `심사대기`·`재제출` pill 색이 Figma 에 없으므로 디자인 확인이 필요하다.
- 반응형은 기존 페이지들과 같은 기준(980px 이하에서 카드/버튼 줄바꿈)을 따른다.
