# Scenario Draft — close-schedule-detail

출처: `harness/publishing/specs/close-schedule-detail.spec.md` (yot `2000:17207`, 2026-09-17)
상태: draft — 개발자 승인 대기

## 핵심 시나리오

### S1: 목록 카드 → 상세
- Given: `/notices/guide` 화면에 휴관 일정 카드가 보인다
- When: 첫 카드 클릭
- Then: 해당 일정의 `/notices/guide/:id`로 이동한다

### S2: 읽기 전용 표시
- Given: 휴관 일정 상세 화면
- Then: `시작일`·`종료일` 값(`YYYY.MM.DD`)과 제목(h1)이 보이고, 입력 control과 `저장하기` 버튼이 없다

### S3: 뒤로가기
- Given: 상세 화면
- When: `뒤로가기` 클릭
- Then: `/notices/guide`로 이동한다

## 엣지 케이스

### S4: 존재하지 않는 ID
- Given: 목록에 없는 ID의 상세 URL
- Then: `/notices/guide`로 replace 이동한다

### S5: 새로고침 직접 진입
- Given: 목록 캐시 없이 상세 URL로 바로 진입한다
- Then: 조회한 일정의 시작일·종료일·제목이 보인다
