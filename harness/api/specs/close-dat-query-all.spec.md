---
feature: close-dat-query-all
api_id: CLOSE_DAT_QUERY_ALL
target_page: src/pages/notices/guide/NoticeGuidePage.tsx
notion_page: https://app.notion.com/p/27e7a4d61474838a8e26015785f2c4d7
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 관리 화면의 mock 전체 조회를 `CLOSE_DAT_QUERY_ALL` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/NoticeGuidePage.tsx`
- `src/entities/close-schedule`

# 연동할 API

- API ID: `CLOSE_DAT_QUERY_ALL`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 휴관일 관리 화면 진입 시 휴관일 전체 조회 API를 호출한다.
- 서버가 반환한 휴관일을 기존 달력과 휴관 일정 목록에 표시한다.
- 빈 목록이면 기존 빈 상태 UI를 표시한다.

# 기대 오류 동작

- API 오류를 mock 데이터나 빈 배열로 숨기지 않는다.
- 승인된 테스트 시나리오에서 오류 상태를 사용자에게 드러낸다.

# 캐시 갱신 기대

- 기존 `['close-schedules']` query key 패턴을 우선 검토한다.
- 후속 생성·수정·삭제 연동은 이 조회 query key를 무효화할 수 있어야 한다.

# 페이지 이동 또는 사용자 알림

- 기존 일정 카드 클릭 시 `/notices/guide/:id/edit` 이동 동작을 유지한다.
- 오류 알림 방식은 기존 프로젝트 패턴과 승인된 계획을 따른다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- Notion 명세의 Contract 필수값 누락이 해소되기 전에는 구현하지 않는다.
