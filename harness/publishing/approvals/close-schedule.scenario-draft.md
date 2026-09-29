# Scenario Draft — close-schedule

출처: `harness/publishing/specs/close-schedule.spec.md` (yot `1:6148`, 2026-09-17)
상태: draft — 개발자 승인 대기. 2026-09-17 승인본에 S10(카드 클릭 → 상세) 추가.

## 핵심 시나리오

### S1: 휴관일 생성하기 이동
- Given: `/notices/guide` 화면
- When: `휴관일 생성하기` 클릭
- Then: `/notices/guide/create`로 이동한다

### S2: 다음 달 이동
- Given: `/notices/guide` 화면
- When: `다음 달` 클릭
- Then: 캘린더 표시 월이 바뀌고 카드 목록이 그 달 일정으로 바뀐다

### S3: 검색·필터 없음
- Given: `/notices/guide` 화면
- Then: `휴관 일정 검색` 입력과 `휴관 일정 필터` 버튼이 없다

### S4: 케밥 메뉴 열기
- Given: 휴관 일정 카드가 보인다
- When: 첫 카드의 케밥(⋮) 클릭
- Then: `수정`·`삭제` 메뉴가 보이고 URL은 그대로다

### S5: 케밥 수정 → 수정 화면
- Given: 첫 카드 케밥 메뉴가 열려 있다
- When: `수정` 클릭
- Then: 해당 일정의 `/notices/guide/:id/edit`로 이동한다

## 엣지 케이스

### S6: 삭제 취소
- Given: 첫 카드 케밥 메뉴가 열려 있다
- When: `삭제` → dialog `취소`
- Then: 삭제 요청 없이 dialog가 닫히고 카드가 남는다

### S7: 삭제 확인 → 카드 제거와 성공 토스트
- Given: 첫 카드 삭제 dialog가 열려 있다
- When: `확인`
- Then: 해당 ID로 삭제 요청이 한 번 가고 카드가 사라지며 `데이터 삭제에 성공했습니다` 토스트가 보인다

### S8: 삭제 실패 → 유지와 오류 토스트
- Given: 삭제 요청이 실패하도록 응답을 막았다
- When: 첫 카드 삭제를 확인
- Then: dialog가 닫히고 카드가 남으며 `데이터 삭제에 실패했습니다` 토스트가 보인다

### S9: 월 일정 없음 → 빈 상태
- Given: 일정이 없는 달
- Then: `아직 추가된 휴관일이 없습니다`가 보인다

### S10: 카드 클릭 → 상세
- Given: 휴관 일정 카드가 보인다
- When: 첫 카드 본문 클릭
- Then: 해당 일정의 상세 `/notices/guide/:id`로 이동하고 `저장하기`가 없다
