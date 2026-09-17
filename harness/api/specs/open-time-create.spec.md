---
feature: open-time-create
api_id: OPEN_TIME_CREATE
target_page: src/pages/notices/guide/OperatingHoursPage.tsx
notion_page: https://app.notion.com/p/0787a4d6147482a7a8d901673f696684
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 관리의 날짜별 영업시간 화면(Figma yot `1:7101`)에서 `저장하기`로 영업시간을 저장한다.  `OPEN_TIME_CREATE`를 호출한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/OperatingHoursPage.tsx`
- `src/features/edit-operating-hours`
- `src/entities/operating-hours`

# 연동할 API

- API ID: `OPEN_TIME_CREATE`
- 요청 method, path, body, 성공 status와 응답은 승인된 Contract만 따른다.

# 기대 성공 동작

- 유효한 시작·종료 시간으로 `저장하기` → 요청을 한 번 보낸다.
- 성공 → 선택 날짜 영업시간 query를 갱신하고 `/notices/guide`로 이동한다.

# 기대 오류 동작

- 오류 status 또는 Contract와 다른 성공 응답이면 화면과 입력을 유지하고 `저장하지 못했습니다. 다시 시도해 주세요.`를 표시한다.
- 401은 기존 인증 interceptor(세션 비우고 로그인 이동)를 따른다.

# 캐시 갱신 기대

- `['operating-hours', date]` query를 무효화한다.

# 비고 및 제약

- 등록/수정 선택: 조회 응답 `id`가 `null`이면 `OPEN_TIME_CREATE`, 있으면 `OPEN_TIME_UPDATE` (2026-09-17 사용자 결정).
- 시간 형식은 Notion 예시대로 등록 `HH:mm:ss`, 수정 `HH:mm` (2026-09-17 사용자 결정).
- 실제 서버 테스트는 비활성화한다.
