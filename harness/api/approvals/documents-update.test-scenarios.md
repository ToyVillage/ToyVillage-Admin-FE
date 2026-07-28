# Test Scenarios — DOCUMENTS_UPDATE (Mock)

Playwright `page.route()` mock. 대상: `PUT /documents/{id}`. 상세는 `GET /documents/{id}` mock 으로 폼을 띄운 뒤 수정 제출한다.

## 수정 성공
- S1. 상세(GET) → 폼 표시 → 제목 변경 후 저장 → `PUT /documents/{id}`가 `201 { message: "자료 수정 성공" }` → 목록 복귀.

## 오류
- S2. 400(제목 등) → 저장 실패 다이얼로그, 이동 없음.
- S3. 404 존재하지 않는 자료/파일 → 저장 실패 다이얼로그.
- S4. 500 → 저장 실패 다이얼로그.

## 부가
- S5. 저장 중 버튼 disabled('저장 중').

## 정리
- Mock 은 서버 상태를 만들지 않음. 실제 서버 테스트 미실행(`real_server.enabled: false`).
