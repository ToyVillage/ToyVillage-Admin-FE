---
feature: animal-legal-status-create
api_id: ANIMAL_LEGAL_STATUS_CREATE
target_page: src/pages/species/CreateSpeciesPage.tsx
notion_page: https://app.notion.com/p/5387a4d614748333be2d81a374211aee
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 폼의 법정분류 추가(현재 폼 로컬 상태에만 추가)를
`ANIMAL_LEGAL_STATUS_CREATE`(POST `/animal-manage/legal-status`)로 서버 공용
목록에 추가하도록 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/features/species-form/ui/LegalDesignationAddDialog.tsx`
- `src/features/species-form/ui/LegalDesignationField.tsx`
- `src/features/species-form/ui/SpeciesForm.tsx` (저장 전 기본 항목 생성)
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_LEGAL_STATUS_CREATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 법정분류 추가 모달에서 `추가하기` 시 요청 body `{ kind: <앞뒤 공백 제거한
  이름> }`으로 호출한다.
  - 기존 중복 검사(기본 3개 + 서버 목록 이름과 같으면 `이미 있는 분류입니다!`)는
    호출 전에 그대로 한다.
- 201 성공 시 법정지정분류 목록을 다시 받아 새 항목을 목록 끝(`+ 법정분류
  추가` 앞)에 ✕ 있는 pill로 보이고 **즉시 선택 상태**로 만든 뒤 모달을 닫고
  포커스를 `+ 법정분류 추가`로 돌린다(기존 동작 유지).
- 추가한 항목은 공용 목록이라 다른 종 폼에도 선택지로 보인다(2026-09-16
  개발자 결정).
- 종 저장 시 선택된 기본 3개 중 서버 목록에 없는 항목은 이 API로 먼저 만들고
  목록을 다시 받아 id를 찾은 뒤 종 생성·수정을 호출한다.
- 모달의 `추가하기`는 요청 중 중복 제출되지 않는다.

# 기대 오류 동작

- 400·401·403·500 등 오류 시 모달을 닫지 않고 입력을 보존하며 실패를
  알린다. pill을 추가하거나 선택하지 않는다. 문구·위치는 구현 계획에서 기존
  모달 오류 행 패턴으로 정하고 승인 시 확정.
- 종 저장 전 기본 항목 생성이 실패하면 종 생성·수정을 호출하지 않고 기존 폼
  저장 실패 표시를 쓴다.

# 캐시 갱신 기대

- 성공 시 `['legal-statuses']`를 무효화한다.

# 페이지 이동 또는 사용자 알림

- 모달 닫힘 후 포커스 복원 외 이동 없음.

# 비고 및 제약

- 퍼블리싱 spec(`species-form`)의 "직접 추가는 이 종에만 저장" 결정과 달라
  문서 수정·재승인이 필요하다(`animal-legal-status-query-all` 비고).
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `kind` 길이 제한이 명세에 없다(contract Notes).
2. 서버가 같은 이름 중복 생성을 막는지 명세에 없다. 프런트 중복 검사만 한다.
