---
feature: animal-kind-query-all
api_id: ANIMAL_KIND_QUERY_ALL
target_page: src/pages/species/SpeciesListPage.tsx
notion_page: https://app.notion.com/p/3d17a4d6147482a3ad6781fe3bcb67cb
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 목록 화면(`/species`)의 localStorage mock 전체 조회(`getMockSpeciesList`)를
`ANIMAL_KIND_QUERY_ALL`(GET `/animal-manage/kind`) 연동으로 교체한다.
필터·검색·페이지 슬라이싱을 화면에서 서버 쿼리로 옮긴다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/SpeciesListPage.tsx`
- `src/entities/species` (mock 제거, `api/` 추가)

# 연동할 API

- API ID: `ANIMAL_KIND_QUERY_ALL`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 화면 진입 시 종 목록 API를 호출하고 응답 `animalKinds[]`를 `SpeciesTable`에
  표시한다(2026-09-16 새 명세 — Spring Page가 아니라
  `{ animalKinds, totalPageSize }` 구조).
  - 국명 `kindName`, 학명 `scientificName`, 분류군 `animalTaxonomic`,
    마리수 `animalCount`(파생 계산 `countMockIndividualsBySpecies` 제거),
    사진 `kindImage.fileKey`.
- 사진 표시 URL은 develop에 머지된 `storedFileUrl(fileKey)`
  (`src/shared/api/fileStorage.ts`, PR #100)을 재사용한다.
- 분류군 탭은 `animalTaxonomic` query parameter로 서버에 전달한다.
  `전체` 탭은 보내지 않는다. 모델 `TaxonGroup` 값을 서버 값
  (`MAMMALS`/`REPTILES`/`BIRDS`/`FISH`)으로 개명한다(task 연동 전례).
- 검색은 `keyword`로 서버에 전달한다(서버가 국명·개체명을 함께 검색).
  현재 화면의 종별 개체 조회(`useQueries`) 기반 클라이언트 검색을 제거한다.
- 정렬 버튼(`최신순/오래된순`)을 제거한다(2026-09-16 개발자 결정).
  `sort`는 보내지 않고 서버 기본 `id,desc`를 쓴다.
- 페이지네이션은 서버 쿼리(`page`, `size=10`)를 쓰고 페이지 수는 응답
  `totalPageSize`를 그대로 쓴다(업무 목록 `totalPageSize` 전례). 탭·검색어
  변경 시 1페이지로 되돌리는 동작 유지.
- 빈 목록이면 기존 빈 상태(`등록된 개체 카드가 없습니다` + 안내), 검색 결과
  없으면 `검색결과가 없습니다`를 유지한다.

# 기대 오류 동작

- API 오류를 mock 데이터나 빈 배열로 숨기지 않는다. 목록 조회 실패 시 오류
  상태를 표시한다(빈 상태 문구와 구분 — feed 목록 연동 전례 a76bde1).

# 캐시 갱신 기대

- `speciesQueryKeys.list` prefix를 유지하되 서버 파라미터(page, 분류군 탭,
  keyword)를 같은 prefix 아래 배열 key로 잇는다.
- 생성·수정·삭제 연동이 `speciesQueryKeys.all`을 무효화하면 목록이 갱신된다.

# 페이지 이동 또는 사용자 알림

- 행 클릭 시 `/species/:id` 이동, 케밥 `수정` → `/species/:id/edit` 유지.
- 생성·삭제 성공 토스트(`usePageToast`) 동작 유지.

# 비고 및 제약

- 종 삭제(케밥 `삭제`)는 `animal-kind-delete`(2026-09-16 API ID 추가됨)의
  별도 범위다. 이 spec에서는 기존 삭제 메뉴·모달 동작을 유지한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `page` 시작값 — Notion 명세는 `0부터 시작, 기본 0`, 개발자 확인
   (2026-09-16)은 1부터 시작. **개발자 결정(2026-09-16): 1-base로 구현**,
   명세 수정 요청은 백엔드 질문으로 남긴다.
2. `keyword`가 staging Swagger에 아직 없다(2026-09-16). 배포 전에는 서버가
   검색을 무시할 수 있다.
3. 정렬 버튼 제거는 퍼블리싱 spec·승인 시나리오(species-list S28·S30, S1
   순서 문구)와 어긋난다. 해당 문서 수정·재승인이 함께 필요하다.
4. `totalPageSize`의 의미(총 페이지 수로 추정)가 명세에 설명돼 있지 않다
   (contract Backend Questions).
