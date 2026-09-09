# API Test Scenarios — reservations-admin-delete

대상: `/notices/reservations/:id` (`ReservationDetailPage`). 상세(`/reservation/{id}`)를 200으로 채워 편집 폼이 렌더되게 하고 삭제를 검증한다. mock은 `page.route()` 기반, 실제 서버 요청 없음.

## Mock S1 — 정상 삭제 → 목록 이동

- 목적: 삭제 확인 후 DELETE 호출·목록 복귀.
- Mock request: `DELETE /api/reservation/1`
- Mock response: HTTP 200, `{ "message": "단체예약 삭제가 완료되었습니다." }`
- 사용자 동작: `삭제하기` → 확인 모달에서 `확인`(삭제)
- 기대 결과: 요청 method DELETE, path `/reservation/1`. 이후 `/notices/reservations`로 이동.

## Mock S2 — 삭제 실패(404) → 서버 message 알림

- 목적: 실패를 사용자에게 알린다(이동 없음).
- Mock request: `DELETE /api/reservation/1`
- Mock response: HTTP 404 `{ message: "존재하지 않는 단체예약 목록입니다.", ... }`
- 사용자 동작: `삭제하기` → 확인
- 기대 결과: 상단 `role="alert"`에 서버 message 표시, 목록 이동 없음.

## Staging R1

- 실행 여부: disabled (`real_server.enabled=false`)
- 실제 request/사용자 동작/결과/데이터/정리: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
