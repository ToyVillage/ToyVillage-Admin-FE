# Test Scenarios — DOCUMENTS_QUERY (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /documents/{id}`. 응답은 Contract의 status/body만 사용한다. 상세 진입 시 조회되므로 goto 전에 route를 건다.

## 조회 성공

- S1. 200/201 상세 응답 → 편집 폼에 제목·첨부(fileName)·분류가 채워짐(title 매핑, files→첨부 이름).

## 오류

디자인에 없는 '자료를 찾을 수 없습니다' 화면은 두지 않는다. 로딩/오류 시 빈 폼(수정 레이아웃)만 유지한다.

- S2. 404 존재하지 않는 자료 → 별도 안내 화면 없이 빈 폼 유지.
- S3. 500 서버 오류 → 별도 안내 화면 없이 빈 폼 유지.

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
