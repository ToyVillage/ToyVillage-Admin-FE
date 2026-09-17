# API Test Scenarios — notice-delete

## Mock S1 — 삭제 성공과 캐시 갱신

- 목적: 목록 케밥에서 공지를 한 번 삭제하고 캐시를 갱신한다.
- 사전 Mock request: `GET /api/notice?page=1&size=10`
- 사전 Mock response: HTTP 200, ID 7 공지를 포함한 목록
- Mock request: `DELETE /api/notice/7`
- Request headers: `Authorization: Bearer ...`
- Request query/body: 없음
- Mock response: HTTP 200,
  `{"message":"공지 삭제가 완료되었습니다."}`
- 후속 Mock request: `GET /api/notice?page=1&size=10`
- 후속 Mock response: 삭제된 공지가 없는 HTTP 200 목록
- 사용자 동작: `/notices/list`에서 ID 7 행 케밥 → `삭제` → 확인
- 기대 결과: DELETE가 정확히 한 번 호출되고 request body가 없으며,
  `/notices/list`에 머문 채 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트 표시

## Mock S2 — 유효하지 않은 요청

- 목적: HTTP 400을 성공으로 숨기거나 localStorage mock 삭제로 대체하지 않는다.
- Mock request: `DELETE /api/notice/7`
- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 목록 케밥에서 삭제 확인
- 기대 결과: 목록에 머물고 행이 남아 있으며 `데이터 삭제에 실패했습니다` 토스트를 표시한다. 다시 케밥으로 삭제 가능

## Mock S3 — 인증 오류

- 목적: HTTP 401 이후 삭제 성공 이동이나 캐시 제거가 발생하지 않는다.
- Mock request: `DELETE /api/notice/7`
- Mock response: HTTP 401 Contract 오류 body
- 사용자 동작: 목록 케밥에서 삭제 확인
- 전제: 세션 fixture 에 refresh token 이 없고 APP_AUTH_REISSUE mock 도 없다.
  재발급 성공 경로는 app-auth-reissue 시나리오가 담당한다.
- 기대 결과: 재발급 시도 없이 저장된 토큰을 비우고 `/login` 으로 이동하며
  삭제를 성공으로 처리하지 않음

## Mock S4 — 존재하지 않는 공지

- 목적: HTTP 404를 삭제 성공으로 처리하지 않는다.
- Mock request: `DELETE /api/notice/999`
- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: ID 999 행 케밥에서 삭제 확인
- 기대 결과: 목록에 머물고 행이 남아 있으며 `데이터 삭제에 실패했습니다` 토스트를 표시한다. mock 삭제 없음

## Mock S5 — 서버 오류

- 목적: HTTP 500 이후에도 목록에서 삭제를 재시도할 수 있다.
- Mock request: `DELETE /api/notice/7`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 목록 케밥에서 삭제 확인
- 기대 결과: 목록에 머물고 행이 남아 있으며 `데이터 삭제에 실패했습니다` 토스트를 표시한다

## Mock S6 — 중복 삭제 방지

- 목적: 확인 동작이 연속 발생해도 삭제 요청을 한 번만 보낸다.
- Mock request: `DELETE /api/notice/7`
- Mock response: 지연된 HTTP 200,
  `{"message":"공지 삭제가 완료되었습니다."}`
- 사용자 동작: 삭제 확인 동작을 연속 발생
- 기대 결과: DELETE 요청 횟수 1회, 완료 후 행이 사라짐

## Mock S7 — Contract 응답 형식 위반

- 목적: HTTP 200 body가 Contract와 다르면 성공 이동하지 않는다.
- Mock request: `DELETE /api/notice/7`
- Mock response: HTTP 200, `{"result":"ok"}`
- 사용자 동작: 목록 케밥에서 삭제 확인
- 기대 결과: 목록에 머물고 행이 남아 있으며 `데이터 삭제에 실패했습니다` 토스트를 표시한다

## Staging R1

- 실행 여부: disabled
- 실제 request: 미실행
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 없음
- 기대 status와 결과: 없음
- 생성 데이터 식별자: 없음
- 정리 절차: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- 삭제 API는 공통 Axios와 기존 인증 interceptor를 사용
- loading/error/success 상태가 숨겨지지 않음
- 실패 시 localStorage mock 삭제로 fallback하지 않음
- 생성·조회·수정 API 동작은 이번 범위에서 변경하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
