---
feature: notice-delete
api_id: NOTICE_DELETE
target_page: src/pages/notices/notice/NoticeDetailPage.tsx
notion_page: https://app.notion.com/p/392bfdfeff948006a204f99c5df39bf3
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공지사항 상세 화면의 mock 삭제를 `NOTICE_DELETE` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/notice/NoticeDetailPage.tsx`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `src/entities/notice`

# 연동할 API

- API ID: `NOTICE_DELETE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/notices/list/:id`에서 삭제 확인 후 해당 공지사항 ID로 삭제 API를 한 번 호출한다.
- 성공하면 공지사항 목록 캐시를 갱신하고 삭제된 상세 캐시를 제거한 뒤 `/notices/list`로 이동한다.
- 기존 삭제 확인 다이얼로그, 중복 제출 방지, 작성 중 이탈 방지 동작을 유지한다.

# 기대 오류 동작

- 삭제 오류를 성공이나 localStorage mock 삭제로 숨기지 않는다.
- 실패하면 현재 상세 화면에 머물고 다시 삭제할 수 있어야 한다.
- 서버 오류는 기존 폼의 삭제 오류 상태 영역에 표시한다.

# 캐시 갱신 기대

- 성공 시 기존 공지사항 목록 prefix `['notices']`를 무효화한다.
- 삭제된 상세 query `['notices', id]`를 제거한다.
- 실패 시 공지사항 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/notices/list`로 이동한다.
- 실패하면 상세 화면에 머물고 기존 문구
  `삭제하지 못했습니다. 다시 시도해 주세요.`를 표시한다.

# 비고 및 제약

- `NOTICE_DELETE` 삭제만 연동하며 공지 생성·조회·수정 API는 다시 연결하지 않는다.
- 요청 필드와 응답 형식은 Contract에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
