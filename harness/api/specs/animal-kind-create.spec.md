---
feature: animal-kind-create
api_id: ANIMAL_KIND_CREATE
target_page: src/pages/species/CreateSpeciesPage.tsx
notion_page: https://app.notion.com/p/04d7a4d61474821284e2818f5792f501
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 등록 화면(`/species/create`)의 mock 생성(`createMockSpecies`)을
`ANIMAL_KIND_CREATE`(POST `/animal-manage/kind`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/CreateSpeciesPage.tsx`
- `src/features/species-form` (`SpeciesForm`, `LegalDesignationField`)
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_KIND_CREATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 저장 시 사진 파일을 `FILE_CREATE`(기존 `uploadFile` 연동)로 먼저 올려
  `fileKey`를 받은 뒤 본 API를 호출한다.
- 요청 body: 필수 `animalName`(국명), `animalEngName`(영명),
  `animalScientificName`(학명), `animalTaxonomic`(분류군), `fileKey`와
  선택 `animalDetailKind`(세부분류), `animalLegalDesignation`(법정지정분류 id
  배열). 2026-09-16 새 명세에서 두 선택값이 필수에서 풀려 화면(퍼블리싱
  spec의 선택 입력)과 일치한다.
- 201 성공 시 `/species`로 이동하고 `create-success` 토스트를 전달한다
  (기존 동작 유지).

# 기대 오류 동작

- 400(필드 검증)·404(fileKey 없음 / 존재하지 않는 법정지정분류) 등 오류 시
  폼에 머무르고 입력을
  보존하며 실패 안내를 표시한다. 오류를 성공처럼 숨기지 않는다.

# 캐시 갱신 기대

- 성공 시 `speciesQueryKeys.all`을 무효화해 목록에 새 종이 나타난다.

# 페이지 이동 또는 사용자 알림

- 성공: `/species` 이동 + `create-success` 토스트.
- 이탈 가드(`useFormLeaveGuard`) 동작 유지.

# 비고 및 제약

- `animalLegalDesignation`의 id는 `animal-legal-status-query-all` 목록에서
  이름으로 찾는다(2026-09-16 API ID 추가로 보류 해소). 법정지정분류
  선택지·직접 추가·✕ 삭제는 `animal-legal-status-*` 3건의 별도 범위다.
- 2026-09-16 개발자 결정(법정지정분류): 선택지는 서버 공용 목록(GET),
  직접 추가는 POST로 공용 목록에 추가, 직접 추가 항목의 ✕는 확인 모달 후
  서버 DELETE. 기본 3개(`지정관리 야생동물`·`멸종위기 야생생물 I급`·
  `천연기념물`)는 서버가 내려주지 않으므로 화면에 항상 표시(✕ 없음)하고,
  선택된 기본 항목이 서버 목록에 없으면 저장 전에 POST로 만들어 id를 얻는다.
- 세부분류를 비우거나 법정지정분류를 하나도 고르지 않았을 때 필드를
  생략할지 `null`/빈 배열로 보낼지는 명세가 모두 허용한다. 구현 계획에서
  하나로 정하고 승인 시 확정.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 문자열 필드 최대 길이 제한이 명세에 없다(contract Notes).
2. 분류군 모델 값은 서버 값(`MAMMALS`/`REPTILES`/`BIRDS`/`FISH`)으로
   개명한다(2026-09-16 개발자 결정 — 성별 enum과 같은 방침).
