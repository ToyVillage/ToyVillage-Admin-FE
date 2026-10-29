# API Test Scenarios — app-fifth-floor-feed-log-delete-admin

공통 사전 조건: `support/feed-api`의 `mockFeedApi`가 5층 가짜 서버를 함께 띄운다. 5층 기본 데이터는 퍼블리싱 mock과 같다 —
오늘 12건(급여일지 id 1–12, 10번 = 오스카 · 오돌이, 개체 id 10, 펠렛 15 GML, 박도현) + 오돌이 어제 1건(id 101, 이서준).
나머지 개체 id는 500번대. 개체 조회는 `support/animal-manage-api`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`.

## Mock S1 — 목록에서 삭제

- 사용자 동작: `/feeds?floor=5` → `아로와나 · 아로` 케밥 → `삭제` → `확인`
- 기대 결과: DELETE `/feed-log/fifth-floor/admin/1` 1회, Bearer. 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트, 5층 목록 GET 재요청.

## Mock S2 — 기록 상세에서 삭제

- 사용자 동작: `/feeds/fifth-floor/10` 케밥 → `삭제` → `확인`
- 기대 결과: DELETE `/feed-log/fifth-floor/admin/10` 1회, `/feeds/fifth-floor/animals/10`으로 이동해 토스트, 이력에 지운 행이 없다.

## Mock S3 — 개체 이력에서 삭제

- 사용자 동작: `/feeds/fifth-floor/animals/10` 1행 케밥 → `삭제` → `확인`
- 기대 결과: DELETE 1회, 행이 줄고 `1건`, 토스트.

## Mock S4 — 실패(404·500)

- Mock response: 404 / 500
- 기대 결과: `데이터 삭제에 실패했습니다` 토스트, 행 유지.

## Mock S5 — 취소

- 사용자 동작: `삭제` → `취소`
- 기대 결과: DELETE 요청 없음.
