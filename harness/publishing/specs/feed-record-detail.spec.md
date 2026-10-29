---
feature: feed-record-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 3129:25402
  relatedNodeIds:
    - 3129:25401
    - 3130:25980
    - 3129:25462
    - 3129:25511
    - 3133:25769
    - 3133:25915
    - 3133:26090
requires_functional_test: true
paths: src/pages/feeds, src/entities/feed, src/shared/ui
---

# 급여 기록 상세 행동명세

## 상태와 근거

- Status: Active (신규, 2026-10-28 — 이슈 #273, Linear TOY-67)
- 기준 프레임: Figma 섹션 `3129:25401`(`먹이 급여 관리 · 기록 상세`)
  - `3129:25402` feeding record detail (4층) — 기본
  - `3130:25980` feeding record detail (5층)
  - `3129:25462` (kebab open), `3129:25511` (delete), `3133:25769` (load error)
  - 토스트: `3133:25915` 수정 성공, `3133:26090` 삭제 실패
- 목록 행 클릭으로 들어오는 화면이다. 개체의 급여 이력은 `feed-detail.spec.md`(개체별 급여 이력)가 담당한다.
- 추출 캐시: `harness/artifacts/publishing/feed-record-detail.figma.txt`

## 목적

직원이 앱으로 올린 급여 기록 하나를 앱 입력 칸 그대로 확인하고, 수정·삭제하거나 그 개체의 급여 이력으로 넘어간다.

## 범위

- 포함: 뒤로가기, 제목·부제, 필드 카드, 케밥(수정·삭제), 삭제 확인, `급여 이력 보기`, 불러오기 실패, 토스트
- 제외: 실제 API 연동(4층은 이미 연동된 상세 조회·삭제를 쓰고 5층은 mock 경계)

## 라우트와 진입

- `/feeds/:id` → 4층 급여 기록 상세, `/feeds/fifth-floor/:id` → 5층 급여 기록 상세. `:id` 는 급여 기록 id.
- 기존 `/feeds/:id` 는 개체 사진·이력 표가 있던 화면이었다. 이제 그 내용은 `개체별 급여 이력`(`feed-detail.spec.md`)으로 옮긴다.
  대시보드 `먹이 급여 관리` 행(`/feeds/{feedLogId}`)은 이 화면으로 온다.
- `뒤로가기` → 들어온 목록 주소(state `listSearch`)의 `/feeds` 로 간다. state 가 없으면 `/feeds`.
- id 가 양의 정수가 아니거나 없는 기록(404) → `/feeds` 로 되돌린다(기존 규약).

## 동작 (behavioral spec — source of truth)

- 제목 `급여 기록 상세`(40px), 부제 `<일반명> · <개체명>의 급여 기록입니다`(24px 회색).
- 필드 카드(각 카드: 라벨 32px + 값 24px, 흰 배경 radius 20, 카드 간격 16)는 층마다 앱 입력 칸만 보여준다.
  - 4층: `대상 개체`(`<일반명> · <개체명>`) / `급여일시`(`YYYY.MM.DD HH:mm`) / `급여자` / `먹이 종류` / `급여량` / `잔량` / `특이사항`
  - 5층: `대상 개체` / `급여일`(`YYYY.MM.DD`) / `급여자` / `먹이 종류` / `급여량`
  - 급여량·잔량은 `150 g/ml` · `1.2 kg/l` 형식(`GML`·`KGL`). 잔량·특이사항이 없으면 `-`.
- `대상 개체` 카드 오른쪽에 `급여 이력 보기 >` 버튼(옅은 파랑 pill) → 그 개체의 급여 이력 화면
  (`/feeds/animals/:animalId` 또는 `/feeds/fifth-floor/animals/:animalId`)으로 간다.
- 제목 오른쪽 케밥(⋮) → 메뉴 `수정` / `삭제`(빨강).
  - `수정` → 그 층의 수정 화면으로 간다(state `from: 'record'`, `listSearch` 유지).
  - `삭제` → 공통 삭제 확인 모달. `확인` → 삭제 요청 1회.
    성공 → 그 개체의 급여 이력 화면으로 이동하고 `데이터 삭제에 성공했습니다` 토스트(Figma `3133:26051`).
    실패 → 이 화면에 머물고 `데이터 삭제에 실패했습니다` 토스트(`3133:26090`).
- 수정 화면에서 저장하고 돌아오면 이 화면에서 `데이터 수정에 성공했습니다` 토스트(`3133:25915`).
- 조회 중에는 같은 카드 구조를 그리고 값 자리만 막대로 채운다(화면이 튀지 않게, 진입 시 맨 위로 스크롤).
- 조회 실패(404 제외) → 카드 대신 오류 카드: `정보를 불러오지 못했습니다` / `일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요` /
  `다시 시도` 버튼(누르면 다시 조회). `뒤로가기` 는 남는다(Figma `3133:25769`).

## 화면 구조와 시각 규격 (1920 기준)

- 본문 1320px(x=300). `뒤로가기` @300,75(공용 `BackLink`). 제목 @300,144, 부제 @300,200. 첫 카드 @300,260.
- 카드 padding 28px 32px, 라벨↔값 8px. `급여 이력 보기` 버튼: 높이 52, 좌우 padding 20, 22px Medium 파랑 글자, 옅은 파랑 배경, radius 8, 오른쪽 화살표.
- 케밥: 제목 줄 오른쪽 끝(x 1580), 메뉴는 공용 `KebabMenu`(180px).

## 데이터

- 4층 상세: 기존 연동 `getFeedDetail`(`GET /feed-log/admin/{id}`) — 응답 `feedUnit` 을 더 읽어 단위를 표시한다. 이력은 이 화면에서 부르지 않는다.
- 5층 상세: 퍼블리싱 mock `getFifthFloorFeedDetail({ feedLogId })`(`/api` 가 교체).
- 삭제: 4층 기존 연동 `deleteFeed`, 5층 mock `deleteFifthFloorFeed`. 성공 후 목록 무효화, 그 기록 상세 query 제거.
- 쿼리키: `feedQueryKeys.detail(floor, id)`.

## 컴포넌트 구조/props

- `FeedRecordDetailPage { floor }` (pages/feeds) — 라우트·조회·케밥·삭제·토스트 소유.
- `FeedRecordFields { floor, feed? }` (entities/feed/ui) — 필드 카드 목록. `feed` 가 없으면 막대 자리.
- 오류 카드는 기존 공용 상태 카드 규격을 쓴다. 새 shared 컴포넌트가 필요하면(오류 카드 + 다시 시도) 중간 게이트에서 확정한다
  — 후보 `LoadErrorCard { onRetry }`(shared/ui). 같은 프레임이 수정·개체별 이력에도 있다.
