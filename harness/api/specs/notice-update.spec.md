---
feature: notice-update
api_id: NOTICE_UPDATE
target_page: src/pages/notices/notice/NoticeDetailPage.tsx
notion_page: https://app.notion.com/p/392bfdfeff948081821dc459cd7b808c
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공지사항 상세 화면의 mock 수정 저장을 `NOTICE_UPDATE` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/notice/NoticeDetailPage.tsx`
- `src/features/create-notice/ui/NoticeForm.tsx`
- `src/entities/notice`

# 연동할 API

- API ID: `NOTICE_UPDATE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/notices/list/:id`에서 수정한 공지사항 ID로 수정 API를 한 번 호출한다.
- 성공하면 공지사항 목록과 해당 상세 query를 갱신하고 `/notices/list`로 이동한다.
- 기존 입력 검증, 중복 제출 방지, 첨부 UI와 작성 중 이탈 방지 동작을 유지한다.

# 기대 오류 동작

- 수정 오류를 성공이나 localStorage mock 저장으로 숨기지 않는다.
- 실패하면 현재 페이지와 사용자가 입력한 값을 유지해 다시 제출할 수 있어야 한다.
- 서버 오류는 기존 폼의 수정 오류 상태 영역에 표시한다.

# 캐시 갱신 기대

- 성공 시 기존 공지사항 목록 prefix `['notices']`를 무효화한다.
- 해당 상세 query `['notices', id]`가 이전 데이터를 계속 표시하지 않도록 갱신한다.
- 실패 시 공지사항 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/notices/list`로 이동한다.
- 실패하면 수정 화면에 머물고 기존 문구
  `저장하지 못했습니다. 다시 시도해 주세요.`를 표시한다.

# 비고 및 제약

- `NOTICE_UPDATE` 수정만 연동하며 공지 생성·조회·삭제 API는 다시 연결하지 않는다.
- 요청 필드와 Content-Type은 Contract에 명시된 값만 사용한다.
- 첨부파일 UI는 유지하되, Contract에 첨부 요청 필드가 없으면 API 요청에 포함하지 않는다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
