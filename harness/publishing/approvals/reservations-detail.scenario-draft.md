# Scenario Draft — reservations-detail

출처: `harness/publishing/specs/reservations-detail.spec.md` (행동명세가 source of truth)
상태: approved (kimjihwan8 승인, S1–S6). 번호는 spec 수용 기준·`tests/e2e/reservations-detail.spec.ts`와 일치한다.

## 시나리오 (승인)

### S1: 상세 표시
- Given: `/notices/reservations/:id`(유효 id) 진입
- Then: 뒤로가기 링크, 예약정보 카드(단체명·상담일·예약일·예약 시간 범위·예약인·전체 인원·지역·입장료·상태·인솔자 인원·인솔자 연락처), 페이지 권한 카드(검색바)가 보인다

### S2: 예약 값 렌더
- Given: 상세 화면(특정 예약)
- Then: 단체명·예약 시간(`시작 ~ 종료`)·입장료(`n원`) 등 조회한 예약 값이 카드에 정확히 표시된다

### S3: 존재하지 않는 예약
- Given: 존재하지 않는 id로 `/notices/reservations/:id` 진입
- Then: "찾을 수 없음" 안내와 목록으로 돌아가는 링크를 표시한다

### S4: 뒤로가기
- Given: 상세 화면
- When: 뒤로가기 링크를 클릭(또는 Enter)
- Then: `/notices/reservations` 리스트로 이동한다

### S5: 권한 직원 목록 + 검색
- Given: 권한 보유 직원이 있는 상세 화면
- Then: 페이지 권한 카드에 직원 목록(아바타·이름·`제거`)이 보인다
- When: 검색바에 이름 일부를 입력
- Then: 이름이 일치하는 직원만 목록에 남는다

### S6: 직원 권한 제거
- Given: 권한 직원 목록이 보이는 상세 화면
- When: 한 직원 행의 `제거`를 클릭
- Then: 삭제 확인 모달이 열리고, `확인`을 누르면 해당 직원이 목록에서 사라진다

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 reservations-detail.approved.json의 scenarioIds에 적는다.
     불필요한 시나리오는 여기서 삭제(가지치기). 승인되지 않은 시나리오는 Playwright로 변환되지 않는다. -->
