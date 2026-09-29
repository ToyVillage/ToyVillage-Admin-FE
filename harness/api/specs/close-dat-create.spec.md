---
feature: close-dat-create
api_id: CLOSE_DAT_CREATE
target_page: src/pages/notices/guide/CreateCloseSchedulePage.tsx
notion_page: https://app.notion.com/p/3bc7a4d614748379bd1581dea10a27b2
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 생성 화면의 mock 저장을 `CLOSE_DAT_CREATE` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/CreateCloseSchedulePage.tsx`
- `src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
- `src/entities/close-schedule`

# 연동할 API

- API ID: `CLOSE_DAT_CREATE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를
  기준으로 한다.

# 기대 성공 동작

- 유효한 시작일, 종료일, 제목으로 생성하면 휴관일 생성 API를 호출한다.
- 생성 성공 후 `['close-schedules']` 조회 캐시를 무효화한다.
- 생성 성공 후 `/notices/guide`로 이동한다.

# 기대 오류 동작

- 기존 클라이언트 입력 검증을 유지한다.
- API 오류를 성공으로 숨기거나 mock 저장으로 대체하지 않는다.
- 생성 실패 시 입력값을 보존하고 재시도할 수 있어야 한다.

# 캐시 갱신 기대

- 생성 성공 시 기존 `['close-schedules']` query key를 무효화한다.
- 생성 실패 시 조회 캐시를 무효화하지 않는다.

# 페이지 이동 또는 사용자 알림

- 생성 성공 시 `/notices/guide`로 이동한다.
- 생성 실패 시 기존 `생성하지 못했습니다. 다시 시도해 주세요.` 상태를
  표시하고 생성 화면에 머문다.

# 비고 및 제약

- 생성 화면의 mock mutation만 API mutation으로 교체한다. 수정과 삭제
  mutation은 이번 작업 범위가 아니다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- Notion 명세의 Contract 필수값 누락이 해소되기 전에는 구현하지 않는다.
