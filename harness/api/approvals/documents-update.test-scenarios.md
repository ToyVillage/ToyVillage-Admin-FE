# Test Scenarios — DOCUMENTS_UPDATE (Mock)

Playwright `page.route()` mock. 대상: `PUT /documents/{id}`. 수정 화면(`/notices/resources/{id}/edit`)에서 `GET /documents/{id}` mock 으로 폼을 띄운 뒤 수정 제출한다. 상세 화면(`/notices/resources/{id}`)은 읽기 전용이다.

## 수정 성공
- S1. 수정 화면 진입(GET) → 폼 표시 → 제목 변경 후 저장 → `PUT /documents/{id}`가 `200 { message: "자료 수정 성공" }` → 목록 복귀. 이때 `files`는 기존 파일 키가 그대로 보존된다(파일 손실 없음).
- S5. 새 파일 첨부 → 즉시 업로드로 새 `fileKey` 확보 → 저장 시 `files`가 기존 키 + 새 키로 병합 전송된다.
- S7. 기존 첨부 파일 제거 → 저장 시 `files`에서 해당 키가 빠지고 남은 키만 전송된다.

## 오류
- S2. 400(제목 등) → 저장 실패 다이얼로그, 이동 없음.
- S3. 404 존재하지 않는 자료/파일 → 저장 실패 다이얼로그.
- S4. 500 → 저장 실패 다이얼로그.
- S6. 401 만료된 토큰 → 재발급 시도 없이 저장된 토큰을 비우고 `/login` 으로 이동(저장 성공 처리 없음). 전제: 세션 fixture 에 refresh token 이 없고 APP_AUTH_REISSUE mock 도 없다. 재발급 성공 경로는 app-auth-reissue 시나리오가 담당한다. 전역 인증 처리 도입으로 실패 다이얼로그에서 개정.

## 부가
- S8. 저장 중 버튼 disabled('저장 중').

## 정리
- Mock 은 서버 상태를 만들지 않음. 실제 서버 테스트 미실행(`real_server.enabled: false`).

## 2026-10-13 변경 (#244)
- 자료 상세가 읽기 전용으로 바뀌어 수정 폼이 `/notices/resources/{id}/edit`로 옮겨진 것(2026-09-20 `4de71b9`)을 반영했다. API 동작 변경 없음.
