# Implementation Plan — dashboard (DASHBOARD_COUNT_QUERY · DASHBOARD_OVERALL_OPERATIONS_QUERY · DASHBOARD_FEED_LOG_QUERY_ALL · DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL)

네 dashboard spec이 공유하는 계획이다. 모두 승인된 뒤 한 번에 구현한다.

## 범위

대시보드 mock(`getDashboardSummary`)을 제거하고 dashboard API 4개 + 기존 조회 API 3개(휴관일·업무보고·업무일지)로 화면을 채운다.

## 1. 응답 타입 — `src/features/dashboard/api/types.ts` (신규)

```ts
export interface DashboardCountQueryResponse { feedLogCount: number; animalCount: number; workReportCount: number; workLogCount: number }
export interface DashboardOverallOperationsQueryResponse { TOTAL: number; IN_PROGRESS: number; COMPLETED: number; EXPIRED: number }
export interface DashboardFeedLogItem { feedLogId: number; animalKind: string; animalName: string; feedDateTime: string }
export interface DashboardAnimalObservationItem { animalObservationId: number; animalId: number; title: string; createdAt: string }
export interface DashboardPageRequest { page: number; size: number }  // page 1부터
export interface DashboardPageResponse<T> { content: T[]; totalPages: number; totalElements: number; size: number; number: number; numberOfElements: number; first: boolean; last: boolean; empty: boolean }
```

- 응답 `pageable`·`sort` 객체는 쓰지 않으므로 타입에 넣지 않는다.

## 2. 호출 함수 — `src/features/dashboard/api/dashboardApi.ts` (mock 전면 교체)

```ts
export async function getDashboardCounts(): Promise<DashboardKpi>                         // DASHBOARD_COUNT_QUERY
export async function getDashboardTaskStatusCounts(): Promise<DashboardTaskStatusCounts>  // DASHBOARD_OVERALL_OPERATIONS_QUERY
export async function getDashboardFeeds(req: DashboardPageRequest): Promise<DashboardFeed[]>               // DASHBOARD_FEED_LOG_QUERY_ALL
export async function getDashboardObservations(req: DashboardPageRequest): Promise<DashboardObservation[]> // DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL
```

- `api.get<unknown>(path, { params: { page, size } })` — `sort` 미전송(서버 기본 최신순). `page` 1 미만·`size` 0 이하는 호출 전 throw.
- 런타임 가드: 숫자 필드 0 이상 safe integer, id 필드(`feedLogId`·`animalObservationId`·`animalId`) 양의 safe integer, 문자열 필드 string, Page는 `content` 배열 + 페이지 숫자/불리언 필드. 불일치 시 throw.
- 매핑
  - count → `{ feeds: feedLogCount, individuals: animalCount, taskReports: workReportCount, workLogs: workLogCount }`
  - overall → `{ COMPLETED, IN_PROGRESS, EXPIRED }` (`TOTAL`은 가드만)
  - feed → `{ id: String(feedLogId), species: animalKind, animalName, fedAt: feedDateTime }`
  - observation → `{ id: String(animalObservationId), individualId: String(animalId), content: title, recordedAt: createdAt }`
- 제거: `mockDashboardSummary`, `getDashboardSummary`, localStorage 제어 키 3개.

## 3. 뷰 모델·key — `src/features/dashboard/model`

- `types.ts`: `DashboardSummary`·`DashboardTaskReport`·`DashboardWorkLog` 제거(재사용 엔티티 타입 사용). `DashboardObservation`에 `individualId` 추가. 나머지 섹션 타입 유지.
- `queryKeys.ts`: `counts`, `taskStatus`, `feeds`, `observations`, `closeSchedules`, `taskReports`, `workLogs(date)` — 모두 `['dashboard', …]` prefix.
- `index.ts` export 갱신.

## 4. 재사용 엔티티 최소 변경 — `src/entities/task-report`

- `TaskReportQueryAllRequest.status` optional. `undefined`면 axios가 쿼리에서 생략(업무보고 목록 화면은 항상 보내므로 동작 불변).
- `TaskReportListItem`에 `'title'` 추가, 매핑 `title: report.title`. 목록 표 표시 변화 없음.

## 5. 화면 — `src/pages/dashboard/DashboardPage.tsx`

- `useQuery` 7개, `LIST_LIMIT = 3`
  - feeds/observations: `{ page: 1, size: 3 }`
  - task reports: `getTaskReports({ page: 1, size: 3 })`
  - work logs: `getWorkLogs({ date: toIsoDay(now), page: 0, size: 3 })`
  - close schedules: `getCloseSchedules()`
- 하나라도 `isPending` → 로딩 문구, 하나라도 `isError` → 오류 문구(퍼블리싱 문구·마크업 유지).
- 레이아웃·카드 링크 유지. 업무보고 행 `primary: report.title` + 상태 배지, 업무일지 행 `formName` / `authorName`.
- 행 상세 이동: `DashboardListRow`에 선택 `to`, `HolidayList`에 선택 `getScheduleHref`를 추가해 행을 `Link`로 렌더한다.
  행 링크는 `position: relative; z-index: 1`로 카드 전체 링크(`::after`) 위에 둔다.
  - 휴관일 `/notices/guide/{id}`, 업무보고 `/task-reports/{id}`, 업무일지 `/work-logs/{id}`
  - 먹이 급여 `/feeds/{feedLogId}`, 관찰 `/individuals/{animalId}/observations/{animalObservationId}`

## 5-1. 종 ID 없는 관찰 경로 — `src/pages/species/ObservationRedirectPage.tsx` (신규)

- `src/app/App.tsx`에 `{ path: '/individuals/:individualId/observations/:observationId', element: <ObservationRedirectPage /> }` 추가, `src/pages/species/index.ts` export.
- `individualId`·`observationId`가 양의 정수가 아니면 요청하지 않고 `PageStatus state="not-found"`(`관찰 기록을 찾을 수 없습니다.`, 링크 `/species` `종 목록으로 돌아가기`).
- `useQuery({ queryKey: individualQueryKeys.detail(individualId), queryFn: () => getIndividual({ animalManageId }) })` — 관찰 상세 화면과 같은 key라 이동 후 재요청하지 않는다.
  - pending → `PageStatus state="loading"` `관찰 기록을 불러오는 중입니다.`
  - 404(`isNotFoundError`) → not-found 상태, 그 외 오류 → `PageStatus state="error"` `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`
  - 성공 → `<Navigate replace to={`/species/${individual.speciesId}/individuals/${individualId}/observations/${observationId}`} />`
- 관찰 존재 여부·개체-관찰 조합 검증은 이동한 관찰 상세 화면이 기존대로 맡는다.

## 6. 테스트

- `tests/e2e/support/dashboard-api.ts`(신규): 7개 route 기본 응답 + 개별 덮어쓰기. 급여·관찰 mock 항목에 id 추가.
- `tests/e2e/api/{dashboard-count-query,dashboard-overall-operations-query,dashboard-feed-log-query-all,dashboard-animal-observation-query-all}.spec.ts`
- `tests/e2e/dashboard.spec.ts`: localStorage seed → route mock 전환. S1–S12 기대값 유지(S9 로딩=route 지연, S10 실패=500).

## 7. 검증

- `yarn harness:api:policy <feature> <changed src files>` (4개)
- `yarn lint && yarn typecheck && yarn build`
- `yarn verify:api <feature>` (4개)
- 회귀: `tests/e2e/dashboard.spec.ts`, `tests/e2e/api/animal-observation-query.spec.ts`, `tests/e2e/api/app-work-report-query-all.spec.ts`, `work-log-query-all.spec.ts`, `close-dat-query-all.spec.ts`

## 8. 잔여 위험

- 한 API만 실패해도 대시보드 전체가 오류 상태(퍼블리싱 동작 유지).
- 진입 시 요청 7건.
- 업무보고·업무일지 카드는 주간이 아니라 최신 3건·오늘 기준(재사용 API 한계).
