---
feature: task-report
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:3510
  nodes:
    - 1:3510 # 목록
    - 337:12757 # 목록 + 행 케밥 메뉴
    - 347:12834 # 목록 + 반려 사유 모달
    - 1:7503 # 상세(심사)
    - 1:7635 # 상세 + 반려 사유 모달
    - 1:3528 # 목록 + 반려 성공 토스트
    - 1:3547 # 목록 + 승인 성공 토스트
    - 347:12859 # 목록 + 승인 실패 토스트
    - 347:12882 # 목록 + 반려 실패 토스트
    - 1:7527 # 상세 + 반려 실패 토스트
requires_functional_test: true
paths: src/pages/task-reports, src/entities/task-report, src/features/review-task-report
---

# 업무보고 행동명세 (목록 + 심사 상세)

## 상태와 근거

- Status: Approved (yunho09, S1–S4·S6–S33, 2026-09-13 yot 기준 재승인 · ③~⑤ 완료 · e2e freeze). ⑦ 육안 확인 대기.
  이전: Approved (yunho09, S1–S24, 2026-09-11 재승인 · e2e freeze) — 폐기된 `toyvillage-dev`(`fkbMQaiPeIufKzjXXoWAPS`) 기준.
- Last refreshed: 2026-09-13
- 기준 파일은 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 페이지 `0:1` "토이빌리지" › 섹션 `웹 (operator)` ›
  `업무보고`(`300:12758`) › `업무보고 · 목록`(`311:12779`) / `업무보고 · 상세`(`311:12780`) / `업무보고 · 토스트`(`311:12781`).
- 목록 화면 기준: `1:3510` (`task report`) — 표 `report list`(`141:9720`), 탭바 `report / 심사 상태 탭바`(`145:11718`)
- 행 케밥 메뉴 기준: `337:12757` — `kebab menu`(`337:12775`)
- 목록 위 반려 사유 모달 기준: `347:12834`
- 상세 화면 기준: `1:7503` (`report management`) — `report / 보고 상세 카드`(`145:15468`)
- 상세 위 반려 사유 모달 기준: `1:7635`
- 결과 토스트 기준: `1:3528`(반려 성공) · `1:3547`(승인 성공) · `347:12859`(목록 승인 실패) ·
  `347:12882`(목록 반려 실패) · `1:7527`(상세 반려 실패)
- 근거에서 제외한 프레임:
  - `1:7552` — 상세 승인 실패 토스트 프레임이지만 본문이 `상세 업무 내용 *` / `특이사항 내용 *` 로 떼어낸 잔여 레이아웃이다.
    **상세 디자인은 `1:7503` 하나다(개발자 확인 2026-09-13).** 토스트 문구(`승인에 실패했습니다`)만 근거로 쓴다.
  - `1:7606` / `1:7577` — 상세 반려·승인 실패를 확인 모달로 그린 중복본. 실패는 토스트로 통일한다(개발자 결정 2026-09-13).
- 추출 캐시: `harness/artifacts/publishing/task-report.figma.txt`, 육안 대조용 렌더: `harness/artifacts/publishing/task-report-ref/*.png`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

### 검증 상태 (2026-09-13)

이 환경에는 `design-input-contract.md` §1 의 `get_figma_data` 가 없다. §5 fallback 으로,
`get_metadata`(구조·좌표·크기)와 `get_screenshot`(시각)으로 실측해 이 spec 에 수동 기재했다.
`get_design_context` 는 호출하지 않았다.

- **yot 실측 확인**: 목록 골격(`1:3510`), 표 컬럼 폭·행 높이(`141:9720`), 케밥 메뉴 항목·크기(`337:12775`),
  반려 사유 모달 규격(`347:12834`), 상세 골격(`1:7503`), 상세 카드 내부 섹션 좌표(`145:15468`),
  토스트 위치·크기(`311:12781`).
- **미검증**: 배지·pill 색(스크린샷 관찰 — 기존 `task-detail` 의 심사 상태 배지와 같은 컴포넌트 `status / 업무 보고`),
  `완료` 탭 행의 상태 배지 문구(Figma 에 완료 행이 없다 — 아래 TODO-4), 접근성·반응형 절 전체(Figma 근거 프레임 없음).

### 구 디자인 대비 변경 요약

| 영역 | 구(`toyvillage-dev`) | yot |
| --- | --- | --- |
| 탭 | 심사대기·완료·반려·재제출 | **심사대기·완료·반려** (4번째 탭 hidden) |
| 표 컬럼 | 담당자·제목·상태·우선순위·완료기한·공개범위 | **담당자·상태·우선순위·완료기한 + 케밥** |
| 표 `상태` | 업무(task) 상태 pill | **심사 상태 배지**(`status / 업무 보고`) |
| 행 동작 | 행 클릭 → 상세 | 행 클릭 → 상세 **+ 케밥 `승인하기`/`반려하기`** |
| 상세 요약행 | 우선순위·상태(업무)·담당자·완료 기한·공개 범위 | 우선순위·**상태(심사)**·담당자·완료 기한 (공개 범위는 개발자 결정으로 제외) |
| 상세 본문 | 제목 카드 / 내용 카드 / 첨부 카드 분리 | **카드 하나**(제목 칸 · 상세 업무 내용 칸 · 첨부자료) |
| 결과 표시 | 범위 제외(다음 슬라이스) | **성공 토스트(목록) · 실패 토스트(목록·상세)** |

## 목적

운영 관리자가 직원이 제출한 업무보고를 심사 상태(심사대기·완료·반려)별로 훑고, 목록에서 바로 또는
한 건을 열어 제출 내용과 첨부자료를 확인한 뒤 승인하거나 반려하고, 그 결과를 토스트로 확인한다.

## 범위

- 포함: 업무보고 목록(탭 필터·표·페이지네이션·빈 상태), **목록 행 케밥의 승인/반려**, 업무보고 상세 조회
  (요약행·제목·상세 내용·첨부자료 다운로드), 상세의 승인/반려, 반려 사유 모달(목록·상세 공용),
  **승인·반려 성공/실패 토스트(2026-09-13 개발자 결정으로 범위 편입)**, 업무 상세에서 업무보고로의 진입(현재 보류 — 아래),
  사이드바 `업무 보고 바로가기`
- 제외: 실제 API 연동(`/api` 스킬 담당 — 이 슬라이스는 mock 경계), 보고 작성·수정·삭제(직원 앱),
  재제출 상태·재제출 요청 처리(yot 에서 탭이 사라졌다), 공개 범위 표시, 검색·정렬·다중 선택,
  사이드바 자체 동작 계약(`sidebar.spec.md` 담당)

## 라우트와 진입

- `/task-reports` → 업무보고 목록.
- `/task-reports/:id` → 업무보고 상세(심사).
- `/tasks/:id`(업무 상세)의 담당자별 업무보고 줄 → `/task-reports/:reportId`(`task-detail` S6).
  **현재 진입 보류(2026-09-12, 커밋 979228c).** 업무 상세는 실 API(`TASK_QUERY`)의 숫자 `workReportId` 를 주는데
  업무보고 상세는 아직 mock(`r1` 형식 id)을 읽어 항상 `찾을 수 없습니다` 였다. 그래서 줄은 보이되 누를 수 없게 막았다.
  업무보고 API 연동(`/api`) 때 되살린다. 이 퍼블리싱 슬라이스는 보류 상태를 그대로 둔다.
- 사이드바 `업무 보고 바로가기` → `/task-reports` 로 이동하고 사이드바가 닫힌다.
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout`(App.tsx)이 전역 렌더하므로 두 페이지는 본문만 담당한다.

## 화면 구조 — 목록 (Figma 1:3510)

1920px 데스크톱 기준, 본문 폭 1320, 좌측 x300. 페이지 배경 `background`.

1. 타이틀 @300,124 (h122): `업무보고`(60 SemiBold, `text`) + `토이빌리지 업무 보고 관리`(32 Medium, `textGuide`). 등록 버튼 없음.
2. 탭바 @300,278 (h46): `심사대기 n` `완료 n` `반려 n`. 활성 탭 SemiBold `text` + 하단선, 비활성 Medium `textGuide`.
   컴포넌트의 4번째 탭은 `hidden` 이라 구현하지 않는다.
3. 표 @300,354 (w1320, h372 = 헤더 72 + 행 100 × 3): 헤더 배경 `tableHeaderStrong`, 행 `surface`, 행 구분선.
   컬럼(폭): `담당자`(300) `상태`(320) `우선순위`(300) `완료기한`(320) + 헤더 텍스트 없는 케밥 칸(80). 셀 텍스트 좌측 여백 40.
   - `상태` 셀: 심사 상태 배지(h40, `status / 업무 보고`) — `task-detail` 담당자별 보고 줄과 같은 배지.
   - `우선순위` 셀: 배지 42x40(`common / 뱃지 / 우선순위`) — 업무관리 목록과 같은 컴포넌트라 `entities/task` 의 `TaskPriorityBadge` 를 쓴다
     (상 `danger` · 중 `warning` · 하 회색). 구 디자인용 36px 원형 `TaskReportPriorityBadge` 는 삭제한다.
   - 케밥 칸: `⋮` 44x52 (행 안 x18 y24) — 기존 업무관리 목록의 `RowActionMenu` 규격.
4. 케밥 메뉴 (Figma 337:12775, 180x116): `⋮` 바로 아래 오른쪽 정렬. 항목 h48 `승인하기` / `반려하기`(둘 다 기본 글자색, 좌측 여백 20).
5. 페이지네이션 @848,790: 표 아래 가운데. 이전/다음 chevron 28, 번호 32x32, 활성 `accentBg`/`accent`.

## 화면 구조 — 상세 (Figma 1:7503)

본문 폭 1320, 좌측 x300. 페이지 배경 `background`.

0. 뒤로가기 링크 @300,75 (h36): chevron + `뒤로가기`(24 SemiBold, `textGuide`). 기존 `BackLink` 규격. `/task-reports` 로 이동.
1. 요약행 @300,164 (h40, 항목 간격 20): `우선순위:` + 우선순위 배지 42x40 / `상태:` + 심사 상태 pill 80x40 /
   `담당자: {이름}` / `완료 기한: {YYYY-MM-DD}`. 라벨 20 Medium, 값 22 Medium, `text`.
   **Figma 의 `공개 범위: 전체 공개` 는 그리지 않는다(개발자 결정 2026-09-13 — 업무 모델·API 어디에도 없다).**
2. 내용 카드 @300,236 (w1320 h572, `surface`, radius20) — 세 칸이 한 카드 안에 세로로 붙는다:
   - 제목 칸(h140): 라벨 `제목`(x40 y40, 20 Medium) + 읽기 전용 값 상자(x40 y74, 1240x66, 배경 `background`, 값은 좌측 24 여백).
   - 상세 업무 내용 칸(h276): 라벨 `상세 업무 내용 *`(별표 `danger`) + 읽기 전용 값 상자(1240x160 이상, 배경 `background`, 여백 24/20).
     본문은 좌측 정렬·줄바꿈 보존으로 표시한다(Figma 의 가운데 정렬 문구는 입력칸 placeholder 잔재로 본다 — TODO-5).
   - 첨부자료 칸(h156): 라벨 `첨부자료`(24 Medium, `textGuide`) + 파일 chip 172x56(확장자 아이콘 + 파일명 + 다운로드).
     삭제(X) 아이콘은 `hidden`, 업로드 드롭존 없음 → **조회 전용**. 기존 `AttachmentList` 를 카드 안에 그대로 넣는다
     (자체 배경이 카드와 같은 `surface` 라 겹쳐 보이지 않는다). 첨부가 없으면 기존처럼 `첨부된 자료가 없습니다.` 를 보인다.
   두 입력칸 모양은 업무 폼(`task / 업무 폼`)의 `title section` · `body text section` · `add file` 인스턴스와 같은 계열이다.
3. 하단 우측 버튼 @y876 (카드 아래 68): `반려하기`(123x61, 투명 배경 + `danger` 테두리·글자) · `승인하기`(123x61, `text` 배경 + `surface` 글자).

## 화면 구조 — 반려 사유 모달 (Figma 347:12834 · 1:7635)

목록·상세 어느 쪽에서 열어도 같은 모달이다. 기존 `RejectReasonDialog` 규격을 그대로 쓴다.

1. 오버레이(`#000000` 50%) 위 가운데 모달: w560, radius20, `surface`, padding40, gap20 (Figma h432).
2. 제목 `반려 사유를 작성해주세요`(28 SemiBold, 가운데). 3. 사유 입력 480x206, radius12, 배경 `background`, placeholder `반려 사유 작성`.
4. `확인` 480x73, radius12, `text` 배경. 취소·닫기(X) 없음.

## 화면 구조 — 결과 토스트 (Figma 311:12781)

기존 `shared/ui/Toast` 와 같은 위치(@1432,32)·크기(440x80)다. 아이콘 성공 초록 체크 / 실패 빨강 `!`.

| 결과 | 문구 | 표시 화면 |
| --- | --- | --- |
| 승인 성공 | `승인에 성공했습니다` | 목록 |
| 반려 성공 | `반려에 성공했습니다` | 목록 |
| 승인 실패 | `승인에 실패했습니다` | 요청한 화면(목록 또는 상세) |
| 반려 실패 | `반려에 실패했습니다` | 요청한 화면(목록 또는 상세) |

## 동작 (source of truth)

### 목록

- `/task-reports` 진입 → 업무보고 목록을 조회한다. 로딩 중 `업무보고를 불러오는 중입니다.`, 실패하면 오류 안내.
- 기본 활성 탭은 `심사대기` 이고, 그 심사 상태의 보고만 표시한다.
- 탭 라벨은 `{상태명} {건수}` 형태로, 건수는 조회 결과에서 파생한다. 탭은 `심사대기` `완료` `반려` 셋이다.
- 탭 클릭 → 해당 심사 상태로 필터하고 1페이지로 되돌린다.
- 한 페이지에 3건. 결과가 3건을 넘으면 페이지네이션을 보인다.
- 표의 `상태` 칸은 그 보고의 **심사 상태** 배지다.
- 행 클릭/Enter → `/task-reports/:id` 로 이동한다.
- 행의 `⋮` 클릭 → 그 행의 메뉴(`승인하기` / `반려하기`)를 연다. 이 클릭은 행 이동을 일으키지 않는다.
  메뉴는 한 번에 하나만 열리고, 바깥 클릭·Esc 로 닫힌다(기존 `RowActionMenu` 규칙).
- 케밥은 탭과 관계없이 모든 행에 있다(상세가 이미 완료·반려된 보고에도 두 버튼을 보이는 것과 같은 규칙 — TODO-6).
- 메뉴 `승인하기` → 확인 절차 없이 그 보고를 승인 처리한다(Figma 에 확인 모달 없음).
  - 성공: 목록에 머물고 `승인에 성공했습니다` 토스트를 보인다. 목록을 다시 조회해 그 보고는 `완료` 탭으로 옮겨간다.
  - 실패: 목록에 머물고 `승인에 실패했습니다` 토스트를 보인다. 보고는 원래 탭에 남는다.
- 메뉴 `반려하기` → 반려 요청 없이 **반려 사유 모달**을 연다.
  - `확인` → 사유와 함께 반려 처리. 성공하면 모달을 닫고 `반려에 성공했습니다` 토스트, 그 보고는 `반려` 탭으로 옮겨간다.
  - 실패하면 모달을 닫고 `반려에 실패했습니다` 토스트(Figma `347:12882` 는 모달 없이 토스트만 보인다). 보고는 원래 탭에 남는다.
  - Esc·오버레이 클릭 → 모달을 닫고 반려하지 않는다. 초점은 그 행의 `⋮` 로 돌아간다.
- 처리 결과로 현재 페이지가 비면 마지막 페이지로 당긴다(기존 `Math.min(page, pageCount)` 규칙).
- 승인·반려 요청은 한 번에 하나만 처리한다. 처리 중에는 어느 행의 케밥 메뉴도 열리지 않고 모달 `확인` 은 비활성이다
  (규칙은 아래 모달 절과 같다 — 2026-09-13 코드 리뷰 반영: 다른 행의 결과가 열린 모달을 닫거나 두 번째 요청이 조용히 버려지는 것을 막는다).
- 표시할 행이 없으면 `등록된 업무보고가 없습니다.` 를 보이고 페이지네이션을 감춘다.
- 상세에서 승인·반려에 성공하고 돌아온 경우에도 해당 성공 토스트를 목록에서 보인다(아래 상세 절).

### 상세

- `/task-reports/:id` 진입 → `:id` 로 보고 단건을 조회한다. 로딩 중 안내, 없으면 `업무보고를 찾을 수 없습니다.` + 목록 링크.
- 조회한 보고의 우선순위·심사 상태·담당자·완료 기한을 요약행에, 제목·상세 내용·첨부자료를 내용 카드에 렌더한다.
- 첨부자료는 파일명과 확장자 아이콘으로 표시하고, 다운로드 아이콘 클릭 시 해당 파일을 내려받는다. 삭제·추가 수단은 없다.
- `뒤로가기` → 아무 것도 처리하지 않고 `/task-reports` 로 이동한다. 이탈 확인 없음.
- `승인하기` → 보고를 승인 처리한다.
  - 성공: `/task-reports` 로 이동하고 목록이 `승인에 성공했습니다` 토스트를 보인다.
  - 실패: 상세에 머물고 `승인에 실패했습니다` 토스트를 보인다. 두 버튼을 다시 누를 수 있게 되돌린다.
- `반려하기` → 반려 요청 없이 반려 사유 모달을 연다.
  - `확인` 성공: `/task-reports` 로 이동하고 목록이 `반려에 성공했습니다` 토스트를 보인다.
  - `확인` 실패: 모달을 닫고 상세에 머물며 `반려에 실패했습니다` 토스트를 보인다(Figma `1:7527`). 버튼을 다시 누를 수 있다.
- 처리 중에는 두 버튼을 비활성화해 중복 제출을 막는다.
- 이미 완료·반려된 보고에서도 두 버튼은 그대로 보인다(Figma 상세는 상태 `반려` 인 상태로 두 버튼을 함께 보여준다).

### 반려 사유 모달 (목록·상세 공통)

- 반려 사유는 필수다. 비어 있거나 공백뿐이면 `확인` 을 비활성으로 둔다(개발자 결정 2026-08-21).
- Esc 또는 오버레이 클릭으로 닫는다. 닫으면 반려 처리는 일어나지 않는다.
- 열려 있는 동안 초점은 모달 안에 가두고, 닫으면 모달을 연 컨트롤(상세 `반려하기` / 목록 그 행의 `⋮`)로 돌아간다.
- 반려 처리 중에는 `확인` 을 비활성화해 중복 제출을 막고, 초점은 사유 입력란으로 되돌려 모달 안에 남긴다
  (입력란은 `disabled` 대신 `readonly` — 개발자 결정 2026-08-23).

## 데이터와 API 경계 (mock)

- 서버 상태는 TanStack Query 로만 다룬다. Query Key: `['task-reports']`, `['task-reports', id]`.
  승인·반려 성공 시 `['task-reports']` prefix 를 무효화한다.
- 실제 API 는 연결하지 않는다. `src/entities/task-report/model/mock.ts` 가 교체 경계다(localStorage).
- mock 데이터는 Figma 1페이지 행(이승현·김수인·이지아 / 심사대기 / 상·하·중 / 2026-07-03·07-01·07-28)을 재현하고,
  페이지네이션(1·2·3)이 보이도록 `심사대기` 7건, `완료` 3건, `반려` 2건을 둔다. `재제출` 데이터는 없앤다.
- 반려 사유는 `toyvillage:task-reports:reject-reasons`(id → 사유)에 보관한다. 실제 API 로 교체할 때 요청 body 로 옮긴다.
- 테스트 제어점(실제 API 로 교체할 때 함께 제거):
  - 처리 지연 `toyvillage:task-reports:mutation-delay`, 요청 로그 `toyvillage:task-reports:mutation-log` (기존)
  - **실패 주입 `toyvillage:task-reports:fail`** — 값 `approve` | `reject` 를 넣으면 해당 요청이 한 번 실패한다
    (기존 `toyvillage:resources:fail` 과 같은 규약).

## 컴포넌트 구조/props

- `entities/task-report/model/types.ts`
  - `taskReportReviewStatuses = ['PENDING','APPROVED','REJECTED']` — `RESUBMITTED` 제거
  - `TaskReport { id, taskId?, assigneeId, assigneeName, title, content, reviewStatus, priority, dueDate, attachments? }`
    — 표시 위치가 사라진 `taskStatus` · `visibility` 제거
  - `TaskReportListItem` — 표 렌더용 파생 타입(`id, assigneeName, reviewStatus, priority, dueDate`)
- `entities/task-report/model/labels.ts` — 탭 라벨 `심사대기 / 완료 / 반려`
- `entities/task-report/ui/TaskReportReviewBadge.tsx` (**신규 — `TaskReportSummaryCard` 안의 배지를 추출**) —
  심사 상태 배지. 업무 상세 보고 줄·목록 `상태` 칸·상세 요약행이 함께 쓴다. props: `status`.
- `entities/task-report/ui/TaskReportTable.tsx` — `shared/ui/DataTable`. 컬럼 4개 + 케밥 칸. 케밥 칸 내용은 페이지가
  render prop 으로 넘긴다(업무관리 `TaskTable` 의 `actions` 칸과 같은 방식).
- `entities/task-report/ui/TaskReportMetaRow.tsx` — props `priority, reviewStatus, assigneeName, dueDate` (`taskStatus`·`visibility` 제거)
- `entities/task-report/ui/TaskReportContentCard.tsx` (**신규**) — 내용 카드(제목 칸·상세 업무 내용 칸·첨부자료 칸). props `title, content, attachments`.
- `features/review-task-report/`
  - `model/useReviewTaskReport.ts` (**신규**) — 승인/반려 mutation · 처리 중 상태 · 성공 시 목록 무효화. 목록과 상세가 공유한다.
  - `ui/TaskReportReviewActions.tsx` — 상세 `반려하기`/`승인하기` 버튼. 성공 시 토스트 키를 들고 목록으로 이동, 실패 시 토스트.
  - `ui/RejectReasonDialog.tsx` — 기존 그대로(props `pending`, `onCancel`, `onConfirm(reason)`).
- `features/row-actions/ui/RowActionMenu.tsx` — 기존 그대로 재사용(항목 `승인하기`/`반려하기`).
- `entities/task/ui/TaskPriorityBadge.tsx` — 기존 그대로 재사용(업무보고 전용 `TaskReportPriorityBadge` 삭제).
- `shared/ui/Toast.tsx` · `shared/ui/AttachmentList.tsx` · `shared/ui/BackLink.tsx` · `shared/ui/CategoryTabs.tsx` — 기존 재사용.
- `pages/task-reports/TaskReportListPage.tsx`, `pages/task-reports/TaskReportDetailPage.tsx`

## 토큰

신규 색·폰트 토큰 없음. `get_metadata` 는 색 값을 주지 않으므로 색은 스크린샷 관찰과 기존 컴포넌트
(`TaskReportSummaryCard` 배지, `TaskPriorityBadge`, `Toast`, `RejectReasonDialog`)의 토큰을 따른다.

## 미결 사항

- [ ] **게이트 ② 재승인** — 시나리오 초안 `harness/artifacts/publishing/task-report.scenario-draft.md`.
- [ ] **TODO-4 `완료` 탭 배지 문구** — 탭은 `완료` 인데 공유 배지 컴포넌트(`status / 업무 보고`)의 승인 변형은 `승인`(`task-detail` 152:11510)이다.
      Figma 목록에 완료 행이 없어 기본안은 배지 문구 `승인`(컴포넌트 그대로), 탭 라벨 `완료` 유지.
- [ ] **TODO-5 상세 본문 정렬** — Figma 상세 업무 내용 문구가 가운데 정렬로 그려져 있다. 기본안은 좌측 정렬(업무 상세·폼과 동일).
- [ ] **TODO-6 완료·반려 탭의 케밥** — Figma 는 심사대기 행에만 케밥을 그렸다. 기본안은 모든 탭에 동일 표시.

## 비고 / 제약 (게이트 결정 사항)

- **결과 표시 편입(2026-09-13):** 이전 슬라이스에서 이월했던 성공/실패 결과 표시를 이번에 구현한다. 실패는 토스트로 통일.
- **공개 범위 제외(2026-09-13):** 목록 컬럼과 상세 요약행 모두 그리지 않는다.
- **재제출 제거:** yot 탭바의 4번째 탭이 `hidden` 이고 서버 보고 상태(`TASK_QUERY` reports)에도 재제출이 없다.
- **이전 TODO-3(상태 컬럼 의미) 해결:** yot 목록 `상태` 칸이 `심사대기` 배지로 그려져 심사 상태로 확정됐다.
- 반응형은 기존 페이지들과 같은 기준(980px 이하에서 카드/버튼 줄바꿈)을 따른다.
