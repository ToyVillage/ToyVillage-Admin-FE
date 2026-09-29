---
feature: reservations-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:6293
  relatedNodeIds:
    - 1:6494
requires_functional_test: true
paths: src/pages/notices/reservations/ReservationViewPage.tsx, src/features/reservation-form, src/entities/reservation
---

# 단체예약 현황 상세(읽기 전용) 페이지 행동명세

## 상태와 근거

- Status: Draft (게이트 승인 대기 — 2026-09-20 디자인 개편 반영)
- 2026-09-17: 기준 Figma를 폐기된 `toyvillage-dev`에서 yot로 교체했다(#80).
- 2026-09-20: yot 개편을 반영했다. **구 디자인의 `예약정보 카드 + 페이지 권한 카드(직원 제거)` 상세는 폐기됐다.** 새 상세는 생성/수정 폼과 같은 4개 섹션 카드를 **읽기 전용**으로 렌더한다. 수정은 목록 케밥 → `/notices/reservations/:id/edit` 에서만 한다(자료실 `resource` 와 같은 목록–보기–수정 패턴).
- 상세 화면 기준: yot Figma `1:6293` ("reservation detail", 섹션 `단체예약 · 상세` `311:12768`), 담당자 미배정: `1:6494`
- 리스트에서 행 클릭 → `/notices/reservations/:id` (리스트 spec `reservations-list` S5)
- 라우트: `src/app/App.tsx`의 `/notices/reservations/:id` → `ReservationViewPage`(신규)
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout`(App.tsx)이 전역 렌더하므로 페이지는 본문만 담당한다.

## 목적

운영 관리자가 단체예약 한 건의 상담·방문·사전답사 정보와 배정된 담당자를 편집 없이 확인한다.

## 범위

- 포함: 뒤로가기 링크, 4개 읽기 전용 섹션 카드(상담일 관련·방문일 관련·사전답사 관련·페이지 권한), 섹션 완료/미완료 배지, 섹션 접기/펼치기, 배정된 담당자 목록과 미배정 안내, 조회 중 레이아웃 유지
- 제외: 값 편집·저장·삭제(모두 `reservation-edit`·`reservations-list` 담당), 담당자 추가/취소(수정 화면에서만), 별도 '찾을 수 없음' 화면(디자인 없음 → 목록으로 되돌린다)

## 화면 구조 (Figma 1:6293)

1920px 데스크톱 기준. 본문 x300 w1320, 페이지 배경 gray/10(`background`).

1. `뒤로가기` @300,76 (컴포넌트 `back` 1:10470): gg:chevron-left 36x36 + `뒤로가기`(gray/60 24 SemiBold) → 목록(`listSearch` 복원)
2. 섹션 카드 4개(white · radius20 · 카드 간격 32)
   - 헤더(@0,0 · w1320 · padding 16/40 · space-between · gray/20 배경): 좌 = 상태 배지 + 제목(28 Medium gray/100), 우 = chevron 32
     - 배지: 완료 = `#A9ECDD` 배경 / `#00B48A` 글자, 미완료 = gray/10 배경 / gray/80 글자. h48 · padding 6/8 · radius12 · 아이콘 32
   - 본문(@40,112 · w1240 · column gap32): 라벨(20 Medium gray/100 + 필수 `*` red) 아래 **값 텍스트(22 Medium gray/100)** — 입력 박스 배경·테두리는 없다.
3. 카드별 필드
   - ① `상담일 관련` (h514): `단체명 *` / `지역 *` (각각 한 줄 전체) → row gap32: `상담일을 선택해주세요 *`(w392) · `예약인 이름 *` · `대표자 연락처를 입력해주세요 *`
   - ② `방문일 관련` (h380): row space-between: `총 인원 *`(값 + `명` 28 gray/60) · `인솔자 인원 *`(+ `명`) · `입장료를 입력해주세요 *`(천단위 콤마 + `원`) → row gap32: `방문일을 선택해주세요 *` · `방문 시간을 입력해주세요 *`
   - ③ `사전답사 관련` (h246): row gap32: `사전답사 인원 *` · `사전답사일을 선택해주세요 *` · `사전답사 시간을 입력해주세요 *`
   - ④ `페이지 권한` (h289): `배정됨`(18 SemiBold gray/40) 아래 담당자 행 — `{이름} {직급}`(24 Medium black), 행 padding 8/0, 하단 border gray/20 1px. **버튼 없음.**
4. 시간 표기: mdi:clock-outline 24 + 시작 칩(120x40 · gray/10 · 22 gray/60) + 화살표 24 + 종료 칩(120x40 · 배경 없음). 값이 없으면 `00 : 00`.
5. 미배정(`1:6494`): `배정됨` 아래에 `아직 배정된 담당자가 없습니다. 배정 가능 목록에서 담당자를 추가해주세요.`(gray/40, `배정 가능` 강조)

## 동작 (source of truth)

- 진입 시 상세(`GET /reservation/{id}`)와 담당자(`GET /reservation/assigned-employee/{id}`)를 병렬 조회한다.
- 조회 전에는 같은 자리에 같은 구조의 빈 카드를 두어 값이 도착해도 레이아웃이 튀지 않게 한다(박스 점프 금지).
- 섹션 완료/미완료 배지는 수정 폼과 같은 판정(`isSectionComplete`)을 쓴다. `페이지 권한`은 배정 인원이 1명 이상이면 완료다.
- 섹션 헤더(또는 chevron)를 클릭하면 해당 섹션이 접히고 다시 클릭하면 펼쳐진다. 배지는 접힘 여부와 무관하게 보인다.
- 어떤 값도 편집할 수 없다. 입력 요소·삭제·저장 버튼을 렌더하지 않는다.
- `뒤로가기` 클릭/Enter → 목록으로 이동한다(진입 시 받은 `listSearch` 로 조회 조건 복원).
- 잘못된 id·404·조회 실패 → 별도 화면 없이 목록으로 되돌린다(`replace`). 디자인에 없는 화면을 만들지 않는다.
- 떠날 때 상세 캐시를 버린다(`gcTime: 0`) — 삭제된 예약으로 다시 들어와도 stale 값이 보이지 않게 한다.

## 데이터와 API 경계 (연동 완료)

- 상세: `GET /reservation/{id}` → `getReservation` (`api/reservations-query`)
- 담당자: `GET /reservation/assigned-employee/{id}` → `getReservationEmployees` (`api/reservations-admin-employee-query-all`) — `배정됨` 목록만 사용한다.
- query key: `['reservations', id]`, `['reservations', id, 'employees']`

## 접근성

- 섹션 헤더는 `button` + `aria-expanded`.
- `뒤로가기` 는 링크 semantics 이며 키보드로 활성화된다.
- 라벨과 값은 시각 순서와 읽기 순서가 일치한다.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- 980px 이하에서 3열 행은 세로로 쌓이고 카드 padding 을 줄인다.

## 기능 테스트 수용 기준

- S1: `/notices/reservations/:id`(유효 id) 진입 → `뒤로가기`와 4개 섹션 헤더(상담일 관련·방문일 관련·사전답사 관련·페이지 권한)가 보인다.
- S2: 조회한 예약 값(단체명·지역·상담일·예약인·연락처·총 인원·입장료·방문일·사전답사 정보)이 텍스트로 정확히 표시된다.
- S3: 입력 요소와 `저장하기`·`삭제하기` 버튼이 **없다**(읽기 전용).
- S4: 섹션 헤더를 클릭하면 접히고 다시 클릭하면 펼쳐지며, 상태 배지(완료/미완료)가 계속 보인다.
- S5: `페이지 권한` 섹션에 배정된 담당자가 `{이름} {직급}` 으로 보인다. 배정이 없으면 미배정 안내 문구를 보여준다.
- S6: `뒤로가기` 클릭 → `/notices/reservations` 로 이동한다.
- S7: 존재하지 않는 id 로 진입 → 목록으로 되돌아간다.

## 미결 사항

- 없음
