# Test Scenarios — DOCUMENTS_DELETE (Mock)

Playwright `page.route()` mock. 대상: `DELETE /documents/{id}`. 상세는 `GET /documents/{id}` mock 으로 폼을 띄운 뒤 삭제한다.

## 삭제 성공
- S1.
  1. 상세(GET, detailGetCount=1) → 폼 표시.
  2. 삭제하기 → 확인 다이얼로그 확인 → `DELETE /documents/{id}` `200` → 목록 복귀. 삭제 직후 상세 GET 재요청 없음(detailGetCount=1 유지).
  3. 삭제된 id 로 상세 재진입 → 상세 쿼리에 `gcTime: 0`이 설정돼 목록 이탈 시 캐시가 즉시 제거됨 → stale 데이터 없이 신규 GET 발생(detailGetCount=2) → 폼에 서버 응답 표시.

## 오류
- S2. 404 존재하지 않는 자료 → 삭제 실패 다이얼로그.
- S3. 500 → 삭제 실패 다이얼로그.
- S4. 401 만료된 토큰 → 삭제 실패 다이얼로그, 목록 미이동(상세 URL 유지).

## 정리
- Mock 은 서버 상태를 만들지 않음. 실제 서버 테스트 미실행(`real_server.enabled: false`).
