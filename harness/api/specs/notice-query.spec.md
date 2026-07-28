---
feature: notice-query
api_id: NOTICE_QUERY
target_page: src/pages/notices/notice/NoticeDetailPage.tsx
notion_page: https://app.notion.com/p/392bfdfeff94803d8009ca9ec7920250
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공지사항 상세 화면의 mock 단일 조회를 `NOTICE_QUERY` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/notice/NoticeDetailPage.tsx`
- `src/entities/notice`

# 연동할 API

- API ID: `NOTICE_QUERY`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/notices/list/:id` 진입 시 URL의 공지사항 ID로 단일 조회 API를 호출한다.
- 서버가 반환한 `title`, `kind`, `content`, `createAt`을 기존 상세 폼에 표시한다.
- 기존 수정·삭제 mock mutation은 이번 조회 API 범위 밖이므로 변경하지 않는다.

# 기대 오류 동작

- API 오류를 존재하지 않는 공지로 숨기지 않는다.
- 404는 기존 복구 UI로 표시하고, 그 외 오류는 별도 오류 상태로 사용자에게 드러낸다.

# 캐시 갱신 기대

- 기존 상세 query key `['notices', id]`를 유지한다.
- 기존 목록 prefix `['notices']`와 호환되어야 한다.

# 페이지 이동 또는 사용자 알림

- 목록으로 돌아가기와 편집 중 이탈 방지 동작을 유지한다.
- 조회 실패 시 목록으로 돌아갈 수 있어야 한다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.
- `NOTICE_QUERY`는 조회만 연동하며 수정·삭제 API는 연결하지 않는다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
