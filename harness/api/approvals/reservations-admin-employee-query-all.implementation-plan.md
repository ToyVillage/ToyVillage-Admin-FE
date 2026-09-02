# Implementation Plan — RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL

## 목표

상세 편집 폼 권한 섹션의 mock 직원 목록을 `GET /reservation/assigned-employee/{reservationId}` 실 API로 교체. 이 API는 **후보 풀 + 초기 배정 상태**를 제공한다. 배정 추가/취소는 **별도 API 없이 로컬 `assignedIds` 상태**로만 관리하고, **저장(생성/수정) 시 배정됨 id 목록을 create/update 요청 바디에 한 번에 전송**한다(현재 update/create는 mock).

## 변경/추가 파일

1. **신규** `src/entities/reservation/api/getReservationEmployees.ts`
   - `getReservationEmployees({ reservationId }): Promise<{ assigned: Staff[]; assignable: Staff[] }>`
   - `api.get('/reservation/assigned-employee/${reservationId}')`(쿼리 파라미터 없음) → 런타임 가드 → 매핑(`appAdminId`→`String`, `name`, role 생략). 이름 검색은 프론트에서 필터.
   - id 유효성: `Number.isSafeInteger(reservationId) && > 0` 아니면 throw.
   - `ReservationEmployeeQueryRequest` 타입 정의.

2. **수정** `src/entities/reservation/index.ts` — `getReservationEmployees` + 타입 export.

3. **수정** `src/pages/notices/reservations/ReservationDetailPage.tsx`
   - `usePermissionAssignment(mockAssignableStaff, ['a1','a2'])` 제거.
   - 권한 검색 상태 `permissionQuery`(프론트 필터, 서버 전송 없음).
   - `useQuery({ queryKey:['reservations', id, 'employees'], queryFn:() => getReservationEmployees({ reservationId:Number(id) }), enabled:Boolean(id) })`.
   - 배정 상태 배선(서버 응답 = 후보 풀 + 초기 배정):
     - 로컬 `assignedIds` 상태를 **첫 성공 응답의 `assigned` id로 1회 시드**.
     - 후보 풀 = 응답 `assigned + assignable`(전원 반환). `assigned = 풀 ∩ assignedIds`, `available = 풀 − assignedIds`. 이름 검색은 이 풀을 프론트에서 필터.
     - `onAdd`/`onCancel` = 로컬 `assignedIds` 변경만(별도 API 없음).
     - `query = permissionQuery`, `onQueryChange = setPermissionQuery`(프론트 필터).
   - **저장 연동**: 기존 `updateReservationMock(id, value, assignedIds)`가 이미 배정 id를 받으므로 `permission.assignedIds`를 그대로 전달(생성도 동일). 실제 persist는 update/create 실 API 연동 시.
   - 로딩 중 빈 목록 유지(no-invented-ui). 조회 실패는 빈 목록 + (상세 404는 기존 NotFound가 우선).

## 캐시

- Query Key `['reservations', id, 'employees']` — 상세(`['reservations', id]`)와 분리, 진입 시 병렬.

## 범위 밖

- 생성 페이지(reservationId 없음 → 이 조회 대상 아님).
- update/create 실 API(배정 id 전송의 실제 persist)는 별도 슬라이스.

## 검증

- `harness:api:policy`, lint, typecheck, build (⑩)
- Mock Playwright `yarn verify:api reservations-admin-employee-query-all` (⑪)
- 실서버: `real_server.enabled=false` → 미실행.
