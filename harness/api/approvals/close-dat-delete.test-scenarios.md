# API Test Scenarios — close-dat-delete

## Mock S1 — 삭제 성공과 캐시 갱신

- 목적: API 목록에서 수정 화면으로 진입해 route ID로 휴관일을 한 번 삭제한다.
- 사전 Mock request: `GET /api/close-day`
- 사전 Mock response: HTTP 200,
  `[{"id":7,"title":"삭제 대상 휴관일","startCloseTime":"2026-07-28","endCloseTime":"2026-07-28"}]`
- Mock request: `DELETE /api/close-day/7`
- Request headers: `Authorization: Bearer ...`
- Request query/body: 없음
- Mock response: HTTP 201,
  `{"message":"휴관일이 삭제되었습니다."}`
- 후속 Mock request: `GET /api/close-day`
- 후속 Mock response: 삭제된 휴관일이 없는 HTTP 200 빈 목록
- 사용자 동작: `/notices/guide`에서 휴관일 카드를 눌러 수정 화면으로 이동한 뒤
  `삭제하기` 클릭 후 확인
- 기대 결과: DELETE가 정확히 한 번 호출되고 request body가 없으며,
  `/notices/guide`로 이동해 삭제된 휴관일이 없는 목록을 표시

## Mock S2 — 유효하지 않은 요청

- 목적: HTTP 400을 성공으로 숨기거나 localStorage mock 삭제로 대체하지 않는다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면에 머물고
  `삭제하지 못했습니다. 다시 시도해 주세요.`를 표시하며 다시 삭제 가능

## Mock S3 — 인증 오류

- 목적: HTTP 401 이후 성공 이동이나 캐시 제거가 발생하지 않는다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: HTTP 401 Contract 오류 body
- 사용자 동작: 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면을 유지하고 오류 상태를 표시하며 목록으로 이동하지 않음

## Mock S4 — 존재하지 않는 휴관일

- 목적: HTTP 404를 삭제 성공으로 처리하지 않는다.
- Mock request: `DELETE /api/close-day/999`
- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: ID 999 휴관일의 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면을 유지하고 오류 상태를 표시하며 mock 삭제 없음

## Mock S5 — 서버 오류

- 목적: HTTP 500 이후에도 수정 화면에서 삭제를 재시도할 수 있다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면을 유지하고 오류 상태를 표시하며 캐시를 제거하지 않음

## Mock S6 — 중복 삭제 방지

- 목적: 확인 동작이 연속 발생해도 삭제 요청을 한 번만 보낸다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: 지연된 HTTP 201,
  `{"message":"휴관일이 삭제되었습니다."}`
- 사용자 동작: 삭제 확인 동작을 연속 발생
- 기대 결과: DELETE 요청 횟수 1회, 완료 후 목록으로 이동

## Mock S7 — Contract 응답 형식 위반

- 목적: HTTP 201 body가 Contract와 다르면 성공 이동하지 않는다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: HTTP 201, `{"result":"ok"}`
- 사용자 동작: 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면에 머물고 오류 상태를 표시하며 상세 캐시를 제거하지 않음

## Mock S8 — 승인되지 않은 성공 Status 거부

- 목적: body가 맞더라도 HTTP 200을 Contract 성공으로 처리하지 않는다.
- Mock request: `DELETE /api/close-day/7`
- Mock response: HTTP 200,
  `{"message":"휴관일이 삭제되었습니다."}`
- 사용자 동작: 수정 화면에서 삭제 확인
- 기대 결과: 수정 화면에 머물고 오류 상태를 표시하며 목록으로 이동하지 않음

## Mock S9 — 새로고침 직접 진입 상세 조회

- 목적: 목록 캐시가 없는 수정 URL 새로고침에서도 mock 상세가 아니라 실제
  전체 조회 API 결과를 삭제 대상 폼에 표시한다.
- 사전 Mock request: `GET /api/close-day`
- 사전 Mock response: HTTP 200,
  `[{"id":7,"title":"API 삭제 대상","startCloseTime":"2026-08-01","endCloseTime":"2026-08-02"}]`
- 사용자 동작: `/notices/guide/7/edit`에 직접 진입한 뒤 페이지를 새로고침
- 기대 결과: GET 결과의 날짜와 제목이 표시되고, 해당 실제 데이터에 대한
  삭제 동작을 시작할 수 있음

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
- 상세 초기값 조회도 localStorage mock으로 fallback하지 않음
- 생성·조회·수정 API 동작은 이번 범위에서 변경하지 않음
- 단일 조회 API를 추측해 호출하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
