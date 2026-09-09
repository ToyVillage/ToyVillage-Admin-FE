# Scenario Draft — reservation-edit

출처: `harness/publishing/specs/reservation-edit.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오
### S1: 상세 진입 시 폼 초기화
- Given: `/notices/reservations/:id` 진입(mock 조회값 존재)
- When: 화면 렌더
- Then: 4개 섹션 폼이 조회값으로 채워지고, 페이지 권한 `배정팀`에 현재 권한 직원이 보이며, 하단에 `삭제하기`/`저장하기`가 보인다.

### S2: 값 수정 후 저장
- Given: 초기화된 수정 폼
- When: 단체명을 바꾸고 `저장하기` 클릭
- Then: mock 저장이 수행된다(검증 통과).

### S3: 필수 삭제 후 저장 → 인라인 에러
- Given: 필수 필드를 비움
- When: `저장하기` 클릭
- Then: 해당 필드에 인라인 에러가 표시되고 저장되지 않는다.

### S4: 예약 삭제
- Given: 수정 폼
- When: `삭제하기` 클릭 → 확인 모달에서 `확인`
- Then: mock 삭제 후 `/notices/reservations`로 이동한다.

## 엣지/상호작용
### S5: 배정팀 취소(권한 제거)
- Given: 배정팀에 직원 존재
- When: 직원 행의 `취소하기` 클릭
- Then: 배정팀에서 제거된다(mock).

### S6: 뒤로가기
- Given: 수정 폼
- When: `뒤로가기` 클릭
- Then: `/notices/reservations`로 이동한다.

---
<!-- 개발자: 승인 시나리오 id 기입/가지치기. -->
