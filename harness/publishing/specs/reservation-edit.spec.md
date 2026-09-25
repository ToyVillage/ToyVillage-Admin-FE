---
feature: reservation-edit
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:7846
  relatedNodeIds:
    - 1:8026
    - 1:8610
    - 1:5968
    - 1:7667
    - 2098:17385
requires_functional_test: true
paths: src/pages/notices/reservations/ReservationEditPage.tsx, src/features/reservation-form, src/entities/reservation
---

# 단체예약 수정 페이지 행동명세

## 상태와 근거

- Status: Draft (게이트 승인 대기 — 2026-09-20 디자인 개편 반영)
- 2026-09-17: 기준 Figma를 폐기된 `toyvillage-dev`에서 yot로 교체했다(#80).
- 2026-09-18: 시간 입력을 `2098:17385`(입장·퇴장 한 박스) + 24시간제 직접 입력으로 교체했다(생성과 공용 `ReservationForm`).
- 2026-09-20: yot 개편을 반영했다. 변경점 둘:
  1. **수정 화면은 `/notices/reservations/:id` 가 아니라 `/notices/reservations/:id/edit` 이다.** `:id` 는 읽기 전용 상세(`reservations-detail`)가 차지한다. 진입은 목록 행 케밥의 `수정`이다.
  2. **하단 `삭제하기` 버튼이 사라졌다.** 페이지 하단 액션은 `저장하기` 하나뿐이고, 삭제는 목록 케밥의 `삭제`가 담당한다(`reservations-list` S8).
- 수정(전체 펼침·데이터): yot Figma `1:7846` / 페이지 권한 검색 결과 없음: `1:8026` / 인라인 검증 에러(생성과 공용): `1:8610`
- `1:8206`("reservation correction (담당자 배정)")은 사전답사 섹션에 `상태` 셀렉트와 삭제 확인 모달이 남아 있는 **구 변형이라 채택하지 않는다.** 서버 계약상 예약 `status` 는 자동 산출이라 폼에서 입력하지 않는다(`ReservationCreateRequest` 에 status 없음).

## 목적

운영 관리자가 기존 단체예약을 조회한 폼에서 값을 수정해 저장하고, 페이지 접근 권한(담당자 배정)을 조정한다.

## 화면 구조 (Figma 1:7846)

`reservation-create`와 동일한 4개 접이식 섹션 카드. 카드 위치/높이: ① @143 h514 · ② @689 h380 · ③ @1101 h246 · ④ @1379 h352. 차이:

- 상단 `뒤로가기` @300,75 → 목록(`listSearch` 복원).
- 모든 필드가 조회한 예약 값으로 초기화된다(예: 단체명 `대구유치원`, 상담일 `2026.08.16`, 총 인원 `12`, 입장료 `48,000`).
- 완료 조건을 만족한 섹션 헤더는 `완료` 배지, 나머지는 `미완료`.
- ④ 페이지 권한: 직원 이름 검색바 + `배정됨` 행(`{이름} {직급}` + `취소하기` 빨강 outline pill) + `배정가능` 행(`추가하기` 파랑 pill). 검색 결과가 없으면 `검색 결과가 없습니다`. 섹션 하단 `취소`/`완료` 버튼은 **없다**.
- 페이지 하단 우측: **`저장하기`(검정 · radius8 · padding 16/20 · white SemiBold 24)만.** `삭제하기` 없음.
- 사전답사 섹션에 `상태` 셀렉트는 없다.

## 동작 (source of truth)

- 진입 시 `:id`로 예약 상세와 담당자 목록을 조회해 폼 초기값을 1회 채운다(이후 사용자 편집 유지). 조회 중에는 디자인에 없는 별도 화면 없이 같은 레이아웃의 빈 폼을 유지한다(no-invented-ui, 박스 점프 금지).
- 섹션 접기/펼치기·상태 배지·시간 입력(24시간제 한 박스)·배정 추가/취소는 `reservation-create`와 동일하다.
- `저장하기` → 필수값 검증(생성과 동일한 인라인 규칙) → 통과 시 저장 요청. 성공하면 목록으로 이동하고 목록이 `데이터 수정에 성공했습니다` 토스트를 띄운다. 실패하면 목록으로 이동하지 않고 `데이터 생성에 실패했습니다` 규칙과 같은 실패 토스트(`데이터 수정에 실패했습니다`)를 이 화면에서 띄운다.
- 담당자 배정은 저장 요청의 `appAdminIds` 로 통째 전송한다. **담당자 조회가 끝나기 전에는 저장을 막는다** — 빈 목록이 나가 기존 배정을 지우는 사고를 막기 위해서다.
- 담당자 배정이 반영된 저장이 성공하면 목록에서 `권한 부여에 성공했습니다` 토스트를, 배정 반영이 실패하면 `권한 부여에 실패했습니다` 토스트를 띄운다.
- `뒤로가기` → 목록으로 이동한다(저장하지 않음).
- 잘못된 id·404·조회 실패 → 별도 화면 없이 목록으로 되돌린다.

## 검증

`reservation-create`와 동일한 인라인 검증(빈 필수 → 빨강 테두리 + 하단 메시지: 텍스트/숫자 `내용을 입력해주세요!`, 날짜 `날짜를 선택해주세요!`, 시간 `시간을 입력해주세요!`, 퇴장 < 입장 시 `퇴장 시간은 입장 시간보다 빠를 수 없습니다.`). `저장하기`에 적용하고, 실패 시 첫 에러로 스크롤한다.

## 데이터·API 경계 (연동 완료)

- 조회: `GET /reservation/{id}` → `getReservation`
- 담당자: `GET /reservation/assigned-employee/{id}` → `getReservationEmployees`
- 저장: `PATCH /reservation/{id}` → `updateReservation` (바디는 생성과 같은 `toCreateReservationRequest` + `appAdminIds`)
- 삭제 API(`deleteReservation`)는 이 화면이 아니라 목록이 호출한다.
- 저장 성공 후 무효화: `['reservations','list']` 와 `['reservations', id]`

## 컴포넌트 경계

`reservation-create`와 공용(`ReservationForm`, 섹션·필드 프리미티브, `PagePermissionSection`, `usePermissionAssignment`). 페이지 껍데기만 `ReservationEditPage`(조회 초기화 + 저장 액션).

## 기능 테스트 수용 기준

- S1: 목록 케밥 `수정` → `/notices/reservations/:id/edit` 진입 시 4개 섹션 폼이 조회값으로 채워지고, 페이지 권한 `배정됨`에 현재 담당자가 보이며, 하단에 `저장하기`가 보인다. `삭제하기` 버튼은 **없다**.
- S2: 단체명을 바꾸고 `저장하기` → 수정 요청이 나가고 목록으로 이동하며 `데이터 수정에 성공했습니다` 토스트가 뜬다.
- S3: 필수 필드를 비우고 `저장하기` → 해당 필드에 인라인 에러가 표시되고 저장 요청이 나가지 않는다.
- S4: `배정가능` 직원의 `추가하기` → `배정됨` 으로 이동하고, `취소하기` → 원복된다. 저장 시 배정 id 가 `appAdminIds` 로 전송된다.
- S5: `뒤로가기` → `/notices/reservations` 로 이동한다.
- S6: 저장 요청이 실패하면 목록으로 이동하지 않고 실패 토스트를 띄운다.

## 미결 사항

- 없음
