---
feature: documents-delete
api_id: DOCUMENTS_DELETE
target_page: src/features/create-resource/ui/ResourceForm.tsx
notion_page: https://app.notion.com/p/e58e8d82a450822f885e01958a22bd25
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

자료실 자료 삭제를 실제 API(`DELETE /documents/{id}`)로 연동한다. 현재 `ResourceForm`의 삭제 경로는 mock(`deleteMockResource`)이다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-resource/ui/ResourceForm.tsx` (삭제 버튼 → 삭제 확인 다이얼로그)

# 연동할 API

- `DELETE /documents/{id}`, 인증 Bearer/ADMIN, Path `id`
- 성공 200 `{ message: "자료 삭제 성공" }`

# 기대 성공 동작

- 200 → `['resources']` 무효화, 상세 캐시 제거, 목록 복귀(`onCompleted`).

# 기대 오류 동작

- 401 토큰 / 404 존재하지 않는 자료 / 500 → 삭제 실패 다이얼로그.

# 캐시 갱신 기대

- `invalidateQueries(['resources'])` + 상세 `['resources', id]` 제거.

# 페이지 이동 또는 사용자 알림

- 성공 시 목록 복귀. 실패 시 `ErrorDialog`.

# 비고 및 제약

- 실제 서버 테스트 없음(`real_server.enabled: false`).
