---
feature: notice-query-all
api_id: NOTICE_QUERY_ALL
target_page: src/pages/notices/notice/NoticeListPage.tsx
notion_page: https://app.notion.com/p/392bfdfeff94803692deef24a3408890
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공지사항 목록 화면의 mock 전체 조회를 `NOTICE_QUERY_ALL` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/notice/NoticeListPage.tsx`
- `src/entities/notice`

# 연동할 API

- API ID: `NOTICE_QUERY_ALL`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 목록 화면 진입 시 공지사항 전체 조회 API를 호출한다.
- 서버가 반환한 공지사항을 기존 목록 테이블에 표시한다.
- 빈 배열이면 기존 빈 상태 UI를 표시한다.

# 기대 오류 동작

- API 오류를 빈 배열로 숨기지 않는다.
- 승인된 테스트 시나리오에서 오류 상태를 사용자에게 드러낸다.

# 캐시 갱신 기대

- 기존 `['notices']` query key 패턴을 우선 검토한다.
- 페이지네이션 파라미터가 캐시 key에 포함되어야 하는지는 Contract와 프로젝트 분석에서 확정한다.

# 페이지 이동 또는 사용자 알림

- 기존 행 클릭 시 `/notices/list/:id` 이동 동작을 유지한다.
- 오류 알림 방식은 기존 프로젝트 패턴과 승인된 계획을 따른다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
