---
feature: animal-legal-status-delete
api_id: ANIMAL_LEGAL_STATUS_DELETE
target_page: src/pages/species/EditSpeciesPage.tsx
notion_page: https://app.notion.com/p/d5e7a4d6147483f2803d8159fa9dcd75
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 폼에서 직접 추가 항목 pill의 ✕(현재 폼 로컬 목록에서만 제거)를
확인 모달 후 `ANIMAL_LEGAL_STATUS_DELETE`(DELETE
`/animal-manage/legal-status/{animalLegalStatusId}`)로 서버 공용 목록에서
삭제하도록 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/features/species-form/ui/LegalDesignationField.tsx`
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_LEGAL_STATUS_DELETE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 서버 목록 항목 pill의 ✕를 누르면 기존 `DeleteConfirmationDialog`로 확인을
  받는다(2026-09-16 개발자 결정). 공용 목록 pill 에는 모두 ✕가 있다(2026-09-18, 이슈 #149).
- 확인 시 그 항목의 `animalLegalStatusId`로 호출한다.
- 200 성공 시 목록을 다시 받아 pill을 없애고, 선택돼 있었다면 선택값에서도
  뺀다. 모달이 닫히면 포커스를 `+ 법정분류 추가`로 돌린다.
- 확인 모달의 확인 버튼은 요청 중 중복 제출되지 않는다.

# 기대 오류 동작

- 404·500 등 오류 시 모달을 닫고 pill과 선택 상태를 그대로 두며 실패를
  알린다. 문구는 기존 삭제 실패 토스트(`데이터 삭제에 실패했습니다`) 패턴을
  따르되 위치는 구현 계획에서 정하고 승인 시 확정.

# 캐시 갱신 기대

- 성공 시 `['legal-statuses']`를 무효화한다.
- 삭제된 항목을 선택했던 종의 상세 응답은 id가 `null`로 바뀌므로(BE PR #162)
  종 캐시(`speciesQueryKeys.all`)도 함께 무효화한다.

# 페이지 이동 또는 사용자 알림

- 확인 모달 취소 시 포커스를 눌렀던 ✕로 돌린다.

# 비고 및 제약

- 공용 목록 삭제이므로 다른 종 폼의 선택지에서 사라진다. 이미 그 항목을
  저장한 종에는 이름이 남는다(2026-09-17 재확인). 확인 모달
  설명 문구를 기본 문구로 둘지 공용 삭제 안내를 넣을지는 승인 시 확정.
- 퍼블리싱 spec(`species-form`)은 ✕가 확인 없이 폼 로컬에서만 제거한다.
  문서 수정·재승인이 필요하다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 없음 — 종에 이름이 남는 동작은 Notion 비고와 같다(2026-09-17 재확인).
