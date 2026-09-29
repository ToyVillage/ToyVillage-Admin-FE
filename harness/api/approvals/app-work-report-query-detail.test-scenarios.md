# API Test Scenarios — app-work-report-query-detail

공통 사전 조건: `accessToken`을 localStorage에 넣는다.
`GET /work-report/detail/{id}`는 `page.route()`로 가로챈다.
조회 오류는 공통 QueryClient `retry: 1`로 한 번 더 요청한 뒤 오류 화면이 뜬다.
오류 시나리오의 요청 횟수는 2회까지 허용한다.

기본 성공 body

```json
{
  "id": 32,
  "title": "9월 정기 안전점검",
  "priority": "HIGH",
  "finishDate": "2026-09-05",
  "taskId": 12,
  "name": "이승현",
  "content": "동물 우리 청소와 소독을 완료했습니다.",
  "note": "사료 보관함 추가 점검이 필요합니다.",
  "files": [
    { "fileName": "당일 지침.pdf", "fileKey": "work-report/2026/09/guide.pdf" },
    { "fileName": "휴관안내.png", "fileKey": "work-report/2026/09/notice.png" }
  ],
  "status": "PENDING",
  "rejectionReason": null
}
```

## Mock S1 — 진입 요청과 상세 표시

- 목적: route id로 한 번 조회하고 서버 값을 상세 요소에 그린다.
- Mock request: `GET /work-report/detail/32`
- Request headers: `Authorization: Bearer …`
- Request query/body: 없음
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/task-reports/32` 진입
- 기대 결과: 요청 1회. 요약행에 우선순위 `상`, 심사 배지 `심사대기`, 담당자 `이승현`, 완료기한 `2026-09-05`. 내용 카드 제목 `9월 정기 안전점검`, 본문 내용. 첨부자료 `당일 지침.pdf`, `휴관안내.png`. `note`·`fileKey`·`taskId`는 화면에 없음

## Mock S2 — 첨부 파일 없음

- Mock response: 기본 body에 `files: []`
- 기대 결과: 상세 정상 표시, 첨부자료 카드는 기존 빈 첨부 상태

## Mock S3 — 반려된 보고

- Mock response: 기본 body에 `status: "REJECTED"`, `rejectionReason: "근거 자료가 빠졌습니다."`
- 기대 결과: 심사 배지 `반려`, 사유는 화면에 표시하지 않음, 하단 버튼 유지

## Mock S4 — 완료된 보고 배지

- Mock response: 기본 body에 `status: "APPROVED"`
- 기대 결과: 심사 배지 `완료`

## Mock S5 — 존재하지 않는 보고

- Mock request: `GET /work-report/detail/999`
- Mock response: HTTP 404 Contract 오류 body
- 기대 결과: `업무보고를 찾을 수 없습니다.`와 `목록으로 돌아가기` 링크, 자동 이동 없음

## Mock S6 — 인증 오류

- 사전 조건: `refreshToken` 없음
- Mock response: HTTP 401 Contract 오류 body
- 기대 결과: 공통 세션 처리(`app-auth-reissue` 승인 시나리오 S6)에 따라 재발급 요청 없이 `/login`으로 이동, 상세 내용 없음

## Mock S7 — 서버 오류

- Mock response: HTTP 500 Contract 오류 body
- 기대 결과: S5와 같은 오류 화면

## Mock S8 — 응답 형식 위반

- Mock response: HTTP 200, 기본 body에서 `title` 누락
- 기대 결과: 오류 화면
- 추가: `status: "MISSING"`(허용값 밖) → 오류 화면

## Mock S9 — 쓰지 않는 필드의 null은 허용

- Mock response: 기본 body에 `note: null`
- 기대 결과: 상세 정상 표시(검증 대상이 아님)

## Mock S10 — 정수가 아닌 route id

- 사용자 동작: `/task-reports/r1` 진입
- 기대 결과: `/work-report/detail/*` 요청 0회, 오류 화면

## Mock S11 — 로딩 상태

- Mock response: 1초 지연
- 기대 결과: 응답 전 `업무보고를 불러오는 중입니다.`, 응답 후 상세 표시

## Mock S12 — 업무 상세의 보고 줄에서 보고 상세로 이동

- 사전 조건: `GET /tasks/12`를 `TASK_QUERY` 승인 Contract 형태로 mock, `reports`
  `[{31, APPROVED}, {33, REJECTED}, {34, PENDING}, {null, MISSING}]`
- 사용자 동작: `/tasks/12` 진입 → 첫 보고 줄 클릭
- 기대 결과: 누를 수 있는 줄 3개(`workReportId` null 줄은 버튼 아님), 클릭 시 `/task-reports/31`로 이동하고 `GET /work-report/detail/31` 요청

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
- 조회는 공통 Axios와 기존 인증 interceptor 사용
- 오류 시 localStorage mock 상세로 fallback하지 않음
- loading/error/success 상태가 숨겨지지 않음
- Staging 실제 서버 테스트는 실행하지 않음
