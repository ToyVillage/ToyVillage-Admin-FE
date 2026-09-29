# Scenario Draft — reservation-edit

출처: `harness/publishing/specs/reservation-edit.spec.md` (행동명세가 source of truth)
상태: draft (2026-09-20 디자인 개편 반영 — 재승인 대기. 라우트 `/:id` → `/:id/edit`, 삭제 버튼 폐기)

## 핵심 시나리오

### S1: 수정 폼 초기화
- Given: `/notices/reservations/:id/edit` 진입(조회값 존재)
- When: 화면 렌더
- Then: 4개 섹션 폼이 조회값으로 채워지고, 페이지 권한 `배정됨`에 현재 담당자가 보이며, 하단 우측에 `저장하기`가 보인다
- And: `삭제하기` 버튼은 없다

### S2: 값 수정 후 저장
- Given: 초기화된 수정 폼
- When: 단체명을 바꾸고 `저장하기` 클릭
- Then: 수정 요청이 나가고 `/notices/reservations`로 이동하며 `데이터 수정에 성공했습니다` 토스트가 뜬다

### S3: 필수 삭제 후 저장 → 인라인 에러
- Given: 필수 필드를 비움
- When: `저장하기` 클릭
- Then: 해당 필드에 인라인 에러가 표시되고 저장 요청이 나가지 않는다

### S4: 배정 추가/취소
- Given: 페이지 권한 섹션
- When: `배정가능` 직원의 `추가하기` 클릭 → 이후 `배정됨` 직원의 `취소하기` 클릭
- Then: 추가 시 배정됨으로 이동하고 취소 시 원복된다
- And: 저장 시 배정 id 목록이 `appAdminIds` 로 전송된다

### S5: 뒤로가기
- Given: 수정 폼
- When: `뒤로가기` 클릭
- Then: `/notices/reservations`로 이동한다(저장하지 않음)

### S6: 저장 실패
- Given: 수정 폼(서버가 저장 요청에 실패 응답)
- When: `저장하기` 클릭
- Then: 목록으로 이동하지 않고 실패 토스트가 뜬다

---
<!-- 개발자: 승인 시나리오 id 기입/가지치기. -->
