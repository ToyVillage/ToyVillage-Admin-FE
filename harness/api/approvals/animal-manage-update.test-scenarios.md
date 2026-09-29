# API Test Scenarios — animal-manage-update

공통 사전 조건: `accessToken`을 localStorage에 넣고
`GET **/animal-manage/12`를 기본 상세 응답(animal-manage-query 시나리오
공용 — 이름 `무궁이`, 성별 `WOMAN`, 출생연도 2021, 기타정보
`온순한 성격`, fileKey `animal/mugung.png`, animalKindId 1)으로 mock 한
뒤 `/species/1/individuals/12/edit`로 진입한다. `PATCH
**/animal-manage/12`와 필요 시 `POST **/file`을 route mock 한다.
실제 서버는 호출하지 않는다.

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을
쓴다. `animalGender` 기대값은 승인된 enum 확정안 기준(서버 값 표기).

## Mock S1 — 수정 성공(사진 유지, 전 필드 재전송)

- 사용자 동작: 개체명을 `무궁이2`로 바꾸고 `저장하기`
- Mock request: `PATCH /animal-manage/12`
- Request headers: `Authorization: Bearer …`,
  `Content-Type: application/json`
- Request body:
  `{"animalKindId":1,"animalName":"무궁이2","animalGender":"WOMAN","birthYear":2021,"otherInfo":"온순한 성격","fileKey":"animal/mugung.png"}`
- Mock response: HTTP 200, `{"message":"개체 수정 성공"}`
- 기대 결과: `POST /file` 요청 없음, PATCH 1회, body가 위 6필드 전부를
  포함(바꾸지 않은 필드도 재전송, 추가 필드 없음, 기존 fileKey 유지),
  `/species/1/individuals/12`로 이동(수정 성공 토스트 없음)

## Mock S2 — 사진 교체 시 업로드 후 새 fileKey

- Mock request: `POST /file` → `{"fileKey":"animal/new_abc123.png"}`,
  이어서 `PATCH /animal-manage/12`
- 사용자 동작: 사진을 새 파일로 교체하고 `저장하기`
- 기대 결과: 업로드 1회 → PATCH 1회, body `fileKey`가
  `animal/new_abc123.png`

## Mock S3 — 기타정보 비우면 필드 생략

- 사용자 동작: 기타정보를 모두 지우고 `저장하기`
- 기대 결과: body에 `otherInfo` 키 없음(빈 문자열·null 미전송), 200
  성공 이동

## Mock S4 — 클라이언트 검증이 요청보다 먼저

- 사용자 동작: 개체명(또는 출생연도)을 비운 채 `저장하기`
- 기대 결과: PATCH·업로드 요청 없음, 인라인 오류 문구 표시, 화면 유지

## Mock S5 — 기타정보 255자 입력 제한

- 사용자 동작: 기타정보에 255자 초과 입력 시도
- 기대 결과: 255자에서 잘림, 카운터·오류 문구 없음

## Mock S6 — 유효하지 않은 요청(400)

- Mock response: HTTP 400,
  `{"message":"요청이 유효하지 않습니다.","status":400,"timestamp":"2026-09-16T12:00:00","description":"기타정보는 255자 이하여야 합니다."}`
- 기대 결과: 수정 화면 유지, 입력값 보존,
  `저장하지 못했습니다. 다시 시도해 주세요.` 표시, 재제출 시 PATCH 재시도

## Mock S7 — 404 3종(개체/종/파일 없음)

- Mock response: HTTP 404, `message`가
  `존재하지 않는 개체입니다.`/`존재하지 않는 종입니다.`/
  `파일을 찾을 수 없습니다.` 인 오류 body 각각
- 기대 결과: 각 경우 S6과 같은 실패 처리(자동 이동 없음)

## Mock S8 — 인증·권한 오류(401/403)

- Mock response: HTTP 401 오류 body / HTTP 403 오류 body
- 기대 결과: 각 경우 S6과 같은 실패 처리

## Mock S9 — 서버 오류(500)

- Mock response: HTTP 500 오류 body
- 기대 결과: S6과 같은 실패 처리

## Mock S10 — 사진 교체 업로드 실패

- Mock request: `POST /file` → HTTP 500 오류 body
- 기대 결과: PATCH 요청 없음, 실패 문구 표시, 화면·입력 유지

## Mock S11 — 중복 제출 방지

- Mock response: 지연된 HTTP 200 성공 body
- 사용자 동작: `저장하기` 연속 클릭
- 기대 결과: PATCH 1회, 대기 중 버튼 `저장 중`·비활성, 응답 후 이동

## Mock S12 — 승인되지 않은 성공 status 거부

- Mock response: HTTP 201, `{"message":"개체 수정 성공"}`
- 기대 결과: 성공 처리하지 않고 실패 문구, 이동 없음

## Mock S13 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않고 실패 문구, 화면 유지

## Mock S14 — 성공 후 상세 캐시 갱신

- 사용자 동작: S1 수정 성공 후 개체 상세 도착
- 기대 결과: `GET /animal-manage/12` 재요청(무효화에 의한 refetch),
  상세 카드에 `무궁이2` 표시

## Mock S15 — 작성 중 이탈 방지 유지

- 사용자 동작: 개체명 수정 후 뒤로가기 클릭
- 기대 결과: 이탈 확인 다이얼로그 표시, 취소 시 화면·입력 유지,
  PATCH 요청 없음

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
- 승인 Contract 밖의 request/response 필드 없음(전 필드 재전송 검증 포함)
- 공통 Axios와 기존 인증 interceptor 사용
- 실패를 성공이나 localStorage 저장으로 숨기지 않음
- 사진 교체 fileKey는 승인된 `FILE_CREATE` 응답만, 유지 시 기존 fileKey
- Staging 실제 서버 테스트는 실행하지 않음
