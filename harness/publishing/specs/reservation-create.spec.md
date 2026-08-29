---
feature: reservation-create
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 4520:9075
  relatedNodeIds:
    - 4899:8525
    - 4927:9326
    - 5190:7575
    - 4660:7623
requires_functional_test: true
paths: src/pages/notices/reservations/CreateReservationPage.tsx, src/features/reservation-form, src/entities/reservation
---

# 단체예약 생성 페이지 행동명세

## 상태와 근거

- Status: Draft (게이트 승인 대기)
- 생성 화면(플레이스홀더): Figma `4520:9075`
- 전체 펼침: `4899:8525` / 섹션 접힘·상태 배지: `4927:9326` / 검증 에러(인라인): `5190:7575` / 참고(am·pm 드롭다운, 배정): `4660:7623`
- 진입: 리스트(`/notices/reservations`)의 `단체예약 생성하기` → `/notices/reservations/create` (신규 라우트·페이지)
- 생성/수정 페이지는 레이아웃이 동일하며, 수정은 `reservation-edit` spec으로 분리한다.
- API 미연동(publishing) — 제출은 mock 경계로 둔다. 실제 연동은 별도 `/api` 슬라이스.

## 목적

운영 관리자가 단체예약 한 건을 상담/방문/사전답사 정보와 페이지 접근 권한으로 신규 등록한다.

## 화면 구조

1920 데스크톱, 본문 x300 w1320. 좌상단 전역 메뉴는 `AppLayout`이 렌더. 본문 상단 `뒤로가기`(chevron-left + 뒤로가기, 클릭 시 `/notices/reservations`).
아래 4개 **접이식 섹션 카드**(헤더 gray 바: 제목 24 SemiBold + chevron 토글). 하단 우측 `생성하기`(검정 pill).

### ① 상담일 관련
- `단체명 *` (text, ph `단체명을 입력해주세요`)
- `지역 *` (text, ph `지역을 입력해주세요`)
- `상담일을 선택해주세요 *` (date, ph `연도. 월. 일`, calendar 아이콘)
- `예약인 이름 *` (text, ph `예약인 이름을 입력해주세요`)
- `대표자 연락처를 입력해주세요 *` (tel, ph `010-0000-0000`)

### ② 방문일 관련
- `총 인원 *` (number, ph `0`, suffix `명`)
- `인솔자 인원 *` (number, suffix `명`)
- `입장료를 입력해주세요 *` (number, suffix `원`)
- `방문일을 선택해주세요 *` (date)
- `방문 시간을 선택해주세요 (입장시간) *` (time `00 : 00` + am/pm 드롭다운)
- `퇴장 시간을 선택해주세요 (퇴장시간) *` (time + am/pm)

### ③ 사전답사 관련
- `사전답사 인원 *` (number, suffix `명`)
- `사전답사일을 선택해주세요 *` (date)
- `사전답사 시간을 선택해주세요 (입장시간) *` (time + am/pm)
- `사전답사 시간을 선택해주세요 (퇴장시간) *` (time + am/pm)

### ④ 페이지 권한
- 검색바 (search 아이콘 + ph `이름을 입력해주세요`)
- `배정팀`: 배정된 직원이 없으면 안내문 `아직 배정된 담당자가 없습니다. 배정 가능 목록에서 담당자를 추가해주세요.`
- `배정가능`: 직원 행 `{이름} {직급}` + `추가하기`(파랑 pill). 추가 시 해당 직원이 배정팀으로 이동, 배정팀 행에는 `취소하기`(빨강 outline pill)로 해제.

## 동작 (source of truth)

- 섹션 헤더 chevron 클릭 → 해당 섹션 접기/펼치기. 접힌 헤더에는 상태 배지 `미완료`(점선 원)/`완료`(파란 체크)가 보인다. **완료 판정 기준은 미결(아래 참조).**
- am/pm 드롭다운 클릭 → `am`/`pm` 선택.
- `추가하기`/`취소하기`로 배정팀↔배정가능 이동(mock, 로컬 상태).
- `생성하기` 클릭 → 필수값 검증. 통과 시 mock 생성 요청 후 `/notices/reservations` 복귀.
- `뒤로가기` → `/notices/reservations`.

## 검증 (인라인, 모달 아님)

`생성하기` 클릭 시 빈 필수 필드는 **빨강 테두리 + 필드 하단 빨강 메시지**(error 아이콘)로 표시:
- text/number: `내용을 입력해주세요!`
- date: `날짜를 선택해주세요!`
- time: `시간을 선택해주세요!`

필수: 단체명·지역·상담일·예약인 이름·대표자 연락처·총 인원·인솔자 인원·입장료·방문일·방문 입장/퇴장 시간·사전답사 인원·사전답사일·사전답사 입장/퇴장 시간. (페이지 권한 배정은 필수 아님 — 미결 확인)

## 데이터·API 경계 (mock)

- 제출 입력 계약(초안): `CreateReservationInput { groupName, region, counselDate, reserverName, representativeContact, headcount, guideCount, admissionFee, visitDate, visitTime{h,m,ampm}, exitTime{...}, surveyCount, surveyDate, surveyEnterTime, surveyExitTime, assignedStaffIds[] }`
- mock 생성 → `['reservations']` 무효화 → 목록 복귀. 실제 필드/엔드포인트는 `/api` 슬라이스에서 확정(현재 백엔드 생성 명세 미확인).

## 컴포넌트 경계 (design-rules §1)

- `CreateReservationPage`(pages): 라우팅·제출·검증 상태 조립.
- `ReservationFormSection`(features/reservation-form): 접이식 섹션 카드(헤더+배지+chevron+children).
- `ReservationForm`(features/reservation-form): 4개 섹션 + 필드 구성(생성/수정 공용).
- 필드 프리미티브(라벨+인풋+에러): `LabeledField`, 접미사 인풋(명/원), `TimeAmPmField`(00:00+am/pm), `DateField`(calendar).
- `PagePermissionSection`(features/reservation-form): 검색 + 배정팀/배정가능.
- 아이콘(calendar·search·chevron·상태배지)은 Figma 벡터 다운로드.

## 접근성
- 뒤로가기 링크, 각 인풋 프로그램적 label, 에러 메시지는 인풋과 연관(aria-describedby), 필수 표시.

## 기능 테스트 수용 기준(초안 — 게이트에서 승인)
- 별도 `harness/artifacts/publishing/reservation-create.scenario-draft.md` 참조.

## 게이트 확정 (개발자 승인, 2026-08-23)
- 섹션 `완료` 배지 = 해당 섹션의 **필수 필드가 모두 채워졌을 때**, 아니면 `미완료`.
- date는 **커스텀 캘린더 팝업을 만들지 않고 아이콘만** 노출한다(이번 슬라이스). time/am·pm도 시각 컨트롤 수준.
- 페이지 권한 배정 직원은 **mock**(백엔드 명세 미기재, item 6 보류). 배정은 필수 아님.
- 생성 제출은 **mock 경계**(`['reservations']` 무효화 후 목록 복귀). 실제 계약은 `/api` 슬라이스.
