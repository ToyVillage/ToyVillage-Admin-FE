# Implementation Plan — RESERVATION_ADMIN_QUERY_ALL

## 목표

리스트 페이지의 `getMockReservations`(클라이언트 필터/정렬/검색/페이지네이션)를 `GET /reservation` ADMIN 서버 조회로 교체한다. 상태 카운트·필터·정렬·검색·페이지네이션을 서버 파라미터로 이관한다.

## 변경/추가 파일

1. **신규** `src/entities/reservation/api/types.ts`
   - `ReservationAdminQueryAllRequest { status?: ReservationStatusCode; title?: string; sort?: ReservationSortCode; page?: number; size?: number }`
   - `ReservationStatusCode = 'BEFORE_SITE_VISIT' | 'SITE_VISIT_COMPLETED' | 'VISIT_COMPLETED'`
   - `ReservationSortCode = 'COUNSEL_DATE' | 'RESERVATION_DATE'`
   - `ReservationAdminQueryAllResponse`(상태 카운트 3개 + `reservationAdminQueryListObjectResponse` = Spring Page). request/response 타입 분리, optional/nullable 구분.
   - `ReservationAdminListResult { counts: Record<ReservationStatus, number>; reservations: Reservation[]; totalPages: number }` (페이지가 쓰기 좋은 매핑 결과 형태).

2. **신규** `src/entities/reservation/api/reservationApi.ts`
   - `getAdminReservations(params): Promise<ReservationAdminListResult>`
   - `api.get<unknown>('/reservation', { params })` → 런타임 검증(`unknown` 가드) → Contract 필드만 사용해 매핑.
   - 매핑: content→`Reservation`(날짜 `yyyy-MM-dd`→`yyyy.MM.dd`, 시간 `HH:mm:ss`→`HH : mm`, id→String, status 라벨→`ReservationStatus`), counts←beforeVisitSite/doneVisitSite/doneVisit, totalPages←totalPages.
   - Contract에 없는 필드 사용 금지. 오류는 throw(빈 배열로 숨기지 않음).

3. **수정** `src/entities/reservation/index.ts`
   - `getAdminReservations`, 신규 타입 export 추가. (mock export는 상세/권한 등 다른 슬라이스가 아직 사용하므로 유지.)

4. **수정** `src/pages/notices/reservations/NoticeReservationsPage.tsx`
   - `useQuery({ queryKey:['reservations','list',{status,title,sort,page}], queryFn: () => getAdminReservations(...) })`.
   - UI 상태 → 파라미터 매핑(active→status, query→title, sort→sort, page(1-based)→page-1).
   - `counts`는 API 응답의 `data.counts` 사용(클라이언트 reduce 제거).
   - `pageCount`는 `data.totalPages` 사용, 목록은 `data.reservations` 그대로 표시(클라이언트 slice/filter/sort 제거).
   - 상태·검색·정렬 변경 시 첫 페이지 복귀 로직 유지.
   - 검색어는 디바운스 후 `title` 반영(기존 관례).
   - `size=10` 전송(개발자 결정). UI도 한 페이지 **10건** 노출로 맞춘다(기존 `PAGE_SIZE=4` → 10). 표시 건수는 서버 응답(`data.reservations`) 그대로 사용.

## 상태 매핑 상수 (api 슬라이스 내부)

- code↔UI: `pending↔BEFORE_SITE_VISIT`, `approved↔SITE_VISIT_COMPLETED`, `rejected↔VISIT_COMPLETED`
- 라벨→UI: `'사전답사 전'→pending`, `'사전답사 완료'→approved`, `'방문 완료'→rejected`

## 캐시/무효화

- Query Key: `['reservations','list',{...params}]`. 향후 mutation 무효화는 `['reservations','list']` prefix로 목록만 무효화(상세 404 회피 관례).

## 범위 밖(이번 슬라이스 제외)

- 상세 조회/권한/생성/수정 등 다른 API. mock 관련 함수는 그대로 둔다.
- Figma에 없는 로딩/에러 전용 화면 신설 금지. 조회 실패 시 목록은 빈 상태로 두되 오류를 숨기지 않는다(사용자 알림 방식은 기존 패턴 범위 내).

## 검증

- `harness:api:policy`, lint, typecheck, build (⑩)
- Mock 기반 Playwright 시나리오 `yarn verify:api reservations-admin-query-all` (⑪)
- 실제 서버 테스트: `real_server.enabled=false` → 미실행.
