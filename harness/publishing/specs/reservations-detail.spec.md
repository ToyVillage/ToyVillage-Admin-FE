---
feature: reservations-detail
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1631:875
requires_functional_test: true
paths: src/pages/notices/reservations, src/entities/reservation
---

# 단체예약 현황 상세 페이지 행동명세

## 상태와 근거

- Status: Draft
- 상세 화면 기준: Figma `1631:875` ("reservation detail")
- 리스트에서 행 클릭 → `/notices/reservations/:id` 로 진입(리스트 spec `reservations-list` S5의 이동 대상)
- 라우트: `src/app/App.tsx`의 `/notices/reservations/:id` (현재 `ReservationDetailPage` 스텁 → 본 슬라이스에서 구현)
- 좌상단 메뉴 아이콘·사이드바는 `AppLayout`(App.tsx)이 전역 렌더하므로 페이지는 본문만 담당한다.

## 목적

운영 관리자가 단체예약 한 건의 상세 정보(예약 일정·단체·요금·상태·인솔자)를 확인하고, 이 예약 페이지에 접근 권한을 가진 직원을 조회·검색·제거한다.

## 범위

- 포함: 뒤로가기 링크, 예약정보 카드(상담일·예약일·예약 시간 범위·예약인·전체 인원·지역·단체명·입장료·상태·인솔자 인원·인솔자 연락처), 페이지 권한 카드(직원 검색 + 권한 보유 직원 목록 + 직원별 `제거`), 로딩/찾을 수 없음 상태
- 제외: 예약 승인/반려/수정 처리, 실제 예약·직원·권한 저장 API(이번 슬라이스는 mock 경계), 권한 부여(추가) 모달(리스트 슬라이스 `3414:3724` 담당)

## 화면 구조 (Figma 1631:875)

1920px 데스크톱 기준. 본문은 좌측 x300, 상단 두 카드가 가로로 배치된다. 페이지 배경 gray/10(`background`).

1. 뒤로가기 `back` @300,76 (w1320): gg:chevron-left 36x36 + `뒤로가기`(gray/60 24 SemiBold). 클릭/Enter → 리스트(`/notices/reservations`)로 이동. 기존 `GuideBackLink` 패턴(인라인 chevron SVG + 링크)을 참고해 예약용으로 만든다.
2. 예약정보 카드 @300,144 (w873 · h530 · white surface · radius20)
   - 헤더행 h52, gray/20(#DDDDE3) 배경: `material-symbols:info` 아이콘 24x24 + `예약정보`(gray/100 20 SemiBold)
   - 필드 라벨은 18 Medium gray/100, 값은 24 Medium(단체명만 36 SemiBold). 라벨/값 column gap 8.
   - 상단 한 행: `상담일`(2026.07.02) · `예약일`(2026.07.13) · `예약 시간`(13 : 01 ~ 15 : 00) · `예약인`(이승현) · `전체 인원`(12명)
   - `지역`: 대전광역시 유성구 장동 (리스트의 지역보다 상세 주소)
   - `단체명`: 대덕소프트웨어마이스터고 (36 SemiBold)
   - 하단 한 행(gap32): `입장료`(200,000원, 28 blue `accent`) · `상태`([check-circle 28 blue] 답사 완료, 28 blue) · `인솔자 인원`(3명, 28 SemiBold) · `인솔자 연락처`(010-7753-9698, 28)
3. 페이지 권한 카드 @1193,144 (w427 · h530 · white surface · radius20)
   - 헤더행 h52, gray/20 배경: `ic:baseline-shield` 아이콘 24x24 + `페이지 권한`(20 SemiBold)
   - 검색바 (w347 · gray/10 배경 · radius44 · padding 16/12): search 아이콘 26x26 + placeholder `검색할 직원 이름 입력`(gray/40 20). (필터 아이콘 없음 — Figma 최신본 3551 기준)
   - 직원 행(space-between): 좌측 아바타 원 48x48(#CECECE radius48) + `{이름} {직급}`(예: 홍길동 과장, 24 SemiBold), 우측 `제거` pill(border gray/100 1px, radius100, padding 12/3, 라벨 18 Medium)

아이콘(info·shield·check-circle·search)은 Figma 벡터 에셋을 다운로드해 사용한다(인라인 근사 금지).

배경·surface·텍스트·blue 강조는 기존 theme를 재사용한다. 카드 헤더 gray/20(#DDDDE3)와 아바타 gray(#CECECE)는 신규 의미 토큰 후보(게이트에서 명명, 기존 `tableHeader`/`avatar`와 통합 여부 판단).

## 동작 (source of truth)

- 진입 시 URL의 `:id`로 예약 단건을 조회한다(mock `getMockReservation`). 로딩 중이면 로딩 안내, 없으면 "찾을 수 없음" + 목록 링크를 보인다(기존 `ResourceDetailPage` 상태 패턴 참고).
- 조회한 예약의 상세 필드를 예약정보 카드에 렌더한다. 예약 시간은 시작~종료 범위로 표시한다.
- 페이지 권한 카드는 이 예약에 접근 권한을 가진 직원 목록을 보인다(mock 경계: 리스트 슬라이스가 남긴 `reservationAccessStorageKey` 매핑 → 직원 이름 해석). 권한 직원이 없으면 목록은 빈 상태로 둔다.
- 검색어 입력 → 직원 이름 기준으로 권한 목록을 필터한다(부분 일치). 결과 없으면 목록만 비운다.
- 직원 행의 `제거` 클릭 → 삭제 확인 모달(Figma 3551:4565, 기존 `DeleteConfirmationDialog` 재사용: "정말 삭제하시겠습니까?" + 취소/확인)을 연다. `확인` 시 해당 직원을 권한 목록에서 제거(mock 저장 경계 호출)하고 모달을 닫는다. `취소`/Escape는 변경 없이 닫는다.
- 뒤로가기 클릭/Enter → `/notices/reservations`로 이동한다.

## 데이터와 API 경계 (mock)

리스트 슬라이스의 `Reservation`은 목록용 최소 필드만 가진다. 상세는 추가 필드가 필요하므로 `entities/reservation`에 상세 타입을 확장한다.

```ts
interface ReservationDetail extends Reservation {
  reserveTimeEnd: string   // 예약 종료 시간 15 : 00 (표시: 13 : 01 ~ 15 : 00)
  reserverName: string     // 예약인 이승현
  regionDetail: string     // 상세 지역 대전광역시 유성구 장동
  admissionFee: number     // 입장료 200000 (표시 200,000원)
  surveyStatus: string     // 상태 라벨 "답사 완료" (리스트 status와 별개 계열 — 미결 참조)
  guideCount: number       // 인솔자 인원 3
  guideContact: string     // 인솔자 연락처 010-7753-9698
}
```

- 조회 후보: 단건 `GET /reservations/:id`
- 권한 조회 후보: `GET /reservations/:id/access` → 직원 목록. 제거 후보: `DELETE /reservations/:id/access/:staffId`
- query key: `['reservations', id]`, 권한은 `['reservations', id, 'access']`
- 현재 슬라이스는 mock(`getMockReservation` 확장 + `reservationAccessStorageKey` in-memory/localStorage)으로 대체한다. 실제 API·권한 저장은 별도 `/api` 슬라이스에서 확정한다. mock 직원 이름에 직급이 없으므로 표시용 직급은 mock에서 부여한다.

## 컴포넌트 경계 (design-rules §7)

- `ReservationDetailPage`(페이지): 조회·상태(로딩/없음)·레이아웃 조립.
- `ReservationInfoCard`: 예약정보 카드(필드 프레젠테이션). `entities/reservation/ui` 후보.
- `ReservationAccessCard`: 페이지 권한 카드(검색 + 권한 직원 목록 + 제거). 검색·필터는 페이지 상태로, 제거는 콜백으로 위임.
- 뒤로가기: `GuideBackLink` 패턴을 참고한 예약용 back 링크.

## 접근성

- 뒤로가기는 링크 역할(키보드 활성화), focus-visible은 outline으로 표현한다.
- 검색 input은 프로그램적 label(`검색할 직원 이름`).
- 각 `제거` 버튼은 `${이름} 권한 제거` 이름을 갖는다.
- 카드 헤더는 섹션 제목(`예약정보`/`페이지 권한`) semantics로 제공한다.
- 상태 아이콘(check-circle)은 장식(aria-hidden), 상태 텍스트로 의미를 전달한다.

## 반응형

- 980px 이하에서 두 카드를 세로로 쌓고 카드 padding·타이틀 크기를 줄인다. 가로 스크롤 없이 조작 가능해야 한다.

## 기능 테스트 수용 기준

- S1: 상세 진입(`/notices/reservations/:id`) → 뒤로가기, 예약정보 카드(단체명·상담일·예약일·예약 시간 범위·예약인·전체 인원·지역·입장료·상태·인솔자 인원·인솔자 연락처), 페이지 권한 카드(검색바)가 보인다.
- S2: 유효한 id의 예약 값이 카드에 정확히 렌더된다(예: 단체명, 예약 시간 `시작 ~ 종료`, 입장료 `n원`).
- S3: 존재하지 않는 id → "찾을 수 없음" 안내와 목록으로 돌아가는 링크가 보인다.
- S4: 뒤로가기 클릭 → `/notices/reservations`로 이동한다.
- S5: 페이지 권한 카드에 권한 보유 직원 목록이 보이고, 검색어 입력 시 이름이 일치하는 직원만 남는다.
- S6: 직원 행의 `제거` 클릭 → 해당 직원이 목록에서 사라진다.

## 미결 사항

- [ ] 상태 `답사 완료`의 필드 의미 — 리스트 status(pending/approved/rejected)와 별개인지, 하위 상태(답사/실사 단계)인지 게이트에서 확정
- [ ] 직급(과장 등)·아바타 이미지 데이터 출처 — 실제 직원 API 계약(`/api` 슬라이스)
- [ ] 카드 헤더 gray/20·아바타 gray 토큰 명명(기존 `tableHeader`/`avatar` 통합 여부)
