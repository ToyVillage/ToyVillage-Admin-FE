---
feature: close-dat-update
api_id: CLOSE_DAT_UPDATE
target_page: src/pages/notices/guide/EditCloseSchedulePage.tsx
notion_page: https://app.notion.com/p/dd67a4d614748206bc1801632fa98917
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 수정 화면의 mock 저장을 `CLOSE_DAT_UPDATE` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/EditCloseSchedulePage.tsx`
- `src/features/create-close-schedule/ui/CloseScheduleForm.tsx`
- `src/entities/close-schedule`

# 연동할 API

- API ID: `CLOSE_DAT_UPDATE`
- Notion API 명세서에서 API ID exact match로 식별한 단일 상세 페이지를
  기준으로 한다.

# 기대 성공 동작

- `/notices/guide/:id/edit`에서 유효한 시작일, 종료일, 제목으로 수정하면 해당
  휴관일 ID로 수정 API를 한 번 호출한다.
- 성공하면 `['close-schedules']` 조회 캐시를 무효화하고
  `/notices/guide`로 이동한다.
- 기존 입력 검증과 중복 제출 방지 동작을 유지한다.

# 기대 오류 동작

- 수정 오류를 성공이나 localStorage mock 수정으로 숨기지 않는다.
- 실패하면 현재 수정 화면과 입력값을 유지하고 다시 제출할 수 있어야 한다.
- 기존 `수정하지 못했습니다. 다시 시도해 주세요.` 상태를 표시한다.

# 캐시 갱신 기대

- 성공 시 기존 휴관일 목록 prefix `['close-schedules']`를 무효화한다.
- 실패 시 휴관일 캐시를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/notices/guide`로 이동한다.
- 실패하면 수정 화면에 머물고 기존 수정 실패 문구를 표시한다.

# 비고 및 제약

- `CLOSE_DAT_UPDATE` 수정만 연동하며 휴관일 생성·조회·삭제 API는 다시
  연결하지 않는다.
- 요청 필드와 응답 형식은 Contract에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
- Notion 명세의 Contract 필수값 누락이 해소되기 전에는 구현하지 않는다.
