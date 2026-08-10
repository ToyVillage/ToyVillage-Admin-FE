# Test Scenarios — RESERVATION_PERMISSION_QUERY_ALL (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /reservation/permission/{reservationId}`. 상세 진입 시 예약 상세(`/reservation/{id}`)도 함께 호출되므로 둘 다 mock 한다(예약 상세는 카드 렌더용 고정 200). 실제 서버는 호출하지 않는다.

## 조회 성공

- S1. 권한 목록 200 `[{appAdminId:11,name:'이서연'},{appAdminId:12,name:'박민준'}]` → 페이지 권한 카드에 두 직원 이름 표시.

## 오류

- S2. 권한 목록 500 → 카드에 직원이 표시되지 않음(빈 배열로 숨기지 않음). 예약 상세는 200이라 카드 자체는 렌더.

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
