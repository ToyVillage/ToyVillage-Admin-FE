---
feature: task-list
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 3056:2599
requires_functional_test: true
paths: src/pages/tasks, src/entities/task, src/features/create-task
---

# 업무관리 목록 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-08-11
- 목록 화면 기준: Figma `3056:2599` ("task management" / 업무관리)
- 파생 상태: `3085:2924`(동일 목록의 사본 — 4행 상태 pill 텍스트가 비어 있는 디자인 미완성본)
- 토스트: `4292:7254`, `4292:7137`, `4292:7005`
- 추출 캐시: `harness/artifacts/publishing/task-list.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

Figma 파일에는 `task management` 라는 같은 이름의 프레임이 두 종류 있다. 이 spec 의 대상은
**업무관리(`3056:2599`)** 이고, `4043:4498`(업무일지관리)은 폐기된 기능이라 구현 대상이 아니다.
따라서 `/tasks` 네임스페이스는 업무관리가 단독으로 사용한다.

## 목적

운영 관리자가 토이빌리지 직원에게 내린 업무 지시를 한 화면에서 확인한다. 담당자·상태·우선순위·완료기한·공개범위를
표로 훑고, 상태 탭으로 좁혀 보고, 개별 업무로 이동하거나 새 업무를 등록한다.

## 범위

- 포함: 목록 조회, 상태 탭 필터, 페이지네이션, 행 클릭 이동, 업무 등록 진입, 빈 상태, 삭제 결과 토스트 표시
- 제외: 실제 API 연동(`/api` 스킬 담당), 업무 생성·수정·삭제 폼(`task-create` / `task-edit`),
  업무 보고(task report) 화면, 검색·정렬, 다중 선택

## 라우트와 진입

- `/tasks` → 업무관리 목록을 표시한다.
- `업무 등록하기` 클릭 → `/tasks/create` 로 이동한다.
- 목록의 행 클릭 → `/tasks/:id` 로 이동한다.
- 목록 진입 시 항상 `전체 업무` 탭과 1페이지에서 시작한다.
- 사이드바에 `업무관리 바로가기` 항목을 추가한다. 클릭 → `/tasks` 로 이동하고 사이드바가 닫힌다.
  사이드바 자체의 동작 계약은 `harness/publishing/specs/sidebar.spec.md` 를 따르며 이 spec 은 항목 추가만 한다.

## 동작 (behavioral spec — source of truth)

- 화면 진입 → 제목 `업무관리`, 부제 `토이빌리지 업무 지시`, `전체 업무` 탭 활성, 1페이지 목록이 보인다.
- `업무 등록하기` 버튼 클릭 → `/tasks/create` 로 이동한다.
- `진행중` 탭 클릭 → 상태가 `진행중`인 업무만 남고 목록이 1페이지로 리셋된다.
- `완료` 탭 클릭 → 상태가 `완료`인 업무만 남고 목록이 1페이지로 리셋된다.
- `전체 업무` 탭 클릭 → 모든 상태의 업무가 다시 보인다.
- 목록의 행 클릭 → 해당 업무의 `/tasks/:id` 로 이동한다.
- 페이지 번호 클릭 → 해당 페이지의 행으로 목록이 바뀐다. 한 페이지는 4행이다.
- `이전 페이지` / `다음 페이지` 클릭 → 한 페이지씩 이동한다. 1페이지에서 `이전 페이지`, 마지막 페이지에서
  `다음 페이지`는 비활성이다.
- 현재 탭의 결과가 없으면 → 행 대신 `등록된 업무가 없습니다.` 를 표시하고 페이지네이션을 숨긴다.
- 완료기한이 오늘보다 이전인 업무 → 완료기한 셀을 위험색(`colors.danger`)으로 표시한다.
  상태와 무관하게 날짜만으로 판정한다(Figma `3056:2599` 2행이 상태 `완료`인데도 위험색인 것과 일치).
- 업무 삭제 성공 후 `/tasks` 로 돌아온 경우 → 우상단에 `데이터 삭제에 성공했습니다` 토스트를 표시하고
  일정 시간 뒤 사라진다.
- 업무 삭제 실패 조건이 전달된 경우 → 우상단에 `데이터 삭제에 실패했습니다` 토스트를 표시한다.

## 화면 구조와 시각 규격

1920px 데스크톱 기준. 좌상단 메뉴 버튼은 기존 사이드바(`SidebarToggleButton` / `Sidebar`)를 재사용한다.
본문은 너비 1320px, 좌우 중앙 정렬이다. 페이지 배경은 `colors.background`.

1. 헤더(`y=124`, 높이 122): 제목 `업무관리` 60px SemiBold `colors.text`, 부제 `토이빌리지 업무 지시`
   32px Medium `colors.textGuide`. 우측 하단 정렬로 `+ 업무 등록하기` 버튼
   — 배경 `colors.textStrong`, radius 53px, padding 12/16px, 아이콘 32px + 라벨 24px SemiBold 흰색, gap 8px.
2. 탭바(`y=278`, 높이 46): `전체 업무` / `진행중` / `완료`. 활성 탭은 22px SemiBold `colors.text` +
   하단 실선, 비활성 탭은 22px Medium `colors.textGuide`. 첫 탭 padding 10/40px, 이후 탭 10/44px.
   Figma의 네 번째 탭(`팀이름 3`)은 `visible: false` 이므로 렌더하지 않는다.
3. 테이블(`y=364`, 너비 1320): 헤더행 높이 72, 배경 `#DDDDE3`, padding 16/52px.
   컬럼은 `담당자` `제목` `상태` `우선순위` `완료기한` `공개범위` 6개이며 각 셀 폭 152px, 컬럼 간 gap 32px
   (본문 행은 gap 104px, padding 30/49px, 행 높이 100px, 배경 `colors.surface`, 행 구분선 `colors.textFaint`).
   헤더·셀 텍스트는 22px Medium.
4. 상태 pill: 높이 40px, padding 8/12px, radius 80px, 20px Medium.
   - `진행중` — 배경 `#DDDDE3`, 글자 `colors.textGuide`
   - `완료` — 배경 `colors.accentBg`, 글자 `colors.accent`
   - `반려` — 배경 `#FFE8C3`, 글자 `#FDB542`
5. 우선순위 배지: 36×36 원(radius 50px), 20px Medium.
   - `상` — 배경 `colors.accentBg`, 글자 `colors.accent`
   - `중` — 배경 `#FFE8C3`, 글자 `#FDB542`
   - `하` — 배경 `#FFCECE`, 글자 `colors.danger`
6. 페이지네이션(`y=884`, 중앙 정렬): 좌우 chevron 28px, 번호 32×32 radius 24px, gap 20px, 그룹 gap 16px.
   활성 번호 22px `colors.accent` + 배경 `colors.accentBg`, 비활성 18px `colors.pageMuted`.
7. 토스트: 우상단(`x=1432 y=32`), 440×80, radius 12px, 배경 `colors.surface`,
   그림자 `0 0 10px rgba(0, 0, 0, 0.25)`, padding 20/24px, 아이콘 40px + 메시지 28px Medium, gap 24px.

색과 Wanted Sans는 기존 theme를 우선한다. px·radius·그림자는 Emotion 스타일에 직접 작성한다.

신규 semantic color 토큰(게이트에서 확정, `tokens.ts` 에 추가):

| 값 | 토큰 | 용도 |
|----|------|------|
| `#DDDDE3` | `color.tableHeaderStrong` | 테이블 헤더행 배경 / 진행중 pill 배경 / 업로드 드롭존 배경 |
| `#FDB542` | `color.warning` | 반려 pill 글자 / 우선순위 `중` |
| `#FFE8C3` | `color.warningBg` | 반려 pill 배경 / 우선순위 `중` 배경 |
| `#FFCECE` | `color.dangerBg` | 우선순위 `하` 배경 |
| `#1F1F1F` | `color.toastIcon` | 토스트 아이콘 |

## 데이터

```ts
type TaskStatus = 'IN_PROGRESS' | 'DONE' | 'REJECTED' // 진행중 / 완료 / 반려
type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW' // 상 / 중 / 하

interface TaskListItem {
  id: string
  assignee: string // 담당자
  title: string // 제목
  status: TaskStatus
  priority: TaskPriority
  dueDate: string // 완료기한, YYYY-MM-DD
  visibility: string // 공개범위 표시 문자열
}
```

- `status` 는 목록 표시 전용 파생값이다. 이번 범위에서 상태를 바꾸는 UI 는 만들지 않는다(Figma 에도 없다).
- `visibility` 는 목록에서는 Figma 목록 표기(`전체 공개` / `특정 파트` / `특정 직원`)를 그대로 쓰고,
  생성·수정 폼의 드롭다운 옵션(`전체 직원` / `팀이름 1` / `팀이름 2`)과는 별개로 둔다.
  두 값의 통합은 API 연동 시 결정한다.

- 조회 endpoint 후보: `GET /tasks`
- query key: `['tasks']`
- 이번 슬라이스는 `src/entities/task/model/mock.ts` 의 고정 mock 으로 대체하고 실제 API 는 연결하지 않는다.
  mock 은 Figma 기준 4행(이승현/진행중/상/2026-07-03/전체 공개, 김수인/완료/하/2026-07-01/특정 파트,
  이지아/완료/상/2026-07-20/특정 직원, 이승현/반려/중/2026-07-28/전체 공개)과, 페이지네이션·빈 상태를
  재현할 수 있는 추가 행을 포함한다.
- 탭 필터·페이지 번호는 페이지가 소유하는 로컬 상태다. 전역 상태로 올리지 않는다.

## 컴포넌트 구조/props

- `TaskListPage` — `/tasks` 페이지. 탭·페이지 상태 소유, 필터·슬라이싱 담당.
- `CategoryTabs`(기존 `src/pages/notices/notice/ui/CategoryTabs.tsx`) — 탭 UI 재사용 여부를 게이트에서 판단한다.
  Figma 탭 스펙(활성 하단선 + SemiBold)이 기존 구현과 동일하다.
- `DataTable`(기존 `src/shared/ui/DataTable.tsx`) — 6컬럼 구성, `pagination`, `emptyLabel`, `onRowClick` 사용.
  상태 pill / 우선순위 배지 / 기한 초과 색은 `DataTableColumn.render` 로 주입한다.
- `TaskStatusBadge { status }` — 상태 pill.
- `TaskPriorityBadge { priority }` — 우선순위 원형 배지.
- `CreateTaskButton` — `+ 업무 등록하기` 버튼.
- `Toast { variant: 'success' | 'error', message }` — **신규 공용 컴포넌트 후보**. 저장소에 토스트가 없다.

## 접근성

- 탭은 `aria-pressed`(또는 tablist semantics)로 활성 상태를 노출한다.
- 각 행은 키보드로 활성화 가능하며 접근 가능한 이름에 담당자와 제목을 포함한다.
- 상태·우선순위 배지는 색만이 아니라 텍스트로도 값을 전달한다.
- 페이지네이션 버튼은 `이전 페이지` / `다음 페이지` / `N 페이지` 이름을 제공하고 경계에서 `disabled` 로 표시한다.
- 토스트는 `role="status"`(성공) / `role="alert"`(실패)로 알린다.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- 980px 이하에서는 제목 크기와 카드 padding 을 줄이고 본문은 가용 너비를 사용한다.
- 테이블은 좁은 화면에서 가로 스크롤을 허용하되 페이지 전체가 가로 스크롤되지 않게 한다.
- 컨트롤의 터치 영역은 최소 44px 을 유지한다.

## 기능 테스트 수용 기준

- S1: `/tasks` 진입 → 제목·부제가 보이고 `전체 업무` 탭이 활성이며 4행이 보인다.
- S2: `업무 등록하기` 클릭 → `/tasks/create` 로 이동한다.
- S3: `진행중` 탭 클릭 → 상태가 `진행중`인 행만 남는다.
- S4: `완료` 탭 클릭 → 상태가 `완료`인 행만 남는다.
- S5: 행 클릭 → `/tasks/:id` 로 이동한다.
- S6: `2 페이지` 클릭 → 2페이지 행으로 바뀐다.
- S7: 1페이지에서 `이전 페이지`, 마지막 페이지에서 `다음 페이지`가 비활성이다.
- S8: 2페이지를 보는 중 탭을 바꾸면 1페이지로 리셋된다.
- S9: 결과가 없는 탭 → 빈 상태 문구가 보이고 페이지네이션이 사라진다.
- S10: 완료기한이 지난 행 → 완료기한 셀이 위험색으로 보인다.
- S11: 삭제 성공으로 목록에 돌아오면 → 성공 토스트가 보이고 잠시 후 사라진다.
- S12: 키보드만으로 탭 전환·페이지 이동·행 진입을 수행할 수 있다.

## 결정 사항 (게이트 ② 승인)

- 라우트는 `/tasks`, `/tasks/create`, `/tasks/:id` 로 확정한다. 업무일지관리는 폐기되어 충돌하지 않는다.
- 사이드바에 `업무관리 바로가기` 항목을 추가한다(Figma 사이드바에는 아직 없다).
- 빈 상태 문구는 `등록된 업무가 없습니다.` 로 한다.
- 공개범위는 목록 표기와 폼 옵션을 **각각 Figma 그대로** 둔다.
- 상태(`진행중/완료/반려`)는 표시 전용 파생값이며 변경 UI 를 만들지 않는다.
- 완료기한 위험색은 상태와 무관하게 "오늘 이전"으로만 판정한다.
- 토스트 문구는 화면 맥락 기준으로 정한다. Figma 인스턴스의 아이콘/문구 잔재
  (`#4292:7137` 실패 아이콘 + `데이터 생성에 성공했습니다`, `#4292:7005` `데이터 생성에 실패했습니다`)는
  디자인 미정리로 보고 채택하지 않는다. 목록 화면은 `데이터 삭제에 성공했습니다` / `데이터 삭제에 실패했습니다`
  두 가지만 쓴다. 표시 시간은 3초, 동시 1개다.
- `Toast` 를 `src/shared/ui` 에 신규 추가한다.
- 신규 색 토큰 이름은 위 표대로 확정한다.

## 미결 사항 (이번 범위 밖)

- [ ] 실제 업무 API endpoint 계약 / 백엔드 담당 — `/api` 스킬에서 처리한다.
- [ ] 목록 `공개범위` 표기와 폼 옵션의 통합 — API 연동 시 결정한다.
