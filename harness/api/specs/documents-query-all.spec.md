---
feature: documents-query-all
api_id: DOCUMENTS_QUERY_ALL
target_page: src/pages/notices/resources/ResourceListPage.tsx
notion_page: https://app.notion.com/p/e58e8d82a450822f885e01958a22bd25
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

자료실(Resource) 목록을 실제 API(`GET /documents`)로 조회한다. 현재 `ResourceListPage`는 mock(`getMockResources`)을 사용하며, 이를 실 API로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/resources/ResourceListPage.tsx`
- 조회 함수/타입: `src/entities/resource/api/getDocuments.ts` (신규)

# 연동할 API

- API ID: `DOCUMENTS_QUERY_ALL`
- `GET /documents`
- 인증: Bearer access token, 접근권한 USER/ADMIN
- Query: `page`(기본 0), `size`(기본 10), `keyword`(제목 검색, 선택), `orderDirection`(ASC/DESC, 선택)
- 응답 200: 자료 객체 배열 `[{ id, title, type, createdAt }]` (빈 배열 가능)

# 기대 성공 동작

- 200 배열 수신 → `Resource[]`로 매핑(type→fileType, createdAt→표시 날짜) → 목록 표시. 빈 배열이면 "표시할 자료가 없습니다".

# 기대 오류 동작

- 401 만료된 토큰 / 404 존재하지 않는 자료 / 500 서버 오류 → 목록 오류 상태 표시

# 캐시 갱신 기대

- 생성/수정/삭제 성공 시 `['resources']` 무효화로 목록 재조회(기존 create의 invalidate가 prefix로 매칭).

# 페이지 이동 또는 사용자 알림

- 행 클릭 시 `/notices/resources/:id`로 이동(기존 유지).

# 비고 및 제약

- 실제 서버 테스트는 하지 않는다(`real_server.enabled: false`). Mock 기반 Playwright만 수행.
- 페이지네이션은 공지(`getAllNotices`)와 동일하게 전체 페이지를 취합해 클라이언트에서 필터/정렬/페이지 처리한다. 서버측 `keyword`/`orderDirection`은 이번 범위에서 UI에 배선하지 않는다.
