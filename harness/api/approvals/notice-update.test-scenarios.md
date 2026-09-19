# API Test Scenarios — notice-update

## Mock S1 — 수정 성공과 캐시 갱신

- 목적: route ID와 Contract JSON body로 공지를 한 번 수정하고 캐시를 갱신한다.
- 사전 Mock request: `GET /api/notice/7`
- 사전 Mock response: HTTP 200 공지 상세
- Mock request: `PUT /api/notice/7`
- Request headers: `Content-Type: application/json`, `Authorization: Bearer ...`
- Request body:
  `{"title":"API 수정 공지","teamIds":[],"content":"API 수정 내용"}`
- Mock response: HTTP 200, `{"message":"공지 수정 성공"}`
- 후속 Mock request: `GET /api/notice?page=1&size=10`
- 후속 Mock response: 수정된 공지를 포함한 HTTP 200 목록
- 사용자 동작: `/notices/list/7/edit`에서 제목과 내용을 수정하고 `저장하기` 클릭
- 기대 결과: PUT이 정확히 한 번 호출되고 request에 `category`나 `attachments`가
  없으며, `/notices/list`로 이동해 갱신된 목록을 표시

## Mock S2 — 존재하지 않는 팀

- 목적: HTTP 404 `TEAM_NOT_FOUND`를 성공으로 숨기지 않고 입력을 보존한다(2026-09-18 Swagger 기준, 기존 400 분류 오류 대체).
- Mock request: `PUT /api/notice/7`
- Mock response: HTTP 404, `{"message":"존재하지 않는 팀입니다.",...}`
- 사용자 동작: 유효한 제목과 내용을 수정하고 `저장하기` 클릭
- 기대 결과: 수정 페이지에 머물고 입력을 보존하며
  `저장하지 못했습니다. 다시 시도해 주세요.` 표시, 제출 버튼 재활성화

## Mock S3 — 접근 권한 오류

- 목적: HTTP 403 이후에도 입력을 잃지 않고 권한 오류를 성공으로 처리하지 않는다.
- Mock request: `PUT /api/notice/7`
- Mock response: HTTP 403 Contract 오류 body
- 사용자 동작: 공지 내용을 수정하고 `저장하기` 클릭
- 기대 결과: 접근 거부를 세션 무효로 보고 저장된 토큰을 비운 뒤 `/login` 으로
  이동하며 저장을 성공으로 처리하지 않음
- 비고: 전역 인증 처리 도입 전에는 수정 페이지·입력 유지가 기대값이었다.
  하드 리다이렉트라 작성 중이던 입력은 보존되지 않는다.

## Mock S4 — 존재하지 않는 공지

- 목적: HTTP 404를 수정 성공으로 처리하거나 localStorage에 저장하지 않는다.
- Mock request: `PUT /api/notice/999`
- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: `/notices/list/999/edit`에서 수정 submit
- 기대 결과: 수정 페이지와 입력을 유지하고 오류 상태를 표시하며 mock 저장 없음

## Mock S5 — 서버 오류

- 목적: HTTP 500 이후에도 입력을 잃지 않고 재시도할 수 있다.
- Mock request: `PUT /api/notice/7`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 공지 내용을 수정하고 `저장하기` 클릭
- 기대 결과: 수정 페이지와 입력을 유지하고 오류 상태를 표시하며 목록으로
  이동하지 않음

## Mock S6 — 중복 제출 방지

- 목적: 연속 submit이 발생해도 수정 요청을 한 번만 보낸다.
- Mock request: `PUT /api/notice/7`
- Mock response: 지연된 HTTP 200, `{"message":"공지 수정 성공"}`
- 사용자 동작: 같은 form에서 submit event를 연속 발생
- 기대 결과: PUT 요청 횟수 1회, 완료 후 목록으로 이동

## Mock S7 — Contract 응답 형식 위반

- 목적: HTTP 200 body가 Contract와 다르면 성공 이동하지 않는다.
- Mock request: `PUT /api/notice/7`
- Mock response: HTTP 200, `{"result":"ok"}`
- 사용자 동작: 유효한 제목과 내용을 수정하고 `저장하기` 클릭
- 기대 결과: 수정 페이지와 입력을 유지하고 오류 상태를 표시

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
- 수정 API는 공통 Axios와 기존 인증 interceptor를 사용
- loading/error/success 상태가 숨겨지지 않음
- 실패 시 localStorage mock 수정으로 fallback하지 않음
- 생성 API와 삭제 mock 동작은 이번 범위에서 변경하지 않음
- Staging 실제 서버 테스트는 실행하지 않음

## Mock S8 — 기존 팀 유지 (2026-09-18 추가)

- 목적: 수정 화면이 상세 응답 `teams`를 선택 상태로 복원하고, 그대로 저장하면 그 팀 id를 `teamIds`로 보낸다. 팀 목록 조회에 없어도 id를 잃지 않는다.
- 사전 Mock request: `GET /api/notice/7` → `teams: [{id:2,"창고팀"},{id:4,"사육팀"}]`
- Mock request: `PUT /api/notice/7`
- Request body: `{"title":"팀 공지 수정","teamIds":[2,4],"content":"팀 공지 내용"}`
- 사용자 동작: 제목 수정 후 `저장하기` 클릭
- 기대 결과: `창고팀`·`사육팀` 체크 상태, request `teamIds`가 `[2, 4]`
- 테스트: `tests/e2e/api/notice-update.spec.ts` S8
