---
feature: reservations-list
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1628:810
  relatedNodeIds:
    - 3414:3724
    - 2413:3303
requires_functional_test: true
paths: src/pages/notices/reservations, src/entities/reservation, src/features/grant-reservation-access, src/shared/ui/DataTable.tsx
---

# 단체예약 현황 리스트 페이지 행동명세

## 상태와 근거

- Status: Draft
- 리스트 화면 기준: Figma `1628:810` ("group reservation")
- 권한 부여 모달: Figma `3414:3724` — ⚠️ Figma API rate limit(Starter)로 라이브 추출 보류. 해제 후 정확한 시각 디테일 반영.
- 빈 상태(데이터 없음): Figma `2413:3303` — ⚠️ 동일 사유로 추출 보류.
- 공통 테이블 프레젠테이션: `src/shared/ui/DataTable.tsx` (notice/resource 목록과 공유) — 이번 슬라이스에서 컬럼 설정 기반으로 일반화한다(아래 참조).
- 라우트: `src/app/App.tsx`의 `/notices/reservations` (현재 `NoticeReservationsPage` 스텁)

## 목적

운영 관리자가 단체 방문 예약 현황을 상태별로 모니터링하고, 검색·정렬로 원하는 예약을 찾고, 여러 예약을 선택해 접근 권한을 가진 직원을 일괄 지정한다.

## 범위

- 포함: 상태별 카운트 카드(사전답사 전/사전답사 완료/방문 완료)와 상태 필터, 테이블(상담일·예약일·예약시간·단체명/지역·인원), 행 검색, 상담일순/예약일순 정렬, 페이지네이션, 행 클릭 → 상세 이동, 행 체크박스 다중 선택, `페이지 권한주기` → 권한 부여 모달, 데이터 없음 빈 상태
- 제외: 예약 상세 페이지 본문(별도 슬라이스), 실제 예약/직원 데이터 및 권한 저장 API(이번 슬라이스는 mock), 예약 생성/승인/반려 처리

## 화면 구조 (Figma 1628:810)

1920px 데스크톱 기준. 좌상단 전역 메뉴 버튼은 기존 사이드바 기능을 재사용한다. 본문은 너비 1320px, 좌우 중앙 정렬이다.

1. 타이틀: `단체예약 현황` (60px SemiBold) + 부제 `토이빌리지의 단체 방문 일정을 모니터링` (32px, gray/60)
2. 상태 카운트 카드 3개 (row, gap 21): 각 카드 `w240 · radius24 · padding 12/62 · column gap32`
   - `사전답사 전` / `사전답사 완료` / `방문 완료` 라벨(22px center)과 각 상태 개수(40px center)
   - **활성 카드**는 blue-background(`accentBg`) 배경 + blue(`accent`) 숫자, 비활성은 white 배경 + 라벨 gray, 숫자 black. 기본 활성은 `사전답사 전`.
   - 카드는 카운트 표시 + **상태 필터 탭** 역할을 겸한다(클릭 시 해당 상태로 테이블 필터).
3. `페이지 권한주기` 버튼 (테이블 우측 상단): gray/100 배경, white 24px SemiBold, radius 53
4. 테이블 카드 (`w1320 · radius20 · border gray/60 1px`, white surface)
   - 헤더행(h52, gray/20 배경): 체크박스(라벨 없음) · `상담일`(180) · `예약일`(180) · `예약 시간`(180) · `단체명/지역`(540) · `인원`(240)
   - 검색바(gray/10, radius44): search 아이콘 + placeholder `제목을 입력해주세요` + 필터 아이콘
   - 행(h75): 체크박스 + 상담일 + 예약일 + 예약시간 + 단체명(24px)/지역(20px) + 인원(`n명`). 행 사이 divider. 행 클릭 → 상세 이동
   - 페이지네이션(하단 중앙): 이전/번호/다음, 활성 번호는 blue-background + blue
5. 정렬 드롭다운(필터 아이콘 클릭 시): `상담일순` / `예약일순` (white, shadow, radius8)

배경·surface·텍스트·blue 강조는 기존 theme를 재사용한다. 카운트 카드 라벨색(gray/50·gray/70)과 테이블 헤더(gray/20)는 신규 의미 토큰 후보(게이트에서 명명).

## 동작 (source of truth)

- 상태 카드 클릭 → 해당 상태(`pending`/`approved`/`rejected`)로 테이블을 필터하고, 그 카드가 활성 표시된다. 카운트는 상태별 전체 개수를 표시한다.
- 검색어 입력 → 단체명/지역 기준으로 현재 상태 목록을 필터한다. 결과가 없으면 빈 상태 메시지.
- 필터 아이콘 클릭 → `상담일순`/`예약일순` 메뉴 표시. 선택 시 해당 날짜 기준 정렬(기본 최신 우선). 바깥 클릭·Escape로 닫힌다.
- 행 클릭(또는 Enter/Space) → `/notices/reservations/:id` 상세로 이동한다.
- 행 체크박스 토글 → 선택 상태 갱신. 헤더 체크박스로 현재 페이지 전체 토글.
- `페이지 권한주기` 클릭 → 선택된 예약이 없으면 안내(검증 모달), 있으면 권한 부여 모달을 연다.
- 페이지네이션 → 현재 필터/정렬 결과를 PAGE_SIZE로 나눠 페이지 이동. 상태·검색 변경 시 1페이지로 리셋.

## 권한 부여 모달 (Figma 3414:3724)

- 진입: 하나 이상 선택 + `페이지 권한주기`.
- 구조: 제목 `권한 줄 직원을 선택해주세요`, 직원 이름 검색바(placeholder `검색할 직원 이름 입력`), 직원 목록(각 행: 아바타 + `{이름} 사원` + `추가`/`추가 완료` 토글 버튼), 하단 `취소`/`확인`.
- `추가`(blue 채움) 클릭 → `추가 완료`(blue 외곽선) 토글로 해당 직원을 선택/해제한다.
- 확인 시 mock 저장 경계만 호출하고(실 API 없음), 모달을 닫고 예약 선택을 초기화한다. 취소/Escape는 변경 없이 닫는다.
- 접근성: `role="dialog"`, modal, 포커스 트랩, 호출 control 복귀.

## 빈 상태 (Figma 2413:3303)

- 예약 데이터가 없으면 테이블 카드(헤더 + 검색바)는 유지하고 본문에 `아직 단체예약이 없습니다`를 표시한다. 검색 결과 없음(`검색결과가 없습니다`)과 문구로 구분한다.
- 데이터가 없을 때는 `페이지 권한주기` 버튼을 숨긴다.

## 공유 컴포넌트 일반화 — `DataTable`

현재 `DataTable`은 고정 3컬럼(분류/제목/날짜) + 최신순/오래된순 정렬 전용이다. 예약 테이블을 위해 **컬럼 설정 기반**으로 일반화하고, 기존 소비처(NoticeTable·ResourceTable)도 새 API로 마이그레이션한다(재사용 용이). 렌더 결과·기존 동작은 보존한다.

- `columns: { key, header, width, align?, render?(row) }[]` — 컬럼을 데이터로 기술
- `rows: ({ id: string } & Record<string, ReactNode>)[]`
- `selection?: { selectedIds, onToggle, onToggleAll }` — 지정 시 체크박스 컬럼 추가
- `sort?: { value, options: { value, label }[], onChange, ariaLabel }` — 정렬 옵션 라벨을 주입(기존 하드코딩 `최신순/오래된순` 제거, notice가 옵션으로 전달)
- 기존 `search`·`pagination`·`emptyLabel`·`onRowClick`·`rowTestId`는 유지
- notice/resource는 기존과 동일한 헤더·pill·행 텍스트·정렬 라벨을 렌더하도록 컬럼/옵션을 구성 → 해당 목록의 승인·동결 시나리오 불변

## 데이터와 API 경계 (mock)

```ts
type ReservationStatus = 'pending' | 'approved' | 'rejected'
interface Reservation {
  id: string
  status: ReservationStatus
  consultDate: string   // 상담일 2026.07.02
  reserveDate: string   // 예약일 2026.07.13
  reserveTime: string   // 예약 시간 13 : 01 (Figma 표기)
  groupName: string     // 단체명 대구어린이집
  region: string        // 지역 대구광역시
  headcount: number      // 인원 18
}
interface Staff { id: string; name: string }
```

- 조회 후보: `GET /reservations`(상태·검색·정렬·페이지 쿼리), 단건 `GET /reservations/:id`
- 권한 후보: `POST /reservations/access` { reservationIds, staffIds }
- query key: `['reservations']`
- 현재 슬라이스는 localStorage/in-memory mock으로 대체한다. 실제 API 연결·권한 저장은 별도 `/api` 슬라이스에서 확정한다.

## 접근성

- 상태 카드는 라디오/탭 semantics(선택 상태 노출)로 제공한다.
- 검색 input은 프로그램적 label, 정렬 메뉴는 `menu`/`menuitemradio`.
- 행은 키보드로 활성화 가능(Enter/Space)한 링크 역할. 체크박스는 `${단체명} 선택` 이름.
- 권한 모달은 `role="dialog"`, modal semantics, 포커스 트랩, 호출 control 복귀.
- focus-visible은 색만이 아닌 outline으로 표현한다.

## 반응형

- 980px 이하에서 카드·테이블 padding과 타이틀 크기를 줄이고, 테이블은 가로 스크롤 없이 조작 가능해야 한다.

## 기능 테스트 수용 기준

- S1: 리스트 진입 → 타이틀, 상태 카드 3개(각 카운트), `페이지 권한주기` 버튼, 테이블(헤더·검색·행), 페이지네이션이 보인다.
- S2: 상태 카드(예: 방문 완료) 클릭 → 그 상태만 테이블에 표시되고 카드가 활성 표시된다.
- S3: 검색어 입력 → 단체명/지역이 일치하는 행만 남고, 없으면 빈 상태 메시지.
- S4: 필터 아이콘 → `상담일순`/`예약일순` 메뉴, 선택 시 해당 기준으로 정렬된다.
- S5: 행 클릭 → `/notices/reservations/:id`로 이동한다.
- S6: 행 체크박스 선택 후 `페이지 권한주기` → 권한 부여 모달이 열린다.
- S7: 선택 없이 `페이지 권한주기` → 선택 필요 안내 모달을 표시한다.
- S8: 권한 모달에서 직원 선택 + 확인 → 모달이 닫히고 선택이 초기화된다. 취소/Escape → 변경 없이 닫힌다.
- S9: 데이터가 없을 때 → 빈 상태를 표시한다.
- S10: 페이지네이션 이동, 상태·검색 변경 시 1페이지로 리셋된다.

## 미결 사항

- [ ] 권한 모달(`3414:3724`)·빈 상태(`2413:3303`)의 정확한 시각/카피 — Figma rate limit 해제 후 확정
- [ ] 예약 상세 페이지(`/notices/reservations/:id`) 본문 — 별도 슬라이스
- [ ] 실제 예약/직원/권한 API 계약 — `/api` 슬라이스
