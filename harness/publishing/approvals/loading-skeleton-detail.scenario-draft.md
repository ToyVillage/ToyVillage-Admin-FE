# Scenario Draft — loading-skeleton-detail

출처: `harness/publishing/specs/loading-skeleton-detail.spec.md` (yot `2021:24414`·`2021:24415`, 2026-09-20)
상태: draft — 개발자 승인 대기

## 핵심 시나리오

### S1: 공지사항 상세 조회 중 스켈레톤
- Given: 공지사항 상세 조회 응답을 지연시켰다
- When: `/notices/list/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S2: 휴관일 상세 조회 중 스켈레톤
- Given: 휴관일 상세 조회 응답을 지연시켰다
- When: `/notices/guide/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S3: 업무 상세 조회 중 스켈레톤
- Given: 업무 상세 조회 응답을 지연시켰다
- When: `/tasks/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S4: 업무보고 상세 조회 중 스켈레톤
- Given: 업무보고 상세 조회 응답을 지연시켰다
- When: `/task-reports/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S5: 업무일지 상세 조회 중 스켈레톤
- Given: 업무일지 상세 조회 응답을 지연시켰다
- When: `/work-logs/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S6: 업무일지 양식 상세 조회 중 스켈레톤
- Given: 업무일지 양식 상세 조회 응답을 지연시켰다
- When: `/work-logs/forms/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S7: 먹이 급여 상세 조회 중 스켈레톤
- Given: 먹이 급여 상세 조회 응답을 지연시켰다
- When: `/feeds/:id` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S8: 종 상세 조회 중 스켈레톤
- Given: 종 상세 조회 응답을 지연시켰다
- When: `/species/:speciesId` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S9: 개체 상세 조회 중 스켈레톤
- Given: 개체 상세 조회 응답을 지연시켰다
- When: `/species/:speciesId/individuals/:individualId` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S10: 관찰 상세 조회 중 스켈레톤
- Given: 관찰 상세 조회 응답을 지연시켰다
- When: `/species/.../observations/:observationId` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S11: 공지사항 수정 조회 중 스켈레톤
- Given: 공지사항 수정 조회 응답을 지연시켰다
- When: `/notices/list/:id/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S12: 휴관일 수정 조회 중 스켈레톤
- Given: 휴관일 수정 조회 응답을 지연시켰다
- When: `/notices/guide/:id/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S13: 운영시간 수정 조회 중 스켈레톤
- Given: 운영시간 수정 조회 응답을 지연시켰다
- When: `/notices/guide/hours/:date` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S14: 자료실 수정 조회 중 스켈레톤
- Given: 자료실 수정 조회 응답을 지연시켰다
- When: `/notices/resources/:id/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S15: 단체예약 수정 조회 중 스켈레톤
- Given: 단체예약 수정 조회 응답을 지연시켰다
- When: `/notices/reservations/:id/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S16: 종 수정 조회 중 스켈레톤
- Given: 종 수정 조회 응답을 지연시켰다
- When: `/species/:speciesId/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S17: 개체 수정 조회 중 스켈레톤
- Given: 개체 수정 조회 응답을 지연시켰다
- When: `/species/:speciesId/individuals/:individualId/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S18: 관찰 수정 조회 중 스켈레톤
- Given: 관찰 수정 조회 응답을 지연시켰다
- When: `/species/.../observations/:observationId/edit` 에 진입
- Then: `불러오는 중` status(`aria-busy=true`) 스켈레톤이 보이고 "불러오는 중" 문구는 보이지 않는다

### S19: 상세 조회 성공 → 스켈레톤 사라짐
- Given: `/notices/list/1` 조회 응답을 지연시켰고 스켈레톤이 보인다
- When: 응답이 도착한다
- Then: 스켈레톤이 사라지고 공지 제목이 보인다

### S20: 수정 조회 성공 → 값이 채워진 폼
- Given: `/notices/list/1/edit` 조회 응답을 지연시켰고 스켈레톤이 보인다(제목 입력칸 없음)
- When: 응답이 도착한다
- Then: 스켈레톤이 사라지고 제목 입력칸에 기존 제목이 채워져 있다

## 엣지 케이스

### S21: 조회 실패 → 스켈레톤 대신 기존 오류 표시
- Given: `/notices/list/1` 조회가 실패하도록 응답을 막았다
- When: 화면에 진입
- Then: 스켈레톤이 사라지고 기존 오류 문구가 보인다
