---
feature: animal-legal-status-query-all
api_id: ANIMAL_LEGAL_STATUS_QUERY_ALL
target_page: src/pages/species/CreateSpeciesPage.tsx
notion_page: https://app.notion.com/p/3c07a4d6147482de93ce0103c34bb7b1
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 등록·수정 폼의 법정지정분류 선택지를 고정 기본 목록 + 폼 로컬 직접
추가 목록에서 `ANIMAL_LEGAL_STATUS_QUERY_ALL`(GET
`/animal-manage/legal-status`) 공용 목록 기반으로 바꾼다. 종 저장 시 필요한
이름→id 변환의 출처도 이 목록이다.

# 대상 페이지 또는 컴포넌트

- `src/features/species-form/ui/LegalDesignationField.tsx`
- `src/features/species-form/ui/SpeciesForm.tsx`
- `src/pages/species/CreateSpeciesPage.tsx`, `EditSpeciesPage.tsx`
- `src/entities/species` (법정지정분류 api·query key 추가)

# 연동할 API

- API ID: `ANIMAL_LEGAL_STATUS_QUERY_ALL`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 종 등록·수정 화면 진입 시 법정지정분류 목록을 조회한다. 응답은 래핑 없는
  배열 `[{ animalLegalStatusId, kind }]`이다.
- 선택지 표시 순서(2026-09-16 개발자 결정):
  1. 기본 3개(`지정관리 야생동물`·`멸종위기 야생생물 I급`·`천연기념물`)는
     서버 목록에 있든 없든 항상 이 순서로 먼저 보이고 ✕가 없다. 서버는 이
     3개를 내려주지 않는다(백엔드 확인).
  2. 그 뒤에 서버 목록 중 기본 3개와 이름이 다른 항목을 응답 순서대로
     ✕ 있는 pill로 보인다.
  3. 마지막에 `+ 법정분류 추가`.
- 수정 화면은 종 상세 응답의 `legalStatuses`(`[{ animalLegalStatusId, kind }]`, BE PR #162)의
  `kind`를 선택 상태로 복원한다. 공용 목록에서 삭제돼 id가 `null`인 분류도 선택된 채
  보이며(2026-09-17 개발자 요구), 저장 시 다시 생성한다.
- 종 저장 시 선택된 이름을 이 목록에서 찾아 `animalLegalDesignation` id
  배열로 바꾼다. 선택된 기본 항목이 서버 목록에 없으면 먼저
  `animal-legal-status-create`로 만든 뒤 목록을 다시 받아 id를 찾는다(한 번
  생기면 이후엔 서버 id 사용).

# 기대 오류 동작

- 목록 조회 실패 시 오류를 빈 배열로 숨기지 않는다. 폼 저장에 필요한 id를
  얻을 수 없으므로 법정지정분류 필드에 불러오기 실패를 알리고 저장을 막는다.
  표시 문구·위치는 구현 계획에서 기존 폼 오류 패턴으로 정하고 승인 시 확정.

# 캐시 갱신 기대

- 새 query key `['legal-statuses']`(entity `queryKeys`에 추가)를 쓴다.
- 법정지정분류 생성·삭제 성공 시 이 key를 무효화한다.

# 페이지 이동 또는 사용자 알림

- 없음(폼 내부 선택지).

# 비고 및 제약

- 퍼블리싱 spec `species-form.spec.md` 115~138행은 "직접 추가한 이름은 이 종의
  값으로만 저장, 다른 종 선택지로 공유하지 않음"이다. 2026-09-16 개발자
  결정(공용 목록)과 달라 퍼블리싱 spec·승인 시나리오 수정과 재승인이 함께
  필요하다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. 법정지정분류를 삭제해도 기존 종에는 이름이 남는다(2026-09-17 재확인, Notion 비고와
   같음). BE PR #162(머지 전)로 종 상세가 id를 함께 주며 삭제된 분류는 `null`이다.
2. 기본 3개 미반환은 명세에 없고 백엔드 구두 확인만 있다(contract Notes).
