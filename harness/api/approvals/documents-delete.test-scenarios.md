# Test Scenarios — DOCUMENTS_DELETE (Mock)

Playwright `page.route()` mock. 대상: `DELETE /documents/{id}`. 상세는 `GET /documents/{id}` mock 으로 폼을 띄운 뒤 삭제한다.

## 삭제 성공
- S1. 상세(GET) → 폼 표시 → 삭제하기 → 확인 다이얼로그 확인 → `DELETE /documents/{id}`가 `200 { message: "자료 삭제 성공" }` → 목록 복귀. 이때 상세 쿼리를 무효화하지 않아 삭제된 id 재조회(GET)가 발생하지 않는다(초기 1회뿐).

## 오류
- S2. 404 존재하지 않는 자료 → 삭제 실패 다이얼로그.
- S3. 500 → 삭제 실패 다이얼로그.

## 정리
- Mock 은 서버 상태를 만들지 않음. 실제 서버 테스트 미실행(`real_server.enabled: false`).
