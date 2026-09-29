---
feature: app-work-report-reject
api_id: APP_WORK_REPORT_REJECT
target_page: src/features/review-task-report/model/useReviewTaskReport.ts
notion_page: https://app.notion.com/p/9907a4d6147482f5aca5817f40955fa8
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무보고 목록 케밥과 상세 하단의 `반려하기` → 반려 사유 모달 `확인`이 쓰는
localStorage mock 심사(`reviewMockTaskReport` 반려 분기)를
`APP_WORK_REPORT_REJECT` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/features/review-task-report/model/useReviewTaskReport.ts`
- `src/features/review-task-report/ui/RejectReasonDialog.tsx`
- `src/pages/task-reports/TaskReportListPage.tsx` (케밥 `반려하기`)
- `src/features/review-task-report/ui/TaskReportReviewActions.tsx`
  (상세 `반려하기`)
- `src/entities/task-report`

# 연동할 API

- API ID: `APP_WORK_REPORT_REJECT`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`https://app.notion.com/p/3da7a4d6147480d28d51d71665c28b22`,
  `collection://e567a4d6-1474-82c4-8267-879439b48892`)에서 API ID exact
  match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 반려 사유 모달에서 `확인`을 누르면
  `PATCH /work-report/reject/{workReportId}`를 한 번 보낸다.
  - body: `{ "rejectionReason": "<앞뒤 공백을 제거한 사유>" }`
  - query 없음
- 앞뒤 공백을 제거한 사유가 비어 있으면 `확인`이 비활성이라 요청하지 않는다
  (기존 동작).
- 사유 입력은 1000자까지만 받는다(Contract `1000자 이하`). 입력란에서 1000자를
  넘게 입력할 수 없게 한다.
- HTTP 200 `{ message }`이면 성공으로 처리한다.
  - 목록 케밥: 모달을 닫고 목록에 머물며 `반려에 성공했습니다` 토스트를 띄우고
    케밥 버튼으로 초점을 되돌린다.
  - 상세: `/task-reports`로 이동하고 목록에서 `반려에 성공했습니다` 토스트를
    띄운다.
- 처리 중에는 입력란 읽기 전용, `확인` 비활성, 두 번째 요청 없음을 유지한다.

# 기대 오류 동작

- 400(사유 누락·1000자 초과)/404/409/500과 응답 형식 위반을 실패로
  처리한다. 401은 공통 세션 처리(`app-auth-reissue`: 재발급 시도, 불가하면
  `/login` 이동)를 따른다.
  - 목록 케밥: 모달을 닫고 `반려에 실패했습니다` 토스트, 목록 유지
  - 상세: 모달을 닫고 `반려에 실패했습니다` 토스트, 상세 유지
- 서버 `message`(예: `반려 사유를 입력해주세요.`)는 화면에 표시하지 않는다.
- 실패를 localStorage mock 성공으로 대체하지 않는다.

# 캐시 갱신 기대

- 성공 시 `app-work-report-approve`와 같다.
  - `['task-reports', 'list']` prefix 무효화(화면에 없어도 다시 받음)
  - `['task-reports', id]` stale 표시만
  - `['tasks']` prefix 무효화(업무 상세의 보고 현황·진행도가 바뀐다)
- 실패 시 캐시를 건드리지 않는다.

# 페이지 이동 또는 사용자 알림

- 결과 토스트 문구와 위치는 기존 퍼블리싱 결과(`taskReportReviewToasts`)를
  그대로 쓴다.

# 비고 및 제약

- 반려만 연동한다. 네 업무보고 spec은 같은 파일을 공유하므로 모두 승인된 뒤
  함께 구현한다.
- 반려 사유를 localStorage에 따로 저장하던 mock(`reject-reasons` 키)은
  제거한다. 사유는 요청 body로만 보낸다.
- 1000자 제한은 모달 입력란의 `maxLength`로 막는다. 글자 수 표시 UI는 추가하지
  않는다(Figma에 없음).
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `rejectionReason`의 1000자 제한이 공백 제거 후 길이인지, 공백만 보낸 경우
   400(`반려 사유를 입력해주세요.`)인지 명세에 없다. 프런트는 공백을 제거해
   보내므로 동작에는 영향이 없다.
2. 승인된 보고를 반려할 수 있는지(409인지) 명세에 없다.
3. ADMIN 전용인데 403 응답이 정의되어 있지 않다.
