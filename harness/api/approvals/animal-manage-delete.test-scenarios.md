# API Test Scenarios — animal-manage-delete

공통 사전 조건: `accessToken`을 localStorage에 넣고
`tests/e2e/support/animal-manage-api.ts`(공용)로
`GET **/animal-manage/kind/1/animal`(목록)·`GET **/animal-manage/{id}`
(상세)·`DELETE **/animal-manage/{id}`를 route mock 한다. 종 조회는 현행
mock 상태 유지. 실제 서버는 호출하지 않는다.

삭제 성공 응답: HTTP 200, `{"message":"개체 삭제 성공"}`.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`을
쓴다.

## Mock S1 — 개체 상세에서 삭제 성공과 이동

- 사전 조건: `/species/1/individuals/12` 진입(상세 mock 성공)
- 사용자 동작: 프로필 케밥 `삭제` → 확인 모달 `삭제`
- Mock request: `DELETE /animal-manage/12`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200 삭제 성공 body
- 기대 결과: DELETE 정확히 1회(body 없음), `/species/1`로 이동,
  `데이터 삭제에 성공했습니다` 토스트

## Mock S2 — 종 상세 개체 표에서 삭제 성공과 목록 갱신

- 사전 조건: `/species/1` 진입, 목록 mock 3행
- 사용자 동작: `무궁이` 행 케밥 `삭제` → 확인
- Mock response: HTTP 200 삭제 성공 body(mock 저장소에서 해당 행 제거)
- 기대 결과: DELETE 1회, 화면에 머무르며 `데이터 삭제에 성공했습니다`
  토스트, 목록 GET 재요청 후 해당 행이 사라진 응답이 표에 반영

## Mock S3 — 삭제로 페이지 범위 이탈 시 마지막 페이지 당김

- 사전 조건: `totalPages: 2`, 2페이지에 1행만 있는 목록 mock, 2페이지로
  이동
- 사용자 동작: 마지막 행 삭제 확인
- Mock response: HTTP 200 성공, 이후 목록은 `totalPages: 1`
- 기대 결과: 목록 재조회 후 1페이지 표시(빈 2페이지에 머무르지 않음)

## Mock S4 — 존재하지 않는 개체(404)

- Mock response: HTTP 404,
  `{"message":"존재하지 않는 개체입니다.","status":404,"timestamp":"2026-09-16T12:00:00","description":"ANIMAL_MANAGE_NOT_FOUND"}`
- 기대 결과: `데이터 삭제에 실패했습니다` 토스트, 화면 유지, 이동·행
  제거 없음(오류를 성공처럼 처리하지 않음)

## Mock S5 — 서버 오류(500)

- Mock response: HTTP 500 오류 body
- 기대 결과: S4와 같은 실패 처리, 모달 닫힘 후 케밥 초점 복원

## Mock S6 — 인증·권한 오류(401/403)

- Mock response: HTTP 401 오류 body / HTTP 403 오류 body
- 기대 결과: 각 경우 S4와 같은 실패 처리

## Mock S7 — 중복 제출 방지

- Mock response: 지연된 HTTP 200 성공 body
- 사용자 동작: 확인 모달 `삭제` 연속 클릭
- 기대 결과: DELETE 1회, 대기 중 모달 pending 상태(버튼 비활성),
  응답 후 정상 처리

## Mock S8 — 성공 시 상세 캐시 제거·관련 캐시 무효화

- 사전 조건: S1 흐름(상세 캐시 존재)
- 기대 결과: 이동한 종 상세에서 개체 목록 GET 재요청(individuals 무효화
  반영). 삭제한 개체 상세로 다시 진입하면 캐시 재사용 없이
  `GET /animal-manage/12` 재요청(제거 확인 — 404 mock이면 not-found
  표시)

## Mock S9 — 삭제 취소

- 사용자 동작: 확인 모달에서 `취소`
- 기대 결과: DELETE 요청 없음, 행·화면 유지, 케밥 초점 복원

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{}` (message 없음)
- 기대 결과: 성공 처리하지 않고 `데이터 삭제에 실패했습니다` 토스트,
  화면·행 유지

## Staging R1

- 실행 여부: disabled
- 실제 request: 미실행
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 없음
- 기대 status와 결과: 없음
- 생성 데이터 식별자: 없음
- 정리 절차: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음(Playwright `page.route()` 제어)
- 승인 Contract의 status·body만 사용(200 + message / 401 / 403 / 404 /
  500)
- 공통 Axios와 기존 인증 interceptor 사용
- 오류를 성공·빈 목록·localStorage 기록으로 숨기지 않음
  (`toyvillage:individuals:deleted` 미기록 확인)
- Staging 실제 서버 테스트는 실행하지 않음
