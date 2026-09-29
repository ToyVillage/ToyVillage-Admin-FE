---
feature: animal-observation-update
api_id: ANIMAL_OBSERVATION_UPDATE
target_page: src/pages/species/EditObservationPage.tsx
notion_page: https://app.notion.com/p/1c47a4d6147482448fa501311aa58cc0
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

관찰 수정 화면의 mock 수정(`updateMockObservation`)을
`ANIMAL_OBSERVATION_UPDATE`
(PATCH `/animal-manage/{animalManageId}/observations/{observationId}`) 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/EditObservationPage.tsx`
- `src/features/observation-form/ui/ObservationForm.tsx`
- `src/entities/observation`

# 연동할 API

- API ID: `ANIMAL_OBSERVATION_UPDATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 저장 시 body `title`, `content`, `fileKeys`를 전부 보낸다(부분 수정 아님).
  - `fileKeys`는 받은 목록으로 **통째 교체**된다(명세·백엔드 확인 일치).
    남긴 기존 첨부의 `fileKey` + 새로 고른 파일을 `FILE_CREATE`
    (`uploadFile`)로 올려 받은 `fileKey`를 화면 순서대로 담는다
    (`TaskForm` 업로드 루프 패턴).
  - 첨부를 모두 지우면 빈 배열을 보낸다.
- 입력 길이는 제목 100자, 관찰사항 2000자를 `maxLength`로 막는다. 카운터·
  오류 문구 없음(2026-09-16 개발자 결정).
- 200 성공 시 `observationQueryKeys.all`을 무효화하고 관찰 상세로 이동한다
  (기존 동작 — 수정 성공 토스트 없음).
- 폼 첨부 칩의 기존 파일 다운로드는 `AttachmentField`가 이미
  `downloadStoredFile`을 쓴다(PR #100).

# 기대 오류 동작

- 400·404(관찰 조합 없음/fileKeys 파일 없음)·500 등 오류 시 폼에 머무르고
  입력을 보존하며 기존 저장 실패 표시(`mutation.isError` 행)를 쓴다.
- 새 첨부 업로드가 실패하면 수정 API를 호출하지 않고 같은 저장 실패 표시를
  쓴다.

# 캐시 갱신 기대

- 성공 시 `observationQueryKeys.all`(상세·개체 상세 관찰 표) 무효화.

# 페이지 이동 또는 사용자 알림

- 성공: 관찰 상세로 이동. 이탈 가드(`useFormLeaveGuard`) 동작 유지.

# 비고 및 제약

- 필수값 검증(제목·관찰사항 인라인 오류)은 기존 화면 검증을 유지한다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `fileKeys` 최대 개수·파일 크기 제한이 명세에 없다(contract Backend
   Questions). 화면의 기존 첨부 제한을 그대로 쓴다.
2. PATCH 성공 status의 staging 실측이 없다(명세 200 기준).
