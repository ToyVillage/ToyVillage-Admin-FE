# API Test Scenarios — animal-manage-create

공통 사전 조건: `accessToken`을 localStorage에 넣고 종 조회(mock 현행)
상태에서 `/species/1/individuals/create`로 진입한다.
`POST **/file`과 `POST **/animal-manage`를 route mock 한다.
실제 서버는 호출하지 않는다.

유효 입력: 개체명 `무궁이`, 성별 `암컷`, 출생연도 `2021`,
기타정보 `온순한 성격`, 사진 파일 1개(`mugung.png`).

업로드 응답: HTTP 200(FILE_CREATE 승인 계약),
`{"fileKey":"animal/mugung.png"}`.
오류 body는 Contract 형식 `{ message, status, timestamp, description }`을
쓴다. 요청 `animalGender` 기대값은 승인된 enum 확정안 기준이다
(아래는 서버 값 `WOMAN` 표기).

## Mock S1 — 생성 성공과 이동

- Mock request: `POST /file` → fileKey 응답, 이어서 `POST /animal-manage`
- Request headers: `Authorization: Bearer …`,
  `Content-Type: application/json`
- Request body:
  `{"animalKindId":1,"animalName":"무궁이","animalGender":"WOMAN","birthYear":2021,"otherInfo":"온순한 성격","fileKey":"animal/mugung.png"}`
- Mock response: HTTP 201, `{"message":"개체 생성 성공"}`
- 사용자 동작: 유효 입력 후 `생성하기`
- 기대 결과: 업로드 1회 → POST 1회, body가 위 6필드와 정확히 일치
  (추가 필드 없음), `/species/1`로 이동, `데이터 생성에 성공했습니다`
  토스트

## Mock S2 — 기타정보 없음은 필드 생략

- 사용자 동작: 기타정보를 비우고 `생성하기`
- 기대 결과: body에 `otherInfo` 키 자체가 없음(빈 문자열·null 미전송),
  201 성공 이동

## Mock S3 — 클라이언트 검증이 요청보다 먼저

- 사용자 동작: 개체명/성별/출생연도/사진을 각각 비운 채 `생성하기`
- 기대 결과: 각 경우 `POST /file`·`POST /animal-manage` 요청 없음,
  해당 카드 아래 인라인 오류(`개체명을 입력해주세요!` 등) 표시,
  첫 오류 필드로 스크롤

## Mock S4 — 기타정보 255자 입력 제한

- 사용자 동작: 기타정보에 255자 초과 텍스트 입력 시도
- 기대 결과: 입력이 255자에서 잘림(maxLength), 카운터·오류 문구 없음,
  제출 body의 `otherInfo` 길이 255

## Mock S5 — 유효하지 않은 요청(400)

- Mock response: `POST /animal-manage` → HTTP 400,
  `{"message":"요청이 유효하지 않습니다.","status":400,"timestamp":"2026-09-16T12:00:00","description":"기타정보는 255자 이하여야 합니다."}`
- 기대 결과: 화면 유지, 입력값 보존,
  `생성하지 못했습니다. 다시 시도해 주세요.` 표시, 재제출 시 업로드·POST
  재시도

## Mock S6 — 종/파일 없음(404)

- Mock response: HTTP 404, `message: "존재하지 않는 종입니다."` 오류 body
- 기대 결과: S5와 같은 실패 처리(자동 이동 없음)

## Mock S7 — 인증 오류(401)

- Mock response: HTTP 401 오류 body
- 기대 결과: S5와 같은 실패 처리

## Mock S8 — 권한 없음(403)

- Mock response: HTTP 403 오류 body
- 기대 결과: S5와 같은 실패 처리

## Mock S9 — 서버 오류(500)

- Mock response: HTTP 500 오류 body
- 기대 결과: S5와 같은 실패 처리

## Mock S10 — 파일 업로드 실패

- Mock request: `POST /file` → HTTP 500 오류 body
- 기대 결과: `POST /animal-manage` 요청 없음, 생성 실패 문구 표시,
  화면·입력값 유지

## Mock S11 — 중복 제출 방지

- Mock response: 지연된 HTTP 201 성공 body
- 사용자 동작: `생성하기` 연속 클릭
- 기대 결과: 업로드·POST 각 1회, 대기 중 버튼 라벨 `생성 중`·비활성,
  응답 후 이동

## Mock S12 — 승인되지 않은 성공 status 거부

- Mock response: HTTP 200, `{"message":"개체 생성 성공"}`
- 기대 결과: 성공 처리하지 않고 실패 문구, 이동 없음

## Mock S13 — Contract 응답 형식 위반

- Mock response: HTTP 201, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않고 실패 문구, 화면 유지

## Mock S14 — 성공 후 목록 캐시 갱신

- 사전 조건: 개체 목록 route mock(`animal-manage-query-all` 계약) 활성
- 사용자 동작: 생성 성공 후 종 상세 도착
- 기대 결과: 개체 목록 GET 재요청, 새 개체가 포함된 응답이 표에 반영

## Mock S15 — 작성 중 이탈 방지 유지

- 사용자 동작: 개체명 입력 후 뒤로가기 클릭
- 기대 결과: 이탈 확인 다이얼로그 표시, 취소 시 화면·입력 유지,
  업로드·POST 요청 없음

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
- 승인 Contract 밖의 request/response 필드 없음
- 공통 Axios와 기존 인증 interceptor 사용
- 실패를 성공이나 localStorage mock 저장으로 숨기지 않음
  (`toyvillage:individuals` 미기록 확인)
- 사진 fileKey는 승인된 `FILE_CREATE` 응답만 사용
- Staging 실제 서버 테스트는 실행하지 않음
