# Test Scenarios — RESERVATION_PERMISSION_DELETE (Mock)

Playwright `page.route()` 기반 mock. 대상: `DELETE /reservation/permission/{reservationId}/{userId}`. 상세 진입 시 예약 상세·권한 목록도 호출되므로 함께 mock 한다. 실제 서버는 호출하지 않는다.

## 성공

- S1. 권한 카드 '제거' → 확인 다이얼로그 '확인' → DELETE 200 → 목록 무효화 후 재조회에서 해당 직원 사라짐, 다이얼로그 닫힘.

## 오류

- S2. DELETE 500 → 목록 그대로(직원 유지), 확인 다이얼로그 유지(임의로 제거하지 않음).

## 정리

- 삭제 대상은 mock 응답이므로 실제 서버 상태 변경 없음 → 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
