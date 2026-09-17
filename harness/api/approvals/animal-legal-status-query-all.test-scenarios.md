# API Test Scenarios — animal-legal-status-query-all

공통 사전 조건: `accessToken`을 localStorage에 넣고 `GET **/animal-manage/legal-status`와
필요한 종 API를 `page.route()`로 mock 한다(`tests/e2e/support/animal-manage-api.ts`).
기본 성공 body:

```json
[
  { "animalLegalStatusId": 1, "kind": "천연기념물" },
  { "animalLegalStatusId": 5, "kind": "국제보호종" }
]
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 등록 화면 선택지 순서

- 사용자 동작: `/species/create` 진입
- 기대 결과: GET 1회. pill 순서 `지정관리 야생동물`·`멸종위기 야생생물 I급`·`천연기념물`
  (✕ 없음) → `국제보호종`(✕ 있음) → `+ 법정분류 추가`. `천연기념물`은 한 번만 보인다

## Mock S2 — 빈 목록

- Mock response: HTTP 200 `[]`
- 기대 결과: 기본 3개와 추가 버튼만 보인다, 오류 행 없음

## Mock S3 — 수정 화면 복원

- 사전 조건: 종 상세 mock `legalStatuses: [{ animalLegalStatusId: 1, kind: "천연기념물" }, { animalLegalStatusId: 5, kind: "국제보호종" }, { animalLegalStatusId: null, kind: "삭제된분류" }]`, 목록 GET에는 `삭제된분류` 없음
- 사용자 동작: `/species/1/edit` 진입
- 기대 결과: 세 pill(`삭제된분류` 포함)이 선택 상태, 나머지는 미선택. 그대로 저장하면 `POST /animal-manage/legal-status` `{ kind: "삭제된분류" }` 후 목록 재조회, PATCH `animalLegalDesignation`에 새 id 포함

## Mock S4 — 저장 시 이름을 id로 변환

- 사용자 동작: 등록 화면에서 필수값 입력, `국제보호종`·`천연기념물` 선택 → 저장
- 기대 결과: 종 생성 POST body `animalLegalDesignation`이 화면 순서의 id `[1, 5]`

## Mock S5 — 조회 실패(500)

- Mock response: HTTP 500
- 기대 결과: 필드에 `법정지정분류를 불러오지 못했습니다. 다시 시도해 주세요.`, 저장 버튼
  비활성, 종 생성 요청 없음

## Mock S6 — 인증·권한 오류(401/403)

- Mock response: HTTP 403
- 기대 결과: S5와 같은 실패 표시

## Mock S7 — 응답 형식 위반

- Mock response: HTTP 200 `{ "items": [] }`
- 기대 결과: S5와 같은 실패 표시

## Mock S8 — 캐시 갱신

- 사용자 동작: 법정분류 추가 성공(create mock) 또는 ✕ 삭제 성공(delete mock)
- 기대 결과: 각 성공 직후 목록 GET 재요청

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
