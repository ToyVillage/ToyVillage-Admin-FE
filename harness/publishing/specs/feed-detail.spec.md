---
feature: feed-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 749:14665
  relatedNodeIds:
    - 2440:25663
    - 3316:25799
    - 3125:25347
    - 3125:25386
    - 3133:25752
    - 3133:26051
requires_functional_test: true
paths: src/pages/feeds, src/entities/feed, src/shared/ui
---

# 개체별 급여 이력 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-10-28 (4층·5층 수정안 — 이슈 #273, Linear TOY-67). 이전 `/feeds/:id` 상세(급여 기록 카드 + 이력)는
  `급여 기록 상세`(`feed-record-detail.spec.md`)와 이 화면으로 나뉘었다.
- 기준 프레임: Figma 섹션 `2440:25663`(`먹이 급여 관리 · 개체별 급여 이력`)
  - `749:14665` individual detail (4층) — 기본
  - `3316:25799` individual detail (5층)
  - `3125:25347` (kebab open), `3125:25386` (delete), `3133:25752` (load error)
  - 토스트 `3133:26051` 삭제 성공
- 추출 캐시: `harness/artifacts/publishing/feed-detail.figma.txt`

## 목적

개체 하나의 기본 정보와 그 개체의 급여 기록 전체를 층의 앱 입력 칸대로 훑고, 기록을 수정·삭제한다.

## 범위

- 포함: 뒤로가기, 개체 카드, `급여 이력` 섹션 헤더와 표, 행 케밥(수정·삭제), 불러오기 실패, 삭제 성공 토스트
- 제외: 실제 API 연동(4층 이력은 이미 연동, 5층은 mock 경계), 이력 페이지네이션

## 라우트와 진입

- `/feeds/animals/:animalId` → 4층 개체, `/feeds/fifth-floor/animals/:animalId` → 5층 개체. `:animalId` 는 개체 id.
- 진입: 급여 기록 상세의 `급여 이력 보기`, 또는 그 화면에서 삭제 성공 후 이동.
- `뒤로가기` → 브라우저 기록의 이전 화면. 이전 기록이 없으면 `/feeds`.
- id 가 양의 정수가 아니면 `/feeds` 로 되돌린다.

## 동작 (behavioral spec — source of truth)

- 개체 카드(흰 배경 radius 20):
  - 왼쪽 개체 사진 180×180 radius 20. 사진이 없으면 같은 자리에 회색 사각형.
  - 개체명(40px) 오른쪽에 성별 뱃지(`♂ 수컷` / `♀ 암컷`)와 층 뱃지(`4층` / `5층`) — 옅은 파랑 pill.
  - `출생연도` `<YYYY>년`, `기타정보` `<개체 메모>`(없으면 `-`). 라벨 회색 18px, 값 22px.
  - 오른쪽 위 `관찰 및 특이사항 보러가기 >` 버튼 → 그 개체 상세(`/species/:speciesId/individuals/:animalId`)로 간다.
- `급여 이력` 섹션 헤더: 제목 `급여 이력` + 건수 `N건`(표 행 수).
- 급여 이력 표(디자인 시스템 `list` 외형, 최신이 위):
  - 4층 열: `급여일시`(`YYYY.MM.DD HH:mm`) / `먹이 종류` / `급여량` / `잔량` / `특이사항` / `급여자` / 케밥
  - 5층 열: `급여일`(`YYYY.MM.DD`) / `먹이 종류` / `급여량` / `급여자` / 케밥
  - 단위는 `g/ml`·`kg/l`. 잔량·특이사항이 없으면 `-`. 특이사항이 길면 말줄임표.
  - 행을 누르면 그 급여 기록 상세(`/feeds/:id`, 5층은 `/feeds/fifth-floor/:id`)로 간다. 상세의 `뒤로가기`는 이 이력으로 돌아온다(2026-10-28 개발자 요청). 페이지네이션 없이 전체를 보여준다.
- 이력이 없으면 → 행 대신 `급여 이력이 없습니다.`, 건수 `0건`(기존 문구 유지).
- 행 케밥 → `수정` / `삭제`. `수정` → 그 층 수정 화면(state `from: 'history'`). 저장 성공 후 이 화면으로 돌아와 `데이터 수정에 성공했습니다`.
  `삭제` → 공통 삭제 확인 모달 → 성공 시 표에서 사라지고 `데이터 삭제에 성공했습니다`, 실패 시 `데이터 삭제에 실패했습니다`.
- 조회 중에는 같은 카드·섹션·표를 그리고 값 자리만 막대로 채운다(#231 규약 유지).
- 개체 또는 이력 조회 실패 → 오류 카드(`정보를 불러오지 못했습니다` / `일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요` / `다시 시도`).

## 화면 구조와 시각 규격 (1920 기준)

- `뒤로가기` @300,75. 개체 카드 @300,144 1320×296(padding 40). `급여 이력` 헤더 @300,510. 표 @300,580.
- 4층 표 열 폭: 급여일시 250(`YYYY.MM.DD HH:mm` 이 잘리지 않게, 2026-10-28 개발자 요청) / 먹이 종류 220 / 급여량 140 / 잔량 140 / 특이사항 나머지 / 급여자 150 / 케밥 80.
- 5층 표 열 폭: 급여일 200 / 먹이 종류 나머지 / 급여량 220 / 급여자 190 / 케밥 80.

## 데이터

- 개체: 기존 연동 `getIndividual`(`GET /animal-manage/{id}`) — 이름·성별·출생연도·메모·사진·`animalKindId`.
- 4층 이력: 기존 연동 `getFeedHistory(animalId)`(`GET /feed-log/admin/history/{id}`) — `feedUnit` 을 더 읽는다.
- 5층 이력: 퍼블리싱 mock `getFifthFloorFeedHistory(animalId)`(`/api` 가 교체).
- 쿼리키: `feedQueryKeys.history(floor, animalId)`, 개체는 기존 개체 상세 키.

## 컴포넌트 구조/props

- `FeedAnimalHistoryPage { floor }` (pages/feeds) — 기존 `FeedDetailPage` 를 대체한다.
- `FeedAnimalCard { individual?, floor }` (entities/feed/ui) — 기존 `FeedRecordCard` 를 대체한다. 뱃지는 기존 `AnimalSpeciesBadge` 규격을 쓴다.
- `FeedHistoryTable { floor, records, renderRowAction, emptyLabel, loading }` (entities/feed/ui) — 층별 열.
- `SectionHeader`, `BackLink`, `KebabMenu`, 삭제 확인 모달은 기존 공용 컴포넌트를 재사용한다.
