---
feature: animal-manage-query-all
api_id: ANIMAL_MANAGE_QUERY_ALL
target_page: src/pages/species/SpeciesDetailPage.tsx
notion_page: https://app.notion.com/p/70c7a4d614748382844b017390e9b69d
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 상세 화면(`/species/:speciesId`) 개체 표의 mock 조회
(`getMockIndividuals`)를 `ANIMAL_MANAGE_QUERY_ALL`
(GET `/animal-manage/kind/{animalKindId}/animal`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/SpeciesDetailPage.tsx` (개체 표)
- `src/entities/individual`

# 연동할 API

- API ID: `ANIMAL_MANAGE_QUERY_ALL`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 종 상세 진입 시 개체 목록 API를 호출하고 `content[]`를
  `IndividualTable`에 표시한다.
  - 이름 `animalName`, 성별 `animalGender`(`MAN`/`WOMAN`/`UNKNOWN`),
    출생연도 `birthYear`(`{birthYear}년` 표기 유지).
  - 모델 `IndividualSex` 값을 서버 값 `MAN`/`WOMAN`/`UNKNOWN`으로 개명한다
    (2026-09-16 개발자 결정 — api 계층 매핑이 아니라 모델 개명).
- 검색은 `keyword`(개체명)로 서버에 전달하고 클라이언트 필터를 제거한다.
- 정렬 버튼을 제거한다(2026-09-16 개발자 결정). `sort`는 보내지 않고 서버
  기본 `id,desc`를 쓴다.
- 페이지네이션은 서버 쿼리(`page`, `size=10`)와 응답 `totalPages`를 쓴다.
  검색어 변경 시 1페이지로 되돌리는 동작 유지.
- 빈 목록·검색 결과 없음 문구는 기존 동작 유지.

# 기대 오류 동작

- 404(`ANIMAL_KIND_NOT_FOUND`)는 종 상세의 not-found 상태로 처리한다.
- 그 외 오류는 오류 상태로 표시하고 빈 목록으로 숨기지 않는다.

# 캐시 갱신 기대

- `individualQueryKeys.list(speciesId)` prefix를 유지하되 서버 파라미터
  (page, keyword)를 같은 prefix 아래 배열 key로 잇는다.
- 개체 생성·수정·삭제가 `individualQueryKeys.all`을 무효화하면 갱신된다.

# 페이지 이동 또는 사용자 알림

- 행 클릭 시 `/species/:speciesId/individuals/:individualId` 이동 유지
  (`content[].animalManageId` 사용).
- 케밥 `수정` 이동, `삭제`(→ `animal-manage-delete`) 동작 유지.

# 비고 및 제약

- 종 목록 화면의 종별 개체 조회(`useQueries` 검색용)는
  `animal-kind-query-all`의 서버 `keyword` 검색으로 대체되어 제거된다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `page` 시작값 — 명세 0-base vs 개발자 확인 1-base. **개발자 결정
   (2026-09-16): 1-base로 구현**, 명세 수정 요청은 백엔드 질문으로 남긴다.
2. `keyword`가 staging Swagger에 아직 없다(2026-09-16).
3. 목록 `animalGender`의 허용값이 명세에 선언돼 있지 않다(CREATE의 ENUM
   준용으로 기록 — contract Notes).
4. 정렬 버튼 제거는 퍼블리싱 spec·시나리오(species-detail S32, S1·S2 순서
   문구)와 어긋난다. 문서 수정·재승인 필요.
