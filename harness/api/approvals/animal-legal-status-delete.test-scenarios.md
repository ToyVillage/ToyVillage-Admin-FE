# API Test Scenarios — animal-legal-status-delete

공통 사전 조건: `/species/create` 진입, 목록 GET 기본 body(`국제보호종` id 5 포함),
`DELETE **/animal-manage/legal-status/*`를 `page.route()`로 mock 한다.
성공 body `{ "message": "법정지정분류 삭제 성공" }`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 삭제 성공

- 사용자 동작: `국제보호종` 선택 → `국제보호종 삭제`(✕) → 모달 `삭제`
- Mock request: `DELETE /animal-manage/legal-status/5`
- Mock response: HTTP 200, 이후 목록 GET은 `국제보호종` 없음
- 기대 결과: DELETE 1회 → 목록 GET 재요청 → pill 사라짐, 선택값에서 제거,
  포커스 `+ 법정분류 추가`

## Mock S2 — 취소

- 사용자 동작: ✕ → 모달 `취소`
- 기대 결과: DELETE 없음, pill 유지, 포커스가 ✕로 돌아감

## Mock S3 — 없는 항목(404)

- Mock response: HTTP 404(`ANIMAL_LEGAL_STATUS_NOT_FOUND`)
- 기대 결과: 모달 닫힘, pill·선택 유지, `삭제하지 못했습니다. 다시 시도해 주세요.`

## Mock S4 — 서버 오류(500)·권한 오류(403)

- 기대 결과: S3과 같은 실패 표시

## Mock S5 — 중복 제출 방지

- Mock response: 지연된 HTTP 200
- 사용자 동작: 모달 확인 연속 클릭
- 기대 결과: DELETE 1회, 모달 pending

## Mock S6 — 공용 목록 항목에는 모두 ✕

- 기대 결과: 공용 목록 pill(`천연기념물`·`국제보호종`)에 각각 삭제 버튼이 있다
  (2026-09-18 개발자 결정, 이슈 #149: 지울 수 없는 기본 선택지를 없앴다)

## Mock S7 — 삭제 후 저장

- 사용자 동작: S1 후 필수값 입력 → 저장
- 기대 결과: 종 생성 POST `animalLegalDesignation`에 5가 없다

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
