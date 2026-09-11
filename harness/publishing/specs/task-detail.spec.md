---
feature: task-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 133:9725
  relatedNodeIds:
    - 152:11493
    - 152:11510
    - 152:11536
    - 133:9735
requires_functional_test: true
paths: src/pages/tasks, src/entities/task, src/entities/task-report, src/features/row-actions
---

# 업무 상세 행동명세

## 상태와 근거

- Status: Published (게이트 ② 승인 2026-09-07 · ③~⑤ 완료 · ⑦ 육안 확인 2026-09-08 yunho09)
- Last refreshed: 2026-09-08
- 기준 파일은 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `웹 (operator)` ›
  `업무관리`(`300:12757`) › `업무관리 · 상세`(`311:12775`).
- 상세 화면 기준: `133:9725` (`task detail`)
- 구성 컴포넌트: `task info`(`152:11493`) / `report summary`(`152:11510`) / `progress`(`152:11536`) /
  우상단 케밥 `133:9735`
- 육안 대조용 렌더: `harness/artifacts/publishing/task-form-ref/detail.png`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-07)

이 환경에는 `design-input-contract.md` §1 의 `get_figma_data` 가 없다. §5 fallback 으로,
`get_metadata`(구조·좌표·크기)와 `get_screenshot`(시각)으로 실측해 이 spec 에 수동 기재했다.
`get_design_context` 는 호출하지 않았다.

- **yot 실측 확인**: 화면 골격(`133:9725`), 요약행 4항목 좌표·크기(`152:11493`),
  업무보고 항목 pitch·배지·chevron(`152:11510`), 진행도 카드 도넛 크기·요약 위치(`152:11536`).
- **미검증**: 도넛 조각 색 배정(스크린샷 픽셀 관찰), 케밥 메뉴 항목 구성(목록 화면 `126:9298` 승계),
  접근성·반응형 절 전체(Figma 에 근거 프레임 없음).

## 목적

운영 관리자가 목록에서 업무 한 건을 열어 지시 내용과 첨부자료를 확인하고, 담당자별 업무보고 심사 현황과
전체 진행도를 한눈에 본다. 필요하면 케밥으로 수정 화면에 들어가거나 삭제한다.

## 범위

- 포함: 업무 조회, 요약행(담당자·상태·우선순위·완료기한), 제목·상세 내용, 첨부자료 다운로드,
  담당자별 업무보고 목록과 상태 배지, 업무보고 상세 진입, 진행도 도넛과 요약 문구,
  케밥 메뉴(수정·삭제), 삭제 확인 모달, 삭제 결과 토스트, 없는 업무 처리
- 제외: 실제 API 연동(`/api` 스킬 담당), 폼 편집(`task-edit`), 업무 생성(`task-create`),
  업무보고 심사 자체(`task-report`), 상태 변경, 수정 이력

## 라우트와 진입

- 목록 행 클릭 / 목록 케밥 `수정` → `/tasks/:id` (이 화면). **`/tasks/:id` 는 읽기 전용 상세다.**
- 이 화면 케밥 `수정` → `/tasks/:id/edit` 로 이동한다(`task-edit`).
- `뒤로가기` → `/tasks` 로 돌아간다. 편집이 없으므로 이탈 확인은 없다.
- 업무보고 항목 클릭 → `/task-reports/:reportId` 로 이동한다(`task-report`).
- 삭제 성공 → `/tasks` 로 이동하고 목록이 `데이터 삭제에 성공했습니다` 토스트를 띄운다.

> **라우팅 변경**: 이전에는 `/tasks/:id` 가 수정 폼이었다. 이 spec 이 그 자리를 상세로 가져가고
> 수정은 `/tasks/:id/edit` 로 내려간다. `task-list` 의 승인 시나리오 S16(케밥 `수정` → `/tasks/:id`)이
> 이 결정으로 바뀌므로 `task-list` 재승인이 필요하다.

## 동작 (behavioral spec — source of truth)

### 조회

- `/tasks/:id` 진입 → 해당 업무의 요약행·제목·상세 내용·첨부자료·업무보고·진행도가 보인다.
- 없는 id → `업무를 찾을 수 없습니다.` 와 `목록으로 돌아가기` 링크를 표시한다.
- 불러오는 중 → `업무를 불러오는 중입니다.` 를 표시한다.

### 요약행

- `담당자` — 대표 1명 이름 + `외 N명`. 담당자가 1명이면 이름만 표시한다(`task-list` 와 같은 규칙).
- `상태` — `진행중` / `완료` / `지연` pill. 목록과 같은 `TaskStatusBadge` 를 쓴다.
- `우선순위` — `상` / `중` / `하` 배지. 목록과 같은 `TaskPriorityBadge`(42×40 pill)를 쓴다.
- `완료기한` — `YYYY-MM-DD`. **여기서는 기한 초과 위험색을 적용하지 않는다**(Figma 가 검정이다).

### 제목·상세 내용

- 제목과 상세 내용을 그대로 표시한다. 편집 컨트롤은 없다.
- 상세 내용이 길면 줄바꿈해 이어 표시한다.

### 첨부자료

- 첨부가 있으면 파일 chip 을 나열한다. chip 은 확장자 아이콘 + 파일명 + 다운로드 아이콘이다.
- 다운로드 아이콘 클릭 → 해당 파일을 내려받는다.
- 첨부가 없으면 첨부자료 카드를 표시하지 않는다.

### 업무보고

- 이 업무의 **담당자별 보고 현황**을 나열한다. 제출한 사람만이 아니라 담당자 전원이 한 줄이다
  (2026-09-11 `TASK_QUERY` 연동 — 서버 `reports[]` 가 담당자 전원을 준다).
- 각 항목은 담당자 이름 + 심사 상태 배지 + `>` 다.
- 심사 상태 배지는 `승인` / `반려` / `심사대기` / `재제출` 네 가지를 그대로 표시한다
  (합산은 진행도 요약에서만 한다).
- **서버의 `MISSING`(미제출)은 화면에서 `심사대기` 로 보여준다**(2026-09-11 개발자 결정).
  미제출을 따로 표기하지 않는다. `재제출` 은 현재 서버 상태에 없다.
- 제출된 보고가 있는 항목만 클릭 → `/task-reports/:reportId` 로 이동한다.
- 아직 보고가 없는 줄(`workReportId: null`)은 열 대상이 없어 버튼이 아니고 `>` 도 없다.
  배지는 다른 `심사대기` 줄과 같다.
- 보고 현황이 비면 `제출된 업무 보고가 없습니다.` 를 표시하고 진행도 카드를 숨긴다.

### 진행도

- 도넛 차트로 심사 상태 분포를 표시하고, 아래에 `전체 N · 승인 N · 반려 N · 심사대기 N` 을 쓴다.
- 도넛 조각은 세 개다 — 승인 `colors.accent`, 반려 `colors.warning`, 심사대기 `colors.pageMuted`.
- 숫자는 서버 집계(`progress`)에서 온다. 화면에서 `reports` 로 다시 세지 않는다.
- **`재제출` 과 `미제출` 은 `심사대기` 에 합산한다**(재제출 2026-09-07, 미제출 2026-09-11 개발자 결정).
  별도 조각도 별도 문구도 만들지 않는다. 즉 `심사대기 N` 은 `progress.pending + progress.missing` 이다.
- 도넛은 차트 라이브러리를 새로 넣지 않고 인라인 SVG 로 그린다.

### 케밥 메뉴

- 우상단 `⋮` 클릭 → `수정` / `삭제` 두 항목이 열린다. 목록과 같은 `RowActionMenu` 를 재사용한다.
- 바깥 클릭 또는 `Escape` → 닫히고 초점이 `⋮` 로 돌아온다.
- `수정` → `/tasks/:id/edit` 로 이동한다.
- `삭제` → 메뉴가 닫히고 삭제 확인 모달이 열린다.

### 삭제

- 삭제 확인 모달은 목록과 같다(`DeleteConfirmationDialog`): 제목 `정말 삭제하시겠습니까?`,
  본문 `삭제하신 뒤에는 영구삭제되며` / `복구 할 수 없습니다`, 버튼 `취소` / `확인`.
- `취소` / 바깥 클릭 / `Escape` → 모달이 닫히고 초점이 `⋮` 로 돌아온다.
- `확인` → 삭제 후 `/tasks` 로 이동하고 목록이 `데이터 삭제에 성공했습니다` 토스트를 띄운다.
- 삭제 실패 → 모달을 닫고 이 화면에 `데이터 삭제에 실패했습니다` 토스트를 띄운다. 화면은 그대로 둔다.
- 삭제 처리 중에는 `확인` 을 다시 눌러도 요청이 중복 전송되지 않는다.

## 화면 구조와 시각 규격

1920px 데스크톱 기준. 본문 너비 1320px, 좌우 중앙 정렬. 페이지 배경 `colors.background`.
좌상단 메뉴 버튼(`36×36 @36,32`)은 기존 사이드바를 재사용한다.

1. 상단행: `뒤로가기`(`133:9728`, `@300,75` 1320×36) — 기존 `TaskBackLink` 재사용.
   우측 끝에 케밥(`133:9735`, `@1576,67` 44×52).
2. 본문(`133:9739`, `@300,160` 1320×1021), 카드 간 세로 간격 32px, 카드 radius 20px, 배경 `colors.surface`.
3. 요약행 카드(`task info` `152:11493`, 1320×154): padding 40px.
   항목 4개가 x=40 / 400 / 720 / 1040 에 각각 280 폭으로 놓인다.
   - 라벨 20px `colors.textGuide`(높이 24), 값은 라벨에서 34px 아래.
   - 담당자 값: 이름 22px `colors.text` + `외 N명` 20px `colors.textGuide`, 간격 8px.
   - 상태 pill 76×40, 우선순위 배지 42×40 — 목록과 같은 컴포넌트.
   - 완료기한 22px `colors.text`.
4. 제목·상세 내용 카드(`137:9734`, `@y=186` 1320×172): padding 40px.
   제목 32px SemiBold `colors.text`(높이 47), 상세 내용은 제목에서 71px 아래 20px Medium `colors.textGuide`.
5. 첨부자료 카드(`134:9762`, `@y=390` 1320×140): 라벨 `첨부자료` 20px `colors.textGuide` @40,24.
   chip 은 @40,60 부터 높이 56, radius 8px, 테두리 `colors.dialogBorder`, chip 간 간격 48px.
   chip 내부: 확장자 아이콘 20px @12 + 파일명 18px @40 + 다운로드 아이콘 24px(우측 12px 안쪽).
   기존 `AttachmentList` 의 chip 과 같은 계열이므로 먼저 재사용을 검토한다.
6. 하단행(`133:9790`, `@y=562` 1320×459): 업무보고 카드 868×459 @0, 진행도 카드 420×339 @900.
7. 업무보고 카드(`report summary` `152:11510`): 라벨 `업무 보고` 22px `colors.text` @40,40.
   항목은 @40,87 부터 788×68, pitch 88px, radius 12px, 배경 `colors.background`.
   이름 22px @24, 상태 배지 40 높이(우측 끝에서 126px 안쪽), `>` 6×14 (우측 끝에서 30px 안쪽).
8. 진행도 카드(`progress` `152:11536`, 420×339): 제목 `진행도` 22px 가운데 @y=40.
   도넛 160×160 @130,91 (두께 40px, 안쪽 지름 80). 요약 문구 20px `colors.textGuide` 가운데 @y=275.

색과 font family 는 기존 theme 를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.

### 신규 semantic color 토큰 후보

없다. 도넛 조각은 기존 `accent` / `warning` / `pageMuted` 로 충분하다.

## 데이터

```ts
interface TaskDetail {
  id: string
  assignees: TaskMember[] // 담당자 (다중) — task-create spec 의 모델과 공유
  title: string
  content: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string // YYYY-MM-DD
  attachments: TaskAttachment[]
}

interface TaskReportSummaryItem {
  reportId: string | null // null = 아직 보고가 없다(누를 수 없다)
  assigneeName: string
  reviewStatus: TaskReportReviewStatus // 승인 / 반려 / 심사대기 / 재제출
}
```

- 담당자 모델(`assignees`)과 `visibility` 제거는 `task-create.spec.md` 의 데이터 절을 따른다.
- 조회 endpoint: `GET /tasks/:id`, query key: `['tasks', id]`
- 업무보고·진행도는 **같은 상세 응답**의 `reports`·`progress` 를 쓴다(2026-09-11).
  추가 조회가 없고, `entities/task-report` 의 mock 조회는 이 화면에서 쓰지 않는다.
- 업무보고 목록·상세 화면(`/task-reports`)은 아직 mock 이다(별도 API 범위).

## 컴포넌트 구조/props

- `TaskDetailPage` — `/tasks/:id` 페이지. 케밥·삭제 모달·토스트 상태 소유. **기존 파일을 상세로 교체한다.**
- `TaskInfoRow { assignees, status, priority, dueDate }` — **신규**(`entities/task/ui`). 요약행 4항목.
- `TaskAssigneeCell` — 기존 재사용. 요약행 담당자 값 표기가 목록 셀과 같다.
- `TaskStatusBadge` / `TaskPriorityBadge` — 기존 재사용.
- `AttachmentList` — 기존 확인 후 재사용. 다운로드 chip 형태가 맞는지 먼저 본다.
- `TaskReportSummaryCard { items, onSelect }` — **신규**(`entities/task-report/ui`). 담당자별 보고 목록.
- `TaskProgressCard { counts }` — **신규**(`entities/task-report/ui`). 인라인 SVG 도넛 + 요약 문구.
- `RowActionMenu` — 기존 재사용(`features/row-actions`). 목록에서 만든 것을 그대로 쓴다.
- `DeleteConfirmationDialog` / `Toast` — 기존 재사용.

## 접근성

- 케밥은 `aria-haspopup="menu"` / `aria-expanded` 를 제공하고 메뉴는 `role="menu"`, 항목은 `role="menuitem"`,
  `Escape` 로 닫히고 초점이 케밥으로 돌아온다.
- 삭제 확인 모달은 열릴 때 초점을 가두고, 닫히면 초점을 케밥으로 되돌린다.
- 요약행은 라벨과 값을 프로그램적으로 연결한다(정의 목록 또는 `aria-labelledby`).
- 업무보고 항목은 키보드로 활성화 가능하며 접근 가능한 이름에 담당자와 심사 상태를 포함한다.
- 도넛은 장식이 아니라 정보이므로 요약 문구를 텍스트로 함께 제공하고, 차트 자체는 `aria-hidden` 으로 둔다.
- 첨부 다운로드 버튼의 접근 가능한 이름에 파일명을 포함한다.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- 980px 이하에서는 하단행(업무보고 + 진행도)을 세로로 쌓고 카드 padding 을 줄인다.
- 요약행 4항목은 좁은 화면에서 2열로 접는다.
- 컨트롤의 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준 (초안 — 게이트 ② 승인 필요)

- S1: `/tasks/:id` 진입 → 요약행(담당자·상태·우선순위·완료기한)·제목·상세 내용이 보인다.
- S2: 담당자가 여럿인 업무 → `이승현 외 3명`, 1명이면 이름만 보인다.
- S3: 첨부가 있는 업무 → 파일 chip 이 첨부 수만큼 보이고 각 chip 에 다운로드 버튼이 있다.
- S4: 첨부가 없는 업무 → 첨부자료 카드가 보이지 않는다.
- S5: 업무보고가 있는 업무 → 담당자별 항목과 심사 상태 배지가 보인다.
- S6: 업무보고 항목 클릭 → `/task-reports/:reportId` 로 이동한다.
- S7: 진행도 요약 문구가 `전체 N · 승인 N · 반려 N · 심사대기 N` 으로 실제 건수와 맞는다.
- S8: 업무보고가 없는 업무 → 빈 문구가 보이고 진행도 카드가 사라진다.
- S9: `뒤로가기` → `/tasks` 로 이동한다(이탈 확인 없음).
- S10: 우상단 `⋮` 클릭 → `수정` / `삭제` 메뉴가 열린다.
- S11: 메뉴 바깥 클릭 / `Escape` → 메뉴가 닫히고 초점이 `⋮` 로 돌아온다.
- S12: 메뉴 `수정` 클릭 → `/tasks/:id/edit` 로 이동한다.
- S13: 메뉴 `삭제` → 삭제 확인 모달이 열린다.
- S14: 모달 `취소` → 모달이 닫히고 상세 화면이 그대로 남는다.
- S15: 모달 `확인` → `/tasks` 로 이동하고 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S16: 삭제 실패 → 상세 화면에 `데이터 삭제에 실패했습니다` 토스트가 뜨고 화면이 유지된다.
- S17: 없는 id 로 진입 → `업무를 찾을 수 없습니다.` 와 목록 복귀 링크가 보인다.
- S18: 완료기한이 지난 업무여도 상세 요약행의 완료기한은 위험색이 아니다.
- S19: 키보드만으로 케밥 열기·항목 실행·업무보고 진입을 수행할 수 있다.

## 결정 사항

- `/tasks/:id` 를 상세로, `/tasks/:id/edit` 를 수정으로 분리한다(2026-09-07 개발자 결정).
- 상세는 읽기 전용이다. 상태 변경 UI 를 만들지 않는다.
- 도넛은 라이브러리를 추가하지 않고 인라인 SVG 로 그린다.
- 케밥·삭제 모달·토스트는 목록에서 만든 것을 그대로 재사용한다.
- **업무보고 목록은 제출 순서로 보여준다**(2026-09-08 개발자 결정). Figma `152:11510` 은
  승인 → 승인 → 반려 → 심사대기 순으로 그려져 심사 상태 정렬처럼 보이지만, 정렬 규칙이 아니라
  예시 데이터로 보고 제출 순서를 유지한다. 실제 데이터가 붙으면 `/api` 에서 재검토한다.

## 미결 사항

- [x] **게이트 ② 승인**(2026-09-07 yunho09, S1~S19). e2e 변환·freeze·통과 완료(19/19).
- [x] **`task-list` 재승인** — S16(케밥 `수정` → `/tasks/:id/edit`) 재승인·재변환 완료(2026-09-07).
- [x] **`task-report` 재승인**(2026-09-11) — 그 spec 의 S16 이 `업무 보고 상세조회` 버튼을 When 으로
      삼았는데, 이 화면이 담당자별 보고 현황 줄로 대체했다. S16 을 그 줄 클릭으로 고치고 재freeze 했다.
      업무보고 상세는 아직 mock 이라 이동한 뒤 내용까지는 확인하지 않는다.
- [x] `재제출` 은 진행도 요약에서 `심사대기` 에 합산한다(2026-09-07 개발자 결정).
- [ ] 업무보고 빈 상태 문구는 Figma 근거가 없다(`제출된 업무 보고가 없습니다.` 는 임시안).
      서버가 담당자 전원을 주므로 이 문구는 담당자가 없는 업무에서만 보인다. 문구를 바꿀지 재검토 필요.
- [ ] `reports[].status` 의 허용값이 명세에 없다. `PENDING` 은 같은 응답의 `progress.pending` 을 근거로
      받고 있다(`harness/artifacts/api/task.backend-questions.md` 5번).
- [x] 서버 `MISSING`(미제출)은 `심사대기` 로 표시하고 진행도에서도 심사대기에 합산한다
      (2026-09-11 개발자 결정). 미제출을 별도 배지·조각으로 두지 않는다.
- [ ] 첨부 다운로드의 실제 동작(서버 파일 URL) — `/api` 스킬 담당.
