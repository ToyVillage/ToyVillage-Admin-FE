# Test Scenarios — DOCUMENTS_DELETE (Mock)

Playwright `page.route()` mock. 대상: `DELETE /documents/{id}`. 목록(`GET /documents`) mock 으로 행을 띄운 뒤 행 케밥 메뉴에서 삭제한다. 상세 화면은 읽기 전용이라 삭제 버튼이 없다.

## 삭제 성공
- S1.
  1. `/notices/resources` 목록 → 행 케밥(`{제목} 관리 메뉴`) → `삭제` → `정말 삭제하시겠습니까?` 확인 다이얼로그 `확인`.
  2. `DELETE /documents/{id}` `200` → `데이터 삭제에 성공했습니다` 토스트, 목록 재조회로 행 제거. 상세 GET 호출 없음(detailGetCount=0).
  3. 삭제된 id 로 상세(`/notices/resources/{id}`) 직접 진입 → 상세 쿼리에 `gcTime: 0`이 설정돼 캐시 없이 신규 GET 발생(detailGetCount=1) → 서버 응답 제목 표시.

## 오류
- S2. 404 존재하지 않는 자료 → `데이터 삭제에 실패했습니다` 토스트.
- S3. 500 → `데이터 삭제에 실패했습니다` 토스트.
- S4. 401 만료된 토큰 → 재발급 시도 없이 저장된 토큰을 비우고 `/login` 으로 이동(삭제 성공 처리 없음). 전제: 세션 fixture 에 refresh token 이 없고 APP_AUTH_REISSUE mock 도 없다. 재발급 성공 경로는 app-auth-reissue 시나리오가 담당한다. 전역 인증 처리 도입으로 실패 다이얼로그에서 개정.

## 정리
- Mock 은 서버 상태를 만들지 않음. 실제 서버 테스트 미실행(`real_server.enabled: false`).

## 2026-10-13 변경 (#244)
- 자료 상세가 읽기 전용으로 바뀌고 삭제가 목록 행 케밥으로 옮겨진 것(2026-09-20 `4de71b9`), 실패 표시가 다이얼로그에서 토스트로 바뀐 것(`e015611`)을 반영했다. API 동작 변경 없음.
