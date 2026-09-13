# API Test Scenarios — task-update

공통 사전 조건: `accessToken`을 localStorage에 넣고 다음 두 조회를
`page.route()`로 mock 한 뒤 `/tasks/12/edit`으로 진입한다. 실제 서버는
호출하지 않는다.

- `GET **/tasks/12` — 상세(초기값)

```json
{
  "id": 12,
  "title": "9월 정기 안전점검",
  "content": "놀이기구 전수 점검 후 체크리스트를 제출해주세요.",
  "assignees": [{ "id": 3, "name": "이승현", "position": "사원" }],
  "assigneeCount": 1,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "finishDate": "2026-09-05",
  "createdAt": "2026-08-28T10:15:30",
  "files": [
    { "fileName": "당일 지침.pdf", "fileKey": "2026/08/28/guide_a1b2c3.pdf" }
  ],
  "reports": [],
  "progress": { "total": 1, "approved": 0, "rejected": 0, "pending": 1, "missing": 0 }
}
```

- `GET **/team/tree` — 담당자 트리(`이승현` id 3, `홍길동` id 4의 동물 관리팀,
  미배정 0명)

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 수정 성공과 이동

- 목적: 유효 입력으로 해당 id에 PUT을 한 번 보내고 상세로 이동한다.
- Mock request: `PUT /api/tasks/12`
- Request headers: `Authorization: Bearer …`,
  `Content-Type: application/json`
- Request body:
  `{"title":"9월 정기 안전점검(수정)","content":"놀이기구 전수 점검 후 체크리스트를 제출해주세요.","assigneeIds":[3],"finishDate":"2026-09-05","priority":"HIGH","files":["2026/08/28/guide_a1b2c3.pdf"]}`
- Mock response: HTTP 200, `{"message":"업무지시가 수정되었습니다."}`
- 사용자 동작: 제목만 고치고 `저장하기`
- 기대 결과: PUT 정확히 1회, body가 위 6필드와 정확히 일치(추가 필드 없음),
  기존 첨부의 fileKey가 그대로 재전송됨, `/tasks/12`로 이동,
  별도 성공 토스트 없음

## Mock S2 — 담당자 전체 교체

- 사용자 동작: `이승현` 해제 → `홍길동` 선택 → `저장하기`
- 기대 결과: body `assigneeIds: [4]`. 기존 담당자가 자동으로 유지되지 않음
  (전체 교체)

## Mock S3 — 담당자 추가

- 사용자 동작: `홍길동` 추가 선택 → `저장하기`
- 기대 결과: body `assigneeIds: [3, 4]` (트리 표시 순서)

## Mock S4 — 새 첨부 업로드 후 fileKey 합치기

- Mock request: `POST /api/file` → `{"fileKey":"2026/09/05/new_x9y8z7.png"}`,
  이어서 `PUT /api/tasks/12`
- 사용자 동작: 파일 1개 추가 첨부 후 `저장하기`
- 기대 결과: 업로드 1회, body `files`가
  `["2026/08/28/guide_a1b2c3.pdf","2026/09/05/new_x9y8z7.png"]` 순서로 전달

## Mock S5 — 첨부 전체 삭제

- 사용자 동작: 기존 첨부 `당일 지침.pdf` 제거 후 `저장하기`
- 기대 결과: `POST /api/file` 요청 없음, body `files: []`,
  `files: null`을 보내지 않음

## Mock S6 — 클라이언트 검증이 요청보다 먼저

- 사용자 동작: 제목을 지우고 `저장하기`, 이어서 내용·담당자를 비운 경우
- 기대 결과: 각 경우 PUT 요청 없음, 검증 다이얼로그 문구가 검증 순서
  (우선순위 → 완료기한 → 제목 → 상세 업무 내용 → 담당자)를 따름

## Mock S7 — 유효하지 않은 요청

- Mock response: HTTP 400 오류 body
- 기대 결과: `/tasks/12/edit` 유지, 사용자가 고친 입력값 보존,
  `저장하지 못했습니다. 다시 시도해 주세요.` 표시, 재제출 시 PUT 2회째 전송

## Mock S8 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: S7과 같은 실패 처리, 자동 이동 없음

## Mock S9 — 권한 없음

- Mock response: HTTP 403, `message: ""` 포함 오류 body
- 기대 결과: S7과 같은 실패 처리

## Mock S10 — 존재하지 않는 업무

- Mock response: HTTP 404, `존재하지 않는 업무 지시입니다.`
- 기대 결과: 저장 성공으로 처리하지 않고 실패 문구, 화면 유지

## Mock S11 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: S7과 같은 실패 처리

## Mock S12 — 파일 업로드 실패

- Mock request: `POST /api/file` → HTTP 500 오류 body
- 기대 결과: `PUT /api/tasks/12` 요청 없음, 저장 실패 문구, 화면 유지

## Mock S13 — 중복 제출 방지

- Mock response: 지연된 HTTP 200 성공 body
- 사용자 동작: `저장하기` 연속 클릭
- 기대 결과: PUT 1회, 대기 중 버튼 라벨 `저장 중`·비활성,
  응답 후 `/tasks/12` 이동

## Mock S14 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않고 저장 실패 문구

## Mock S15 — 승인되지 않은 성공 Status 거부

- Mock response: HTTP 201, `{"message":"업무지시가 수정되었습니다."}`
- 기대 결과: 성공 처리하지 않고 저장 실패 문구

## Mock S16 — 성공 후 캐시 갱신

- 사용자 동작: 저장 성공 후 상세 도착
- 기대 결과: 상세가 재조회되고(`['tasks']` 무효화로 한 번, 상세 화면 진입으로
  한 번) 수정된 값이 표시되며 이전 값이 남지 않음.
  목록으로 이동하면 `GET /api/tasks` 재요청

## Mock S17 — 작성 중 이탈 방지 유지

- 사용자 동작: 제목을 고친 뒤 뒤로가기 링크 클릭
- 기대 결과: 이탈 확인 다이얼로그 표시, `취소` 시 화면 유지, PUT 요청 없음

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
- `files`에 `null`을 보내지 않음
- 공통 Axios와 기존 인증 interceptor 사용
- 실패를 성공이나 localStorage mock 저장으로 숨기지 않음
- Staging 실제 서버 테스트는 실행하지 않음
