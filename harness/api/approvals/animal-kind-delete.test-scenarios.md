# API Test Scenarios — animal-kind-delete

공통 사전 조건: `accessToken`을 localStorage에 넣고 종 목록·상세 GET과
`DELETE **/animal-manage/kind/*`를 `page.route()`로 mock 한다
(`tests/e2e/support/animal-manage-api.ts`). 실제 서버는 호출하지 않는다.
성공 body: `{ "message": "종 삭제 성공" }`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 종 목록에서 삭제 성공

- 사용자 동작: 행 케밥 → `삭제` → 모달 `삭제`
- Mock request: `DELETE /animal-manage/kind/1`
- Mock response: HTTP 200 성공 body
- 기대 결과: DELETE 1회, `delete-success` 토스트, 목록 GET 재요청, 화면 유지

## Mock S2 — 종 상세에서 삭제 성공

- 사용자 동작: `/species/1` 프로필 케밥 → `삭제` → 확인
- 기대 결과: DELETE 1회 → `/species` 이동 + `delete-success` 토스트,
  이동 전에 `종을 찾을 수 없습니다.`가 보이지 않는다

## Mock S3 — 존재하지 않는 종(404)

- Mock response: HTTP 404(`ANIMAL_KIND_NOT_FOUND`)
- 기대 결과: `delete-error` 토스트, 행 유지, 케밥으로 포커스 복귀, 이동 없음

## Mock S4 — 서버 오류(500)

- Mock response: HTTP 500
- 기대 결과: S3과 같은 실패 처리

## Mock S5 — 권한 오류(401/403)

- Mock response: HTTP 403
- 기대 결과: S3과 같은 실패 처리

## Mock S6 — 중복 제출 방지

- Mock response: 지연된 HTTP 200
- 사용자 동작: 모달 확인 버튼 연속 클릭
- 기대 결과: DELETE 1회, 대기 중 모달 pending

## Mock S7 — 취소

- 사용자 동작: 모달 `취소`
- 기대 결과: DELETE 요청 없음, 케밥으로 포커스 복귀

## Mock S8 — 연쇄 캐시 무효화

- 사전 조건: 종 1의 개체 목록·관찰 목록을 한 번 조회해 캐시가 있다
- 사용자 동작: 종 1 삭제 성공 후 뒤로가기로 개체 화면 경로 재진입
- 기대 결과: 개체·관찰 GET이 캐시가 아니라 재요청된다

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
