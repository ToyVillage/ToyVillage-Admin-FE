# API Test Scenarios — task-create

공통 사전 조건: `accessToken`을 localStorage에 넣고 `GET **/team/tree`를
기본 트리 응답으로 mock 한 뒤 `/tasks/create`로 진입한다. 실제 서버는
호출하지 않는다.

기본 트리 응답(담당자 선택용)

```json
{
  "totalMemberCount": 2,
  "teams": [
    {
      "id": 1, "name": "동물 관리팀", "memberCount": 2,
      "members": [
        { "id": 3, "name": "이승현", "position": "사원" },
        { "id": 4, "name": "홍길동", "position": "과장" }
      ]
    }
  ],
  "unassigned": { "id": null, "name": "미배정", "memberCount": 0, "members": [] }
}
```

유효 입력: 우선순위 `상`, 완료기한 `2026-09-05`, 제목 `9월 정기 안전점검`,
내용 `놀이기구 전수 점검 후 체크리스트를 제출해주세요.`, 담당자 `이승현`.

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 생성 성공과 이동

- 목적: 유효 입력으로 POST를 한 번 보내고 목록으로 이동한다.
- Mock request: `POST /api/tasks`
- Request headers: `Authorization: Bearer …`,
  `Content-Type: application/json`
- Request body:
  `{"title":"9월 정기 안전점검","content":"놀이기구 전수 점검 후 체크리스트를 제출해주세요.","assigneeIds":[3],"finishDate":"2026-09-05","priority":"HIGH","files":[]}`
- Mock response: HTTP 201, `{"message":"업무지시가 등록되었습니다."}`
- 사용자 동작: 입력 후 `생성하기`
- 기대 결과: POST 정확히 1회, body가 위 6필드와 정확히 일치(추가 필드 없음),
  `/tasks`로 이동, `데이터 생성에 성공했습니다` 토스트

## Mock S2 — 담당자 여러 명

- 사용자 동작: `동물 관리팀` 체크박스로 전원 선택
- 기대 결과: body `assigneeIds: [3, 4]` (트리 표시 순서), 숫자 배열로 전송

## Mock S3 — 첨부파일 업로드 후 fileKey 전달

- Mock request: `POST /api/file` ×2 → 각각
  `{"fileKey":"2026/08/24/a_a1b2c3.pdf"}`, `{"fileKey":"2026/08/24/b_d4e5f6.png"}`,
  이어서 `POST /api/tasks`
- 사용자 동작: 파일 2개 첨부 후 `생성하기`
- 기대 결과: 업로드 2회 후 POST 1회, body `files`가 두 fileKey를 첨부 순서로
  포함

## Mock S4 — 첨부 없음

- 사용자 동작: 첨부 없이 `생성하기`
- 기대 결과: `POST /api/file` 요청 없음, body `files: []`

## Mock S5 — 클라이언트 검증이 요청보다 먼저

- 사용자 동작: 우선순위만 비운 채 `생성하기` → 이어서 완료기한, 제목,
  내용, 담당자를 각각 비운 경우
- 기대 결과: 각 경우 POST 요청 없음, 검증 다이얼로그 문구가
  `우선순위를 선택해주세요` → `완료기한을 선택해주세요` →
  `제목을 입력해주세요` → `상세 업무 내용을 입력해주세요` →
  `담당자를 선택해주세요` 순서로 나타남, 확인 시 해당 입력으로 초점 복귀

## Mock S6 — 유효하지 않은 요청

- Mock response: HTTP 400 오류 body
- 기대 결과: `/tasks/create` 유지, 입력값 보존,
  `생성하지 못했습니다. 다시 시도해 주세요.` 표시, 재제출 시 POST 2회째 전송,
  localStorage에 업무가 저장되지 않음

## Mock S7 — 인증 오류

- Mock response: HTTP 401 오류 body
- 기대 결과: S6과 같은 실패 처리, 자동 이동 없음

## Mock S8 — 권한 없음

- Mock response: HTTP 403, `message: ""` 포함 오류 body
- 기대 결과: S6과 같은 실패 처리

## Mock S9 — 서버 오류

- Mock response: HTTP 500 오류 body
- 기대 결과: S6과 같은 실패 처리

## Mock S10 — 파일 업로드 실패

- Mock request: `POST /api/file` → HTTP 500 오류 body
- 기대 결과: `POST /api/tasks` 요청 없음, 생성 실패 문구 표시,
  화면과 입력값 유지

## Mock S11 — 중복 제출 방지

- Mock response: 지연된 HTTP 201 성공 body
- 사용자 동작: `생성하기` 연속 클릭
- 기대 결과: POST 1회, 대기 중 버튼 라벨 `생성 중`·비활성,
  응답 후 `/tasks` 이동

## Mock S12 — Contract 응답 형식 위반

- Mock response: HTTP 201, `{"result":"ok"}`
- 기대 결과: 성공 처리하지 않고 생성 실패 문구, 화면 유지

## Mock S13 — 승인되지 않은 성공 Status 거부

- Mock response: HTTP 200, `{"message":"업무지시가 등록되었습니다."}`
- 기대 결과: 성공 처리하지 않고 생성 실패 문구, 이동 없음

## Mock S14 — 성공 후 목록 캐시 무효화

- 사용자 동작: 생성 성공 후 목록 도착
- 기대 결과: `GET /api/tasks` 재요청 1회, 새 목록 응답이 표에 반영

## Mock S15 — 작성 중 이탈 방지 유지

- 사용자 동작: 제목 입력 후 뒤로가기 링크 클릭
- 기대 결과: 이탈 확인 다이얼로그 표시, `취소` 시 화면 유지,
  POST 요청 없음

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
- 공통 Axios와 기존 인증 interceptor 사용
- 실패를 성공이나 localStorage mock 저장으로 숨기지 않음
- 첨부 fileKey는 승인된 `FILE_CREATE` 응답만 사용
- Staging 실제 서버 테스트는 실행하지 않음
