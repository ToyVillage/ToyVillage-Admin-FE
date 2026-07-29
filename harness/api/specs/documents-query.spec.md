---
feature: documents-query
api_id: DOCUMENTS_QUERY
target_page: src/pages/notices/resources/ResourceDetailPage.tsx
notion_page: https://app.notion.com/p/e58e8d82a450822f885e01958a22bd25
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

자료실 자료 상세를 실제 API(`GET /documents/{id}`)로 조회한다. 현재 `ResourceDetailPage`는 mock(`getMockResource`)을 쓰며, 이를 실 API로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/resources/ResourceDetailPage.tsx`
- 조회 함수: `src/entities/resource/api/getDocuments.ts`의 `getDocument` (신규)

# 연동할 API

- API ID: `DOCUMENTS_QUERY`
- `GET /documents/{id}`
- 인증: Bearer, USER/ADMIN
- Path: `id`(INT)
- 응답 `{ id, title, type, createdAt, files: [{ fileName, fileKey }] }` (명세상 성공 코드 201)

# 기대 성공 동작

- 상세 조회 → `Resource`로 매핑(type→fileType, createdAt→표시 날짜, files→첨부 이름) → 편집 폼에 표시.

# 기대 오류 동작

- 401 만료 토큰 / 404 존재하지 않는 자료 / 500 서버 오류 → 별도 "자료를 찾을 수 없습니다." 화면 없이 빈 폼을 유지한다(디자인에 오류 화면이 없음). 구현 계획·테스트 시나리오·E2E와 일치.

# 캐시 갱신 기대

- 상세 조회 캐시 키 `['resources', id]`. 생성/수정/삭제의 `['resources']` 무효화가 prefix로 매칭.

# 페이지 이동 또는 사용자 알림

- 목록에서 행 클릭 시 `/notices/resources/:id` 진입.

# 비고 및 제약

- 실제 서버 테스트 없음(`real_server.enabled: false`). Mock Playwright만.
- 수정/삭제(폼 제출)는 이번 범위 아님 → mock 유지.
