# API Test Scenarios — animal-observation-delete

공통 사전 조건: `animal-observation-query-all`·`animal-observation-query` 기본 mock에
`DELETE **/animal-manage/7/observations/*`(200 `{ "message": "관찰 삭제 성공" }`)를 더한다. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 관찰 상세에서 삭제 성공

- 사용자 동작: 제목 행 케밥 → `삭제` → 확인
- Mock request: `DELETE /animal-manage/7/observations/31`
- 기대 결과: DELETE 1회 → `/species/1/individuals/7` 이동 + `delete-success` 토스트, 관찰 목록 GET 재요청

## Mock S2 — 개체 상세 표에서 삭제 성공

- 사용자 동작: 행 케밥 → `삭제` → 확인
- 기대 결과: DELETE 1회, 화면 유지, `delete-success` 토스트, 목록 GET 재요청

## Mock S3 — 마지막 페이지 마지막 행 삭제

- 사전 조건: 2페이지에 1행, 삭제 후 목록 응답 `totalPages: 1`
- 기대 결과: 1페이지로 당겨진다

## Mock S4 — 관찰 상세 삭제 실패(404/500)

- 기대 결과: 모달 닫힘, `데이터 삭제에 실패했습니다` 토스트, 이동 없음, 케밥 포커스

## Mock S5 — 표 삭제 실패(404/500/403)

- 기대 결과: `delete-error` 토스트, 행 유지, 케밥 포커스

## Mock S6 — 중복 제출 방지

- Mock response: 지연된 200
- 기대 결과: DELETE 1회, 모달 pending

## Mock S7 — 취소

- 기대 결과: DELETE 없음

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
- 승인 Contract의 status와 body만 사용(밖의 필드 없음)
- 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock으로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
