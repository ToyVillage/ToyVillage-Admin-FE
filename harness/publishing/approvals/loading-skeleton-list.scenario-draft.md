# Scenario Draft — loading-skeleton-list

출처: `harness/publishing/specs/loading-skeleton-list.spec.md` (yot `2021:24413`, 2026-09-18)
상태: draft — 개발자 승인 대기

## 핵심 시나리오

### S1: 대시보드 조회 중 스켈레톤
- Given: 대시보드 목록 조회 응답을 지연시켰다
- When: `/` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S2: 공지사항 목록 조회 중 스켈레톤
- Given: 공지사항 목록 목록 조회 응답을 지연시켰다
- When: `/notices/list` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S3: 휴관일 관리 조회 중 스켈레톤
- Given: 휴관일 관리 목록 조회 응답을 지연시켰다
- When: `/notices/guide` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S4: 자료실 목록 조회 중 스켈레톤
- Given: 자료실 목록 목록 조회 응답을 지연시켰다
- When: `/notices/resources` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S5: 단체예약 목록 조회 중 스켈레톤
- Given: 단체예약 목록 목록 조회 응답을 지연시켰다
- When: `/notices/reservations` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S6: 업무관리 목록 조회 중 스켈레톤
- Given: 업무관리 목록 목록 조회 응답을 지연시켰다
- When: `/tasks` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S7: 업무보고 목록 조회 중 스켈레톤
- Given: 업무보고 목록 목록 조회 응답을 지연시켰다
- When: `/task-reports` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S8: 업무일지 목록 조회 중 스켈레톤
- Given: 업무일지 목록 목록 조회 응답을 지연시켰다
- When: `/work-logs` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S9: 업무일지 양식 목록 조회 중 스켈레톤
- Given: 업무일지 양식 목록 목록 조회 응답을 지연시켰다
- When: `/work-logs` 양식 탭 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S10: 팀 설정 조회 중 스켈레톤
- Given: 팀 설정 목록 조회 응답을 지연시켰다
- When: `/settings/teams` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S11: 개체관리 종 목록 조회 중 스켈레톤
- Given: 개체관리 종 목록 목록 조회 응답을 지연시켰다
- When: `/species` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S12: 먹이 급여 목록 조회 중 스켈레톤
- Given: 먹이 급여 목록 목록 조회 응답을 지연시켰다
- When: `/feeds` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S13: 조회 성공 → 스켈레톤 사라짐
- Given: `/notices/list` 조회 응답을 지연시켰고 스켈레톤이 보인다
- When: 응답이 도착한다
- Then: 스켈레톤이 사라지고 공지 행이 보인다

## 엣지 케이스

### S14: 조회 실패 → 스켈레톤 대신 기존 오류 표시
- Given: `/notices/list` 조회가 실패하도록 응답을 막았다
- When: 화면에 진입
- Then: 스켈레톤이 사라지고 기존 오류 문구가 보인다

### S15: 재조회에는 스켈레톤을 다시 보이지 않음
- Given: `/tasks` 첫 조회가 끝나 행이 보인다
- When: `진행중` 상태 탭을 누른다(이 탭은 서버에 다시 조회하며, 재조회 응답은 지연시킨다)
- Then: `불러오는 중` 스켈레톤이 나타나지 않고 이전 행이 그대로 보인다
