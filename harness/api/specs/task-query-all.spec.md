---
feature: task-query-all
api_id: TASK_QUERY_ALL
target_page: src/pages/tasks/TaskListPage.tsx
notion_page: https://app.notion.com/p/3b87a4d6147483abaf1c01441d1709fe
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무관리 목록 화면의 localStorage mock 전체 조회를 `TASK_QUERY_ALL` API
연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/tasks/TaskListPage.tsx`
- `src/entities/task`

# 연동할 API

- API ID: `TASK_QUERY_ALL`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를
  기준으로 한다.

# 기대 성공 동작

- 업무관리 화면 진입 시 업무지시 전체 조회 API를 호출한다.
- 서버가 반환한 업무지시를 기존 표에 표시한다.
- 빈 목록이면 기존 `등록된 업무가 없습니다.` 빈 상태를 표시한다.
- (Contract 확정 후 보완) 페이지네이션·상태 탭·공개범위 컬럼 처리 방식

# 기대 오류 동작

- API 오류를 mock 데이터나 빈 배열로 숨기지 않는다.
- 기존 `업무를 불러오지 못했습니다. 다시 시도해 주세요.` alert를 표시한다.

# 캐시 갱신 기대

- 기존 `['tasks']` query key prefix를 유지한다.
- 후속 생성·수정·삭제 연동이 이 prefix를 무효화할 수 있어야 한다.

# 페이지 이동 또는 사용자 알림

- 기존 행 클릭 시 `/tasks/:id` 이동 동작을 유지한다.
- 기존 삭제 결과 토스트 표시 동작을 유지한다.

# 비고 및 제약

- `TASK_QUERY_ALL` 조회만 연동한다. 상세 조회·생성·수정·삭제는 각 API ID의
  별도 범위이며 해당 mock은 유지한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- Notion 명세의 Contract 필수값 누락이 해소되기 전에는 구현하지 않는다.
