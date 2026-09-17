---
feature: dashboard
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1385:15048
requires_functional_test: true
paths: src/pages/dashboard, src/features/dashboard
---

# 대시보드 행동명세

## 상태와 근거

- Status: Approved (yunho09, S1–S12, 2026-09-17) · ③~⑤ 완료 · e2e freeze 20/20. ⑦ 육안 확인 대기.
- 기준 파일 `yot`(`P7Jhnu8qV5m9q2QJNzkwAN`), 프레임 `dashboard`(`1385:15048`).
- 추출 캐시: `harness/artifacts/publishing/dashboard.figma.txt`(get_design_context 요약 — 원본 응답이 잘려 요약본으로 저장).

## 목적

운영 관리자가 로그인 직후 이번 주 운영 현황(먹이 급여·개체·업무보고·업무일지 건수, 휴관일, 업무 진행 상태, 최근 기록)을
한 화면에서 훑고, 필요한 관리 화면으로 바로 이동한다.

## 범위

- 포함: `/` 대시보드 화면 전체(타이틀·이번주 chip·KPI 카드 4·휴관일 관리·전체 업무·최근 목록 카드 4), 카드 클릭 이동.
- 제외: 실제 API 연동(`/api` 스킬 담당 — 대시보드 API 명세 확인 후), 대시보드 안에서의 편집·필터·기간 변경,
  미니 달력 월 이동(Figma 에 이전/다음 버튼 없음), 사이드바 동작(`sidebar.spec.md` 담당).

## 라우트와 진입

- `/` → 대시보드. 기존 임시 `HomePage`(`ToyVillage` 문구)를 대체한다.
- 사이드바 `대시보드`(to `/`)로 진입한다. 좌상단 메뉴·사이드바는 `AppLayout` 이 전역 렌더하므로 페이지는 본문만 담당한다.

## 화면 구조 (Figma 1385:15048)

1920px 데스크톱 기준, 본문 폭 1320, 좌측 x300, 페이지 배경 `background`. 카드 사이 간격 20.

1. 헤더 @y96: `대시보드`(60 SemiBold, `textStrong`) + 우측 `이번주 · YYYY.MM.DD ~ MM.DD` chip
   (`accentBg` 배경, `accent` 글자 SemiBold 20, calendar 아이콘 22, radius 100, padding 12/24).
2. KPI 카드 4개 @y216 (각 315x150, `surface`, radius 20, padding 28/32): 숫자(48 SemiBold `textStrong`) + 라벨(20 SemiBold `textGuide`) + 우상단 아이콘 36.
   순서: `먹이 급여 기록` · `개체 관리` · `업무보고` · `작성된 일지`.
3. 2행 @y386 (h420): `휴관일 관리` 카드(w860) + `전체 업무` 카드(w440).
4. 3행 @y826 (h272): `먹이 급여 관리` 카드 + `개체관리` 카드(각 w650).
5. 4행 @y1118 (h272): `업무보고` 카드 + `업무일지관리` 카드(각 w650).

### 섹션 카드 공통

- `surface`, radius 20, padding 28/32/16. 제목줄 = 아이콘 28 + 제목(24 SemiBold `textStrong`), 아래 1px `pageMuted` 선.
- 우상단 `자세히 보기`(16 Medium `textGuide`) + 오른쪽 chevron 20.
- 목록 카드 행: h60, 좌측 주 텍스트(20 Medium `textStrong`) · 우측 보조 값(18 Medium `textGuide`), 행 사이 1px `tableHeaderStrong` 선. 최대 3행.

### 휴관일 관리

- 좌측 미니 달력(w406): `YYYY년 MM월` 헤더(20 Medium) · 요일(일~토, 15 Medium `textGuide`) · 날짜 칸 54x40 radius10 16 Medium.
  - 일요일 `danger`, 이번 달 외 날짜 흐리게(`textGuide` 앞달 / `textFaint` 다음달 — Figma 그대로), 휴관일 칸 배경 `#FFECEC` + `danger` 글자.
  - 연속 휴관일은 가로로 이어진 한 덩어리로 그린다(양 끝만 둥글게, 사이 4px 다리).
- 우측 휴관일 목록(pt40): 행 h76 = 빨간 세로 막대 4x40 + 날짜(20 SemiBold `textStrong`) / 사유(16 Medium `textGuide`). 최대 3행.
  - 날짜 형식: 하루 `M월 D일`, 기간 `M월 D일 ~ M월 D일`.

### 전체 업무

- 도넛 168(두께 30): 12시 방향부터 시계방향으로 완료(`accent`) → 진행중(`pageMuted`) → 지연(`warning`) 비율. 가운데 합계(36 SemiBold).
- 범례 행 h56: 업무 상태 pill(`TaskStatusBadge`) + 건수(22 SemiBold, 완료 `accent`·진행중 `textGuide`·지연 `warning`).

### 업무보고 카드

- 행 = 보고 제목 + 심사 상태 배지(`TaskReportReviewBadge`). 배지 문구는 기존 결정대로 `심사대기`/`완료`/`반려`(Figma 는 `승인`).

## 동작 (source of truth)

- `/` 진입 → 대시보드 데이터를 조회한다. 로딩 중 `대시보드를 불러오는 중입니다.`, 실패하면 `대시보드를 불러오지 못했습니다.`
- 이번주 chip 은 **오늘이 속한 주(일요일~토요일)** 범위를 `이번주 · YYYY.MM.DD ~ MM.DD` 로 표시한다.
- KPI 카드 클릭/Enter → 해당 관리 화면으로 이동: 먹이 급여 `/feeds` · 개체 관리 `/species` · 업무보고 `/task-reports` · 작성된 일지 `/work-logs`.
- 섹션 카드 클릭/Enter(`자세히 보기` 포함 카드 전체) → 이동:
  휴관일 관리 `/notices/guide` · 전체 업무 `/tasks` · 먹이 급여 관리 `/feeds` · 개체관리 `/species` · 업무보고 `/task-reports` · 업무일지관리 `/work-logs`.
- 미니 달력은 **이번 달**을 보여 주고, 이번 달에 걸친 휴관일을 표시한다. 달력은 조회 전용이다(날짜 클릭 동작 없음).
- 휴관일 목록은 이번 달 휴관일을 시작일 순으로 최대 3건 보인다. 없으면 `이번 달 휴관일이 없습니다.`
- 전체 업무: 상태별 건수와 합계를 보인다. 합계가 0이면 도넛은 빈 회색 고리, 가운데 `0`.
- 목록 카드(먹이 급여·개체관리·업무보고·업무일지)는 최근 3건을 보이고, 없으면 카드별 빈 문구
  (`최근 먹이 급여 기록이 없습니다.` / `최근 관찰 기록이 없습니다.` / `최근 업무보고가 없습니다.` / `최근 업무일지가 없습니다.`).
- 긴 텍스트는 한 줄 말줄임(…) 처리해 우측 값·배지를 밀어내지 않는다.

## 데이터와 API 경계

- 서버 상태는 TanStack Query. Query Key `['dashboard']`.
- 퍼블리싱 단계에서는 `features/dashboard/api` 경계에서 mock 을 반환한다(Figma 값 그대로). 실제 API 교체는 `/api` 스킬.
- e2e 는 page.route mock 또는 mock 제어 키로 로딩·실패·빈 상태를 만든다(기존 규약 따름).

## 컴포넌트 구조/props

- `features/dashboard/model/types.ts` — `DashboardSummary { kpi, closeSchedules, taskStatusCounts, feeds, observations, taskReports, workLogs }`
- `features/dashboard/api/*` — `getDashboardSummary()`(mock) · `useDashboardSummary()`
- `features/dashboard/ui/DashboardKpiCard.tsx` — `label, value, icon, to`
- `features/dashboard/ui/DashboardSectionCard.tsx` — `title, icon, to, children` (제목줄·`자세히 보기`·카드 링크)
- `features/dashboard/ui/DashboardListRows.tsx` — `rows: { key, primary, secondary: ReactNode }[]`, `emptyText`
- `features/dashboard/ui/HolidayMiniCalendar.tsx` — `month, schedules`
- `features/dashboard/ui/TaskStatusDonut.tsx` — `counts`
- `pages/dashboard/DashboardPage.tsx`
- 재사용: `entities/task` `TaskStatusBadge`, `entities/task-report` `TaskReportReviewBadge`.

## 토큰

- 신규 1: `dangerSoftBg` `#FFECEC`(휴관일 칸 배경). 나머지 색은 기존 토큰과 일치.

## 미결 사항

- [x] TODO-1 미니 달력 월: Figma 는 `2026년 07월` 인데 이번주 chip 은 08.30~09.05 다. **개발자 결정 2026-09-17: 휴관일 카드는 이번 주가 아니라 이번 달 한 달을 보여 준다**(달력·목록 모두 이번 달 기준).
- [ ] TODO-2 이번주 기준: 기본안 = 일요일 시작(Figma 08.30 은 일요일).
- [ ] TODO-3 KPI 숫자 의미(이번 주 건수 / 오늘 / 누적): 기본안 = 이번 주 건수. API 명세로 확정.
- [ ] TODO-4 개체관리 카드의 우측 값이 `3시간 전` 과 `2026.09.02` 로 섞여 있다. 기본안 = 24시간 이내 `N시간 전`, 그 외 `YYYY.MM.DD`.
- [ ] TODO-5 카드 행 개별 클릭(상세 이동)은 Figma 근거가 없어 넣지 않는다 — 카드 전체가 목록으로 이동.

## 비고 / 제약

- 반응형: 1920 기준. 1320 미만에서는 카드 행을 한 열로 쌓는다(기존 페이지 규칙과 동일한 기준 적용).
