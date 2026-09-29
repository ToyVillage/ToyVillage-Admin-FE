# Implementation Plan — app-work-report-reject

## 승인 기준

- `PATCH /work-report/reject/{workReportId}`, Authorization Bearer required, roles `ADMIN`
- Path `workReportId` required, 양의 정수. Query 없음
- Body required `{ rejectionReason: string }` — required, non-null, 1000자 이하
- 성공 `200` body `{ message: string }` required. 다른 성공 status는 실패로 본다
- 오류 400(사유 누락·1000자 초과)/401/404/409/500 공통 body
- 실제 서버 테스트 disabled
- 업무보고 네 spec이 모두 승인된 뒤 한 번에 구현한다

## 재사용할 기존 코드

- `src/entities/task/api/taskApi.ts`의 `updateTask`(body 전송, `status === 200`, `message` 검증)
- `useReviewTaskReport`(승인 계획과 같은 mutation·캐시)
- `RejectReasonDialog`의 공백 제거·빈 사유 차단·처리 중 읽기 전용·초점 유지

## 변경 파일

- `src/entities/task-report/api/types.ts`, `src/entities/task-report/api/taskReportApi.ts` (반려 타입·함수)
- `src/entities/task-report/index.ts`
- `src/features/review-task-report/model/useReviewTaskReport.ts`
- `src/features/review-task-report/ui/RejectReasonDialog.tsx` (`maxLength` 추가)
- 신규 `tests/e2e/api/app-work-report-reject.spec.ts`
- `tests/e2e/task-report.spec.ts` (반려 시나리오 route mock 이관)

## 타입과 API 함수

- `TaskReportRejectRequest { rejectionReason: string }`, `TaskReportRejectResponse { message: string }`
- 상수 `taskReportRejectionReasonMaxLength = 1000` (API 함수와 모달이 같이 쓴다)
- `rejectTaskReport({ id, input })`
  - `Number.isSafeInteger(id) && id > 0` 아니면 명시적 Error
  - `input.rejectionReason`이 빈 문자열이거나 1000자를 넘으면 요청하지 않고 명시적 Error
  - `api.patch<unknown>(`/work-report/reject/${id}`, input)`
  - `status !== 200` 또는 `message`가 string이 아니면 명시적 Error

## Query/Mutation과 캐시

- `useReviewTaskReport.mutationFn`의 `reject` 분기 → `rejectTaskReport({ id: Number(id), input: { rejectionReason } })`
- 성공·실패 캐시 처리는 `app-work-report-approve` 계획과 같다(`['task-reports', 'list']` prefix, 상세 stale, `['tasks']` prefix)
- `ReviewInput.rejectReason` 이름은 화면 콜백 호환을 위해 유지하고 API 경계에서 `rejectionReason`으로 옮긴다

## UI 연결

- `RejectReasonDialog` textarea에 `maxLength={taskReportRejectionReasonMaxLength}` 추가. 글자 수 표시·안내 문구는 추가하지 않는다
- 그 밖의 목록·상세·모달 동작 변경 없음

## 기존 테스트 정리

- `tests/e2e/task-report.spec.ts`의 반려 시나리오(S12, S22–S24, S28, S31, S33)를 `PATCH /work-report/reject/{id}` route mock으로 바꾼다.
  - S22 “입력한 반려 사유 저장”: localStorage 확인 → 요청 body `rejectionReason`이 공백 제거된 입력값인지 확인
  - S23/S24: route 지연 응답으로 진행 중 상태를 만든다
  - S31/S33: 500 응답
- S19–S21, S29(모달 표시·미입력·이탈)는 반려 PATCH 요청 0회를 확인한다.

## 검증 순서

1. `yarn harness:api:validate app-work-report-reject`
2. `yarn harness:api:gate app-work-report-reject`
3. `yarn harness:api:policy app-work-report-reject src/entities/task-report/api/types.ts src/entities/task-report/api/taskReportApi.ts src/entities/task-report/index.ts src/features/review-task-report/model/useReviewTaskReport.ts src/features/review-task-report/ui/RejectReasonDialog.tsx`
4. `yarn lint`, `yarn typecheck`, `yarn build`
5. `yarn verify:api app-work-report-reject`
6. `tests/e2e/task-report.spec.ts` 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- 400 메시지별로 다른 안내를 보여야 하면 ⑧로 돌아간다.
- 1000자 기준이 공백 제거 후로 확인돼도 프런트 동작은 같다(원문 길이 제한이 더 엄격).
- 백엔드 질문: `harness/artifacts/api/work-report.backend-questions.md`
