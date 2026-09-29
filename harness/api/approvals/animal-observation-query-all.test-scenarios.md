# API Test Scenarios — animal-observation-query-all

공통 사전 조건: `accessToken` 설정. 개체 상세 GET(`animalManageId: 7`, `animalKindId: 1`)과
`GET **/animal-manage/7/observations*`를 `page.route()`로 mock 하고
`/species/1/individuals/7`에 진입한다. 기본 성공 body:

```json
{
  "content": [
    { "animalObservationId": 31, "title": "식욕 감소", "createdAt": "2026-09-16",
      "authorName": "김사육", "files": [{ "fileName": "memo.pdf", "fileKey": "obs/memo.pdf" }] },
    { "animalObservationId": 30, "title": "체중 측정", "createdAt": "2026-09-15",
      "authorName": "이사육", "files": [] }
  ],
  "pageable": { "pageNumber": 1, "pageSize": 10, "offset": 0, "paged": true, "unpaged": false },
  "totalPages": 2, "totalElements": 12, "size": 10, "number": 1,
  "first": true, "last": false, "numberOfElements": 2, "empty": false
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 진입 조회

- Mock request: `GET /animal-manage/7/observations?page=1&size=10`(sort 없음)
- 기대 결과: GET 1회, 행 2개(제목·`2026.09.16`·`김사육`·첨부), 헤더 건수 12, 페이지 버튼 1·2

## Mock S2 — 페이지 이동

- 사용자 동작: 페이지 `2`
- 기대 결과: `page=2` 요청, 이동 중 이전 표 유지

## Mock S3 — 빈 목록

- Mock response: `content: []`, `totalPages: 0`, `totalElements: 0`, `empty: true`
- 기대 결과: `등록된 관찰 기록이 없습니다`, 헤더 건수 0, 오류 문구 없음

## Mock S4 — 없는 개체(404)

- Mock response: HTTP 404(`ANIMAL_MANAGE_NOT_FOUND`)
- 기대 결과: `개체를 찾을 수 없습니다.` not-found 상태

## Mock S5 — 서버 오류(500)·권한 오류(403)

- 기대 결과: 프로필 카드 표시, 관찰 섹션 `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`,
  빈 목록 문구 아님

## Mock S6 — 응답 형식 위반

- Mock response: HTTP 200 `{ "observations": [] }`
- 기대 결과: S5와 같은 오류 표시

## Mock S7 — 첨부 다운로드 성공

- 사전 조건: 파일 서버 `GET {VITE_FILE_BASE_URL}/obs%2Fmemo.pdf` mock 200
- 사용자 동작: 첫 행 첨부 다운로드
- 기대 결과: 파일 서버 요청 1회, 다운로드 발생, 실패 토스트 없음

## Mock S8 — 첨부 다운로드 실패

- 사전 조건: 파일 서버 mock 404
- 기대 결과: `파일 다운로드에 실패했습니다` 토스트

## Mock S9 — 행 이동

- 사용자 동작: 첫 행 클릭
- 기대 결과: `/species/1/individuals/7/observations/31` 이동

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
