---
feature: reservation-edit
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 4660:7623
  relatedNodeIds:
    - 4660:7623
    - 5190:7575
    - 4927:9326
    - 4520:9075
requires_functional_test: true
paths: src/pages/notices/reservations/ReservationDetailPage.tsx, src/features/reservation-form, src/entities/reservation
---

# 단체예약 상세·수정 페이지 행동명세

## 상태와 근거

- Status: Draft (게이트 승인 대기)
- 수정(전체 펼침·데이터): Figma `4899:8525` / 참고(am·pm, 배정, 하단 삭제·저장): `4660:7623` / 검증 에러: `5190:7575`
- 진입: 리스트 행 클릭 → `/notices/reservations/:id` (기존 라우트). **기존 읽기 전용 `reservations-detail`(예약정보 카드+페이지 권한 카드)를 이 편집 폼으로 대체한다.**
- 생성 페이지와 레이아웃 동일(공용 `ReservationForm`). 차이는 (a) 초기값이 조회 데이터로 채워짐 (b) 하단 액션이 `삭제하기`/`저장하기` (c) 페이지 권한 섹션에 배정팀(취소하기)이 채워짐.
- API 미연동(publishing) — 조회/저장/삭제는 mock 경계. 실제 연동은 별도 `/api` 슬라이스(이미 상세 조회/권한 조회·삭제 API는 연동됨 — 폼 편집 저장 계약은 미확정).

## 목적

운영 관리자가 기존 단체예약을 조회한 화면에서 값을 수정·저장하거나 예약을 삭제하고, 페이지 접근 권한(배정)을 조정한다.

## 화면 구조

`reservation-create`와 동일한 4개 접이식 섹션 + 페이지 권한. 차이:
- 상단 `뒤로가기` → `/notices/reservations`.
- 모든 필드가 조회한 예약 값으로 초기화된다.
- ④ 페이지 권한: `배정팀`에 현재 권한 직원 행(`{이름} {직급}` + `취소하기` 빨강 pill), `배정가능`에 후보 직원(`추가하기` 파랑 pill). 섹션 하단 우측 `취소`/`완료`.
- 페이지 하단 우측: `삭제하기`(빨강 outline) / `저장하기`(검정).

## 동작 (source of truth)

- 진입 시 `:id`로 예약을 조회해 폼 초기값을 채운다(mock 경계, 기존 `getReservation` 재사용 후보). 로딩 중에는 디자인에 없는 별도 화면 없이 동일 레이아웃의 빈 폼을 유지한다(no-invented-ui).
- 섹션 접기/펼치기·상태 배지·am/pm·배정 추가/취소는 `reservation-create`와 동일.
- `저장하기` 클릭 → 필수값 검증(생성과 동일 인라인 규칙) → 통과 시 mock 저장 → 상세 유지 또는 목록 복귀(미결).
- `삭제하기` 클릭 → 삭제 확인 모달(공용 삭제 확인 패턴) → 확인 시 mock 삭제 후 `/notices/reservations`.
- 페이지 권한 섹션 `취소`/`완료`의 역할은 미결(배정 하위 편집 확정 vs 전체 저장과 중복) — 게이트 확정.

## 검증

`reservation-create`와 동일한 인라인 검증(빈 필수 → 빨강 테두리 + 하단 메시지). `저장하기`에 적용.

## 데이터·API 경계 (mock)

- 조회: 기존 `RESERVATION_ADMIN_QUERY`(연동됨) 재사용 가능하나, 폼은 create/edit 공용 입력 타입으로 매핑.
- 권한 배정팀: 기존 `RESERVATION_PERMISSION_QUERY_ALL`(연동됨). 추가는 `RESERVATION_PERMISSION_CREATE`(백엔드 명세 있으나 배정 후보 직원 목록 출처 미기재 — item 6 보류/mock). 취소는 `RESERVATION_PERMISSION_DELETE`(연동됨).
- 수정 저장·삭제 엔드포인트: 백엔드 명세 미확인 → mock.

## 컴포넌트 경계

`reservation-create`와 공용(`ReservationForm`, 섹션·필드 프리미티브, `PagePermissionSection`). 페이지 껍데기만 `ReservationDetailPage`(조회 초기화 + 삭제/저장 액션).

## 기능 테스트 수용 기준(초안)
- `harness/artifacts/publishing/reservation-edit.scenario-draft.md` 참조.

## 게이트 확정 (개발자 승인, 2026-08-23)
- 기존 읽기 전용 상세(예약정보/페이지권한 카드)를 **편집 폼으로 완전 대체**한다.
- 섹션 `완료` 배지 = 섹션 필수 전부 채움. date는 아이콘만(커스텀 피커 없음). 전부 mock.
- 페이지 권한 섹션 `취소/완료`는 배정 하위 편집 확정용(시각), 저장은 하단 `저장하기`가 담당. (mock 단계에서는 최소 배선)
- 저장/삭제는 **mock 경계**(저장 후 목록 복귀, 삭제는 확인 모달 후 목록 복귀). 실제 계약은 `/api` 슬라이스.
