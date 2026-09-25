---
feature: reservations-list
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 417:13157
  relatedNodeIds:
    - 1:5902
    - 1:6114
    - 1:6133
    - 417:13177
    - 417:13419
    - 417:13439
requires_functional_test: true
paths: src/pages/notices/reservations, src/entities/reservation, src/shared/ui/DataTable.tsx, src/shared/ui/KebabMenu.tsx
---

# 단체예약 현황 리스트 페이지 행동명세

## 상태와 근거

- Status: Draft (게이트 승인 대기 — 2026-09-20 디자인 개편 반영)
- 2026-09-17: 기준 Figma를 폐기된 `toyvillage-dev`에서 yot로 교체했다(#80).
- 2026-09-20: yot `단체예약` 섹션(`300:12763`) 개편을 반영했다. **행 체크박스 다중 선택과 `페이지 권한주기` 버튼·권한 부여 모달이 사라지고, 행마다 케밥(⋮) 메뉴(수정/삭제)가 생겼다.** 삭제는 확인 모달 + 토스트로 목록에서 처리한다. 자료실(`resources-list`)과 같은 목록 패턴이다.
- 기준 프레임: `417:13157` ("group reservation (kebab open)", 섹션 `단체예약 · 목록` `311:12767`)
- 기본 목록·정렬 메뉴: `1:5902` / 데이터 없음: `1:6114` / 검색결과 없음: `1:6133` / 삭제 확인 모달: `417:13177`
- 토스트: `417:13419`, `417:13439`(신규) — 구 프레임 `1:6014`·`1:6039`·`1:6064`·`1:6089` 는 옛 `페이지 권한주기` 버튼이 남아 있어 문구만 참고한다.
- 공통 테이블 프레젠테이션: `src/shared/ui/DataTable.tsx`(컬럼 설정 기반), 케밥: `src/shared/ui/KebabMenu.tsx`, 삭제 모달: `src/shared/ui/DeleteConfirmationDialog`
- 라우트: `src/app/App.tsx`의 `/notices/reservations`

## 목적

운영 관리자가 단체 방문 예약 현황을 상태별로 모니터링하고, 검색·정렬로 원하는 예약을 찾고, 행에서 바로 수정 화면으로 가거나 예약을 삭제한다.

## 범위

- 포함: 상태별 카운트 카드(사전답사 전/사전답사 완료/방문 완료)와 상태 필터, `단체예약 생성하기` 버튼, 테이블(상담일·예약일·예약 시간·단체명/지역·인원·케밥), 행 검색, 상담일순/예약일순 정렬, 페이지네이션, 행 클릭 → 읽기 전용 상세 이동, 케밥 `수정` → 수정 페이지, 케밥 `삭제` → 확인 모달 → 삭제, 생성/수정/삭제 결과 토스트, 데이터 없음·검색결과 없음 빈 상태
- 제외: 예약 상세/수정 화면 본문(각각 `reservations-detail`·`reservation-edit`), 행 다중 선택과 일괄 권한 부여(개편으로 폐기)

## 화면 구조 (Figma 417:13157)

1920px 데스크톱 기준. 좌상단 전역 메뉴 버튼은 `AppLayout`이 렌더한다. 본문은 너비 1320px, 좌우 중앙 정렬이다.

1. 타이틀 @300,124: `단체예약 현황` (60px SemiBold) + 부제 `토이빌리지의 단체 방문 일정을 모니터링` (32px, gray/60)
2. 상태 카운트 카드 3개 @300,278 (row, gap 21): 각 카드 `w240 · h130 · radius24 · padding 12/62 · column gap32`, white surface
   - `사전답사 전` / `사전답사 완료` / `방문 완료` 라벨(22px center, gray/70)과 각 상태 개수(40px center, black)
   - 카드는 카운트 표시 + **상태 필터 탭** 역할을 겸한다. 활성 카드는 blue-background(`accentBg`) 배경 + blue(`accent`) 숫자다.
     ※ yot 컴포넌트(`reservation / 진행 단계 요약` 145:14232)에는 선택 변형이 없지만, **필터와 활성 강조는 유지한다(개발자 결정 2026-09-20).**
3. `단체예약 생성하기` 버튼 @1416,355 (카드행 우측): gray/100 배경, white 24px SemiBold, radius 53, padding 12/16 → `/notices/reservations/create`
4. 테이블 카드 @300,440 (`w1320 · h520 · radius20 · border gray/60 1px`, white surface)
   - 헤더행(h52, gray/20 배경), 좌우 32 인셋 · 셀 padding 11/40:
     `상담일`(205) · `예약일`(200) · `예약 시간`(180) · `단체명/지역`(389) · `인원`(202) · 케밥 열(80, 헤더 라벨 없음)
   - **체크박스 열은 없다.**
   - 검색바(@40,76 · w1240 · h60 · gray/10 · radius44): search 아이콘 + placeholder `제목을 입력해주세요` + 우측 필터 아이콘
   - 행(h75): 상담일 + 예약일 + 예약 시간 + 단체명(24px)/지역(20px) + 인원(`n명`) + 케밥(⋮). 행 사이 divider(gray/60 1px, x40 w1240)
   - 페이지네이션(하단 중앙 @548,464): 이전/번호/다음, 활성 번호는 blue-background + blue
5. 정렬 드롭다운(필터 아이콘 클릭 시, `417:13161` @1444,571 w120): `상담일순` / `예약일순` (white, shadow, radius8)
6. 행 케밥 메뉴(`417:13172`, 컴포넌트 `kebab menu` 141:9597 `수정·삭제` 변형): w180, white, border gray/20, radius12, shadow, 항목 h48 padding 12/20 — `수정`(gray/100 20px) / `삭제`(red `#FF3131` 20px)
7. 삭제 확인 모달(`417:13177`): 공용 `DeleteConfirmationDialog` — `정말 삭제하시겠습니까?` / `삭제하신 뒤에는 영구삭제되며 복구 할 수 없습니다` / `취소`·`확인`
8. 토스트(우상단): 성공 = 초록 체크, 실패 = 빨강 느낌표
   - `데이터 생성에 성공했습니다` / `데이터 생성에 실패했습니다`
   - `데이터 삭제에 성공했습니다` / `데이터 삭제에 실패했습니다`
   - `권한 부여에 성공했습니다` / `권한 부여에 실패했습니다`
   - 수정 성공 문구는 Figma에 노드가 없어 같은 규칙으로 `데이터 수정에 성공했습니다`를 쓴다(개발자 결정, `resources-list`와 동일).

## 동작 (source of truth)

- 상태 카드 클릭 → 해당 상태(`pending`/`approved`/`rejected`)로 테이블을 필터하고 그 카드가 활성 표시된다. 카운트는 필터와 무관한 상태별 전체 개수다. 상태를 바꾸면 검색어를 비우고 1페이지로 간다.
- 검색어 입력 → 디바운스 후 서버에 `title`로 질의한다. 결과가 없으면 `검색결과가 없습니다`.
- 필터 아이콘 클릭 → `상담일순`/`예약일순` 메뉴. 선택 시 해당 기준으로 정렬하고 1페이지로 간다. 바깥 클릭·Escape로 닫힌다.
- 행 클릭(또는 Enter/Space) → `/notices/reservations/:id`(읽기 전용 상세)로 이동한다. 이동 state 로 현재 조회 조건(`listSearch`)을 넘겨 뒤로가기에서 복원한다.
- 케밥(⋮) 클릭 → 해당 행 메뉴가 열린다. **동시에 하나만 열린다.** 바깥 클릭·Escape로 닫힌다. 케밥 클릭은 행 클릭으로 전파되지 않는다.
- 케밥 `수정` → `/notices/reservations/:id/edit` 로 이동한다(`listSearch` 동반).
- 케밥 `삭제` → 메뉴를 닫고 삭제 확인 모달을 연다. `확인` → 삭제 요청. 성공하면 `['reservations','list']` 만 무효화하고 `데이터 삭제에 성공했습니다` 토스트를 띄운다. 실패하면 `데이터 삭제에 실패했습니다` 토스트를 띄우고 초점을 해당 행 케밥 버튼으로 되돌린다. `취소`/Escape도 초점을 되돌린다.
- 생성·수정 화면에서 돌아오면 이동 state 의 결과값으로 토스트를 한 번만 띄운다(state 는 즉시 제거해 새로고침·뒤로가기에서 다시 뜨지 않게 한다).
- 페이지네이션 → 서버 사이드. 상태·검색·정렬 변경 시 1페이지로 리셋한다. 삭제로 전체 페이지 수가 줄어 현재 page 가 범위를 넘으면 마지막 페이지로 되돌린다.

## 빈 상태

- 데이터 없음(`1:6114`): 테이블 카드(헤더 + 검색바)는 유지하고 본문에 `아직 단체예약이 없습니다`를 표시한다.
- 검색 결과 없음(`1:6133`): 같은 자리에 `검색결과가 없습니다`.
- 두 상태 모두 상태 카드와 `단체예약 생성하기` 버튼은 그대로 보인다.

## 데이터와 API 경계 (연동 완료)

```ts
type ReservationStatus = 'pending' | 'approved' | 'rejected'
interface Reservation {
  id: string
  status: ReservationStatus
  consultDate: string   // 상담일 2026.07.02
  reserveDate: string   // 예약일 2026.07.13
  reserveTime: string   // 예약 시간 13 : 01 (Figma 표기)
  groupName: string     // 단체명 대구유치원
  region: string        // 지역 대구광역시
  headcount: number     // 인원 18
}
```

- 목록: `GET /reservation` (`status`·`title`·`sort`·`page`·`size`) → `getAdminReservations` (`api/reservations-admin-query-all`)
- 삭제: `DELETE /reservation/{id}` → `deleteReservation` (`api/reservations-admin-delete`)
- query key: 목록 `['reservations','list', {...}]`, 상세 `['reservations', id]`
- **삭제 후에는 `['reservations','list']` 만 무효화한다.** `['reservations']` 로 넓히면 삭제된 id 의 상세를 다시 GET 해 404 가 난다.

## 접근성

- 상태 카드는 `aria-pressed` 로 선택 상태를 노출한다.
- 검색 input 은 프로그램적 label, 정렬 메뉴는 `menu`/`menuitemradio`.
- 행은 키보드로 활성화 가능(Enter/Space)하다.
- 케밥 버튼은 `${단체명} 관리 메뉴` 이름과 `aria-expanded` 를 갖고, 메뉴는 Escape 로 닫히며 초점이 버튼으로 돌아온다.
- 삭제 모달은 `role="dialog"`, modal semantics, 포커스 트랩, 호출 control 복귀.
- focus-visible 은 색만이 아닌 outline 으로 표현한다.

## 반응형

- 980px 이하에서 카드·테이블 padding 과 타이틀 크기를 줄이고, 테이블은 가로 스크롤 없이 조작 가능해야 한다.

## 기능 테스트 수용 기준

- S1: 리스트 진입 → 타이틀, 상태 카드 3개(각 카운트), `단체예약 생성하기` 버튼, 테이블(헤더 상담일·예약일·예약 시간·단체명/지역·인원 + 검색바 + 행), 페이지네이션이 보인다. 체크박스와 `페이지 권한주기` 버튼은 **없다**.
- S2: 상태 카드(예: 방문 완료) 클릭 → 그 상태만 테이블에 표시되고 카드가 활성 표시된다.
- S3: 검색어 입력 → 일치하는 행만 남고, 없으면 `검색결과가 없습니다`.
- S4: 필터 아이콘 → `상담일순`/`예약일순` 메뉴, 선택 시 해당 기준으로 정렬되고 메뉴가 닫힌다.
- S5: 행 클릭 → `/notices/reservations/:id`로 이동한다.
- S6: 행 케밥 클릭 → `수정`/`삭제` 메뉴가 열리고, 다른 행 케밥을 열면 앞 메뉴는 닫힌다.
- S7: 케밥 `수정` → `/notices/reservations/:id/edit`로 이동한다.
- S8: 케밥 `삭제` → 확인 모달 → `확인` → 목록에서 사라지고 `데이터 삭제에 성공했습니다` 토스트가 뜬다. 삭제 요청이 실패하면 `데이터 삭제에 실패했습니다` 토스트가 뜬다.
- S9: 데이터가 없을 때 → `아직 단체예약이 없습니다` 빈 상태를 표시한다.
- S10: 페이지네이션 이동, 상태·검색·정렬 변경 시 1페이지로 리셋된다.

## 미결 사항

- 없음 (권한 부여 모달은 개편으로 폐기 — `src/features/grant-reservation-access` 제거)
