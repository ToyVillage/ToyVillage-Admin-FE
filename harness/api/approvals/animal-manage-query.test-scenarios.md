# API Test Scenarios — animal-manage-query

공통 사전 조건: `accessToken`을 localStorage에 넣고
`GET **/animal-manage/{animalManageId}`를 route mock 한 뒤
`/species/1/individuals/12`로 진입한다(수정 초기값 시나리오는
`/species/1/individuals/12/edit`). 종 조회는 현행 mock 상태를 유지한다.
실제 서버는 호출하지 않는다.

기본 상세 응답(성공 200 — Contract 필드 전체):

```json
{
  "animalManageId": 12,
  "animalName": "무궁이",
  "animalGender": "WOMAN",
  "birthYear": 2021,
  "otherInfo": "온순한 성격",
  "animalImage": { "fileName": "mugung.png", "fileKey": "animal/mugung.png" },
  "animalKindId": 1,
  "kindName": "사막여우",
  "scientificName": "Vulpes zerda",
  "animalTaxonomic": "MAMMALS",
  "detailKind": "식육목 - 개과",
  "legalStatuses": ["멸종위기 야생생물 II급"]
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 상세 조회 성공(프로필 카드)

- Mock request: `GET /animal-manage/12`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200, 기본 상세 응답
- 사용자 동작: 개체 상세 진입
- 기대 결과: GET 1회, 프로필 카드에 이름 `무궁이`, 성별 뱃지 `암컷`,
  출생연도 `2021년`, 기타정보 `온순한 성격`, 사진 `src`가
  `storedFileUrl('animal/mugung.png')` 결과(`VITE_FILE_BASE_URL` 결합)

## Mock S2 — 기타정보 없음은 `—`

- Mock response: HTTP 200, `otherInfo: ""` 외 기본 상세 응답
- 기대 결과: 기타정보 자리에 `—` 표시

## Mock S3 — 로딩 문구

- Mock response: 지연된 HTTP 200 기본 상세 응답
- 기대 결과: 응답 전 `개체를 불러오는 중입니다.` 표시, 응답 후 카드 표시

## Mock S4 — 404 개체 없음

- Mock response: HTTP 404,
  `{"message":"존재하지 않는 개체입니다.","status":404,"timestamp":"2026-09-16T12:00:00","description":"ANIMAL_MANAGE_NOT_FOUND"}`
- 기대 결과: `개체를 찾을 수 없습니다.` not-found 상태 +
  `종 상세로 돌아가기` 링크

## Mock S5 — 다른 종 소속 개체

- Mock response: HTTP 200, `animalKindId: 2` 외 기본 상세 응답
  (URL은 `/species/1/...`)
- 기대 결과: not-found 상태(기존 교차 검사 유지)

## Mock S6 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: 오류 상태 표시(not-found 문구로 뭉개지 않음), 성공 UI 없음

## Mock S7 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: S6과 같은 오류 상태 처리

## Mock S8 — 수정 화면 초기값

- 사용자 동작: `/species/1/individuals/12/edit` 진입
- Mock response: HTTP 200, 기본 상세 응답
- 기대 결과: 폼 초기값 — 개체명 `무궁이`, 성별 `암컷` 선택, 출생연도
  `2021`, 기타정보 `온순한 성격`, 사진 미리보기 표시(기존 파일명 유지)

## Mock S9 — 상세 진입 시 케밥 이동 유지

- 사전 조건: S1 성공 상태
- 사용자 동작: 케밥 `수정` 선택
- 기대 결과: `/species/1/individuals/12/edit`로 이동(추가 상세 재요청
  없이 캐시 재사용이면 GET 총 1회)

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"animalManageId":12}` (필수 필드 누락)
- 기대 결과: 성공 처리하지 않고 오류 상태 표시

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
- 승인 Contract의 status·body만 사용(200/401/404/500)
- 공통 Axios와 기존 인증 interceptor 사용
- 실패를 성공·기본 객체로 숨기지 않음
- 사진 URL은 `storedFileUrl(fileKey)`(develop의 PR #100 헬퍼) 결과만 사용
- Staging 실제 서버 테스트는 실행하지 않음
