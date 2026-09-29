# API Test Scenarios — animal-manage-query-all

공통 사전 조건: `accessToken`을 localStorage에 넣고
`mockAnimalManageApi(page)`(`tests/e2e/support/animal-manage-api.ts`, 개체관리
네 묶음 공용)를 설치한 뒤 `/species/1`로 진입한다. 종 조회는 kind 묶음
handler가 응답한다. 이 feature의 대상은 `individualListPattern`
(`GET **/animal-manage/kind/{animalKindId}/animal`)이며, 시나리오별 응답은
나중 등록 `page.route()`로 덮어쓴다. 요청 URL·쿼리는
`handle.individualListQueries`로 검증한다. 실제 서버는 호출하지 않는다.

`page` 기대값은 1-base다(2026-09-16 개발자 결정 — 화면 page를 그대로
전송). 성별은 서버 값(`MAN`/`WOMAN`/`UNKNOWN`)이며 모델도 같은 값으로
개명돼 있다.

기본 목록 응답(성공 200, Spring Pageable — Contract 필드만, 종 1 fixture):

```json
{
  "content": [
    { "animalManageId": 3, "animalName": "두리", "animalGender": "MAN", "birthYear": 2021 },
    { "animalManageId": 2, "animalName": "미미", "animalGender": "WOMAN", "birthYear": 2020 },
    { "animalManageId": 1, "animalName": "동식이", "animalGender": "MAN", "birthYear": 2019 }
  ],
  "pageable": { "pageNumber": 1, "pageSize": 10, "offset": 0, "paged": true, "unpaged": false },
  "totalPages": 1,
  "totalElements": 3,
  "size": 10,
  "number": 1,
  "first": true,
  "last": true,
  "numberOfElements": 3,
  "empty": false
}
```

`number`·`pageable.pageNumber`는 화면이 읽지 않으므로 값은 기대 결과에
영향을 주지 않는다. 오류 body는 Contract 형식
`{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 목록 조회 성공

- Mock request: `GET /animal-manage/kind/1/animal?page=1&size=10`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200, 기본 목록 응답
- 사용자 동작: 종 상세 진입
- 기대 결과: 목록 GET 1회, 쿼리 `page=1`·`size=10`, `keyword`·`sort`
  파라미터 없음. 표에 3행 — 이름 `두리`/`미미`/`동식이`(응답 순서 그대로),
  성별 뱃지 `수컷`/`암컷`/`수컷`, 출생연도 `2021년`/`2020년`/`2019년`

## Mock S2 — 성별 3종 표시

- Mock response: HTTP 200, `content`에 `animalGender`가 `MAN`·`WOMAN`·
  `UNKNOWN`인 행 각 1개
- 기대 결과: 성별 칸에 `수컷`·`암컷`·`미상` 뱃지가 각각 보임
  (개명된 모델 값으로 라벨·색 분기가 동작)

## Mock S3 — 빈 목록(등록된 개체 없음)

- 사전 조건: 마리수 0인 종(fixture 종 13)으로 진입
- Mock response: HTTP 200, `content: []`, `totalElements: 0`,
  `totalPages: 0`, `numberOfElements: 0`, `empty: true`
- 기대 결과: 섹션 헤더 `0마리`, `등록된 개체가 없습니다` 빈 상태 문구
  (오류 아님), 페이지네이션 버튼 없음

## Mock S4 — 서버 검색(keyword 전달)

- 사용자 동작: 검색 입력에 `무궁` 입력
- Mock response: HTTP 200, `content`에 `animalName: "무궁이"` 1건,
  `totalElements: 1`, `totalPages: 1`
- 기대 결과: 마지막 목록 GET 쿼리가 `keyword=무궁`·`page=1`·`size=10`,
  표에 응답 행 `무궁이`만 표시(클라이언트 필터 없음 — mock이 이름과 무관한
  행을 돌려줘도 그대로 보여야 한다), 섹션 헤더 마리수는 검색과 무관하게
  종의 마리수 유지

## Mock S5 — 공백 검색어는 keyword 미전송

- 사용자 동작: 검색 입력에 공백만 입력
- 기대 결과: 목록 GET 쿼리에 `keyword` 파라미터 없음

## Mock S6 — 검색 결과 없음

- 사전 조건: 마리수 1 이상인 종(종 1)
- 사용자 동작: `없는이름` 입력
- Mock response: HTTP 200, `content: []`, `totalElements: 0`,
  `totalPages: 0`, `empty: true`
- 기대 결과: `검색결과가 없습니다` 문구, 빈 상태 문구
  (`등록된 개체가 없습니다`) 아님, 페이지네이션 버튼 없음

## Mock S7 — 페이지네이션 서버 요청

- 사전 조건: 종 2(개체 12마리)로 진입
- Mock response: page=1 요청에 10행 + `totalPages: 2`, `totalElements: 12`,
  page=2 요청에 2행 + `totalPages: 2`
- 사용자 동작: 페이지네이션 `2 페이지` 클릭
- 기대 결과: 목록 GET 쿼리가 `page=2`·`size=10`, 표가 2페이지 응답 2행으로
  교체, `2 페이지` 선택 상태

## Mock S8 — 검색어 변경 시 1페이지 복귀

- 사전 조건: S7 상태(2페이지)
- 사용자 동작: 검색어 입력
- 기대 결과: 검색어가 담긴 목록 GET 쿼리가 `page=1`, 페이지네이션이
  있으면 `1 페이지` 선택 상태

## Mock S9 — 404 종 없음

- Mock response: HTTP 404,
  `{"message":"존재하지 않는 종입니다.","status":404,"timestamp":"2026-09-16T12:00:00","description":"ANIMAL_KIND_NOT_FOUND"}`
- 사전 조건: 종 조회는 정상 응답(목록만 404)
- 기대 결과: `종을 찾을 수 없습니다.` not-found 상태 +
  `목록으로 돌아가기` 링크(`/species`)

## Mock S10 — 서버 오류

- Mock response: HTTP 500,
  `{"message":"내부 서버 오류가 발생했습니다.","status":500,"timestamp":"2026-09-16T12:00:00","description":"내부 서버 오류"}`
- 기대 결과: `role="alert"` 오류 상태에 `개체 목록을 불러오지 못했습니다.
  다시 시도해 주세요.` 표시, 개체 표·`등록된 개체가 없습니다`·
  `검색결과가 없습니다` 문구 없음

## Mock S11 — 인증·권한 오류

- Mock response: HTTP 401 오류 body / HTTP 403 오류 body
- 기대 결과: 각 경우 S10과 같은 오류 상태(성공·빈 목록으로 표시하지 않음)

## Mock S12 — 로딩 상태

- Mock response: 지연된 HTTP 200 기본 목록 응답
  (`individualListDelayMs`)
- 기대 결과: 응답 전 `종 정보를 불러오는 중입니다.` 표시, 응답 후 표 3행

## Mock S13 — 행 클릭 이동(animalManageId)

- 사전 조건: S1 성공 상태
- 사용자 동작: `두리` 행 클릭
- 기대 결과: `/species/1/individuals/3`으로 이동
  (`content[].animalManageId` 사용)

## Mock S14 — 정렬 버튼 제거·sort 미전송

- 사전 조건: S1 성공 상태 후 검색·페이지 이동 1회씩
- 기대 결과: `개체 정렬` 버튼이 없고, 기록된 모든 목록 GET 쿼리에 `sort`
  파라미터가 없음

## Mock S15 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"items":[]}` (`content` 없음)
- 기대 결과: 성공 처리하지 않고 S10과 같은 오류 상태(빈 표로 숨기지 않음)

## Mock S16 — 성별 허용값 밖 응답

- Mock response: HTTP 200, 기본 목록 응답에서 첫 행
  `animalGender: "MALE"`
- 기대 결과: 성공 처리하지 않고 S10과 같은 오류 상태

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
- 승인 Contract의 status·body만 사용(200/401/403/404/500 + 공통 오류 4필드)
- 공통 Axios와 기존 인증 interceptor 사용(Authorization 헤더 확인)
- 조회 실패를 빈 배열·기본 객체로 숨기지 않음
- `page`는 1-base 그대로 전송, 성별은 서버 값 `MAN`/`WOMAN`/`UNKNOWN`
- Staging 실제 서버 테스트는 실행하지 않음
