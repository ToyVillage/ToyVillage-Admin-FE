# API Test Scenarios — task-query

공통 사전 조건: `accessToken`을 localStorage에 넣고 `page.route()`로
`GET **/tasks/12`를 mock 한 뒤 `/tasks/12`로 진입한다. 실제 서버는 호출하지
않는다. 업무보고·진행도 카드는 같은 응답의 `reports`·`progress`를 쓴다.

기본 성공 body

```json
{
  "id": 12,
  "title": "9월 정기 안전점검",
  "content": "놀이기구 전수 점검 후 체크리스트를 제출해주세요.",
  "assignees": [
    { "id": 3, "name": "이승현", "position": "사원" },
    { "id": 4, "name": "홍길동", "position": "과장" },
    { "id": 6, "name": "배준영", "position": null }
  ],
  "assigneeCount": 3,
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "finishDate": "2026-09-05",
  "createdAt": "2026-08-28T10:15:30",
  "files": [
    { "fileName": "당일 지침.pdf", "fileKey": "2026/08/28/guide_a1b2c3.pdf" }
  ],
  "reports": [],
  "progress": { "total": 3, "approved": 0, "rejected": 0, "pending": 3, "missing": 0 }
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 상세 진입과 표시

- 목적: 진입 시 해당 id로 한 번 조회하고 응답 값을 화면에 표시한다.
- Mock request: `GET /api/tasks/12`
- Request headers: `Authorization: Bearer …`
- Request query/body: 없음
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/tasks/12` 진입
- 기대 결과: GET 정확히 1회, 담당자 `이승현 외 2명`, 상태 `진행중`,
  우선순위 `상`, 완료기한 `2026-09-05`, 제목·본문 표시,
  첨부 `당일 지침.pdf` 표시

## Mock S2 — 담당자 1명이면 외 N명 없음

- Mock response: `assignees` 1건, `assigneeCount: 1`
- 기대 결과: 담당자 셀에 이름만, `외 0명`을 렌더하지 않음

## Mock S3 — 첨부 없음

- Mock response: `files: []`
- 기대 결과: 첨부자료 목록을 렌더하지 않음

## Mock S4 — 완료·지연 상태 표시

- Mock response: `status: "COMPLETED"` / `status: "EXPIRED"`
- 기대 결과: 상태 pill이 각각 `완료` / `지연`

## Mock S5 — 로딩 상태

- Mock response: 지연된 HTTP 200 성공 body
- 기대 결과: 응답 전 `업무를 불러오는 중입니다.`, 응답 후 상세 표시

## Mock S6 — 존재하지 않는 업무

- Mock response: HTTP 404, `존재하지 않는 업무 지시입니다.`
- 기대 결과: `업무를 찾을 수 없습니다.` + `목록으로 돌아가기` 링크,
  자동 이동 없음, mock 데이터로 대체하지 않음

## Mock S7 — 권한 없음

- Mock response: HTTP 403, `message: ""` 포함 오류 body
- 기대 결과: 404와 같은 오류 화면

## Mock S8 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: 오류 화면 표시

## Mock S9 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: 오류 화면 표시

## Mock S10 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{ "id": 12, "title": "제목" }` (필수 필드 누락)
- 기대 결과: 성공 처리하지 않고 오류 화면

## Mock S11 — 허용값 밖의 status

- Mock response: HTTP 200, `status: "DONE"`
- 기대 결과: 성공 처리하지 않고 오류 화면

## Mock S12 — 수정 화면 초기값

- Mock request: `GET /api/tasks/12` (수정 화면 진입)
- 사용자 동작: `/tasks/12/edit` 직접 진입
- 기대 결과: 제목·내용·우선순위·완료기한이 응답 값으로 채워지고,
  담당자 트리에서 `assignees[].id`(3·4·6)에 해당하는 직원만 체크됨,
  첨부 목록에 `당일 지침.pdf` 표시

## Mock S13 — 상세 → 수정 캐시 재사용

- 사용자 동작: `/tasks/12` 진입 → 케밥 `수정`
- 기대 결과: 같은 query key(`['tasks','12']`) 재사용으로 추가 GET 없음,
  수정 화면이 곧바로 값이 채워진 상태로 표시

## Mock S14 — 삭제 후 상세 캐시 제거

- Mock request: `DELETE /api/tasks/12` → 200 `{ "message": "..." }`
- 사용자 동작: 상세에서 케밥 `삭제` → 다이얼로그 `확인`
- 기대 결과: `/tasks`로 이동, 삭제 성공 토스트, 상세로 되돌아오면 GET 재요청

## Mock S15 — 담당자별 보고 현황 표시 (2026-09-11 추가)

- 목적: `reports[]`가 담당자 전원이고 미제출 줄도 그려진다.
- Mock response: HTTP 200, `reports` 4건
  (`APPROVED` 31 · `REJECTED` 33 · `PENDING` 34 · `MISSING` null)
- 사용자 동작: `/tasks/12` 진입
- 기대 결과: 줄 4개, 배지가 `승인`·`반려`·`심사대기`·`심사대기`
  (`MISSING` 도 `심사대기` 로 표시한다). 누를 수 있는 줄은 3개이고, 첫 줄을
  누르면 `/task-reports/31` 로 이동한다. `workReportId` 가 null 인 줄은
  버튼이 아니다.

## Mock S16 — 진행도는 서버 집계를 쓰고 미제출을 심사대기에 합산 (2026-09-11 추가)

- 목적: 클라이언트가 `reports`로 다시 세지 않고, 미제출을 심사대기에 합산한다.
- Mock response: HTTP 200, `reports` 4건에 대해 `progress` 를 일부러 다르게
  (`{ total: 9, approved: 5, rejected: 2, pending: 1, missing: 1 }`) 내려준다.
- 기대 결과: 요약 문구가 `전체 9 · 승인 5 · 반려 2 · 심사대기 2` 이다
  (`심사대기` 만 `pending + missing`, 나머지는 응답 값 그대로).

## Mock S17 — 허용값 밖의 보고 상태 (2026-09-11 추가)

- 목적: 모르는 심사 상태를 성공으로 처리하지 않는다.
- Mock response: HTTP 200, `reports[0].status = "RESUBMITTED"`
- 기대 결과: 성공 처리하지 않고 `업무를 찾을 수 없습니다.` 오류 화면
  (빈 배지를 그리지 않는다)

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
- `reports`·`progress`는 같은 응답에서 업무보고·진행도 카드에 연결됨
  (추가 요청 없음). 허용값 밖의 `reports[].status`는 오류로 처리
- 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock 상세로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
