# Scenario Draft — reservations-detail

출처: `harness/publishing/specs/reservations-detail.spec.md` (행동명세가 source of truth)
상태: draft (2026-09-20 디자인 개편 반영 — 재승인 대기. 구 `예약정보/페이지 권한 카드` 시나리오는 폐기)

## 핵심 시나리오

### S1: 읽기 전용 상세 표시
- Given: `/notices/reservations/:id`(유효 id) 진입
- Then: `뒤로가기`와 4개 섹션 헤더(`상담일 관련`·`방문일 관련`·`사전답사 관련`·`페이지 권한`)가 보인다

### S2: 예약 값 렌더
- Given: 상세 화면(특정 예약)
- Then: 단체명·지역·상담일·예약인 이름·대표자 연락처·총 인원(`명`)·인솔자 인원·입장료(콤마 + `원`)·방문일·사전답사 정보가 조회값 그대로 텍스트로 보인다

### S3: 편집 요소 없음
- Given: 상세 화면
- Then: 입력 요소(textbox)와 `저장하기`·`삭제하기` 버튼이 없다

### S4: 섹션 접기/펼치기
- Given: 상세 화면
- When: `상담일 관련` 헤더를 클릭
- Then: 해당 섹션 본문이 접히고 다시 클릭하면 펼쳐진다. 상태 배지(완료/미완료)는 계속 보인다

### S5: 배정 담당자 목록
- Given: 담당자가 배정된 예약
- Then: `페이지 권한` 섹션에 `배정됨`과 `{이름} {직급}` 행이 보이고 버튼은 없다
- And: 배정이 없으면 `아직 배정된 담당자가 없습니다.` 안내가 보인다

### S6: 뒤로가기
- Given: 상세 화면
- When: `뒤로가기`를 클릭
- Then: `/notices/reservations` 목록으로 이동한다

## 엣지 케이스

### S7: 존재하지 않는 예약
- Given: 존재하지 않는 id로 `/notices/reservations/:id` 진입
- Then: 별도 화면 없이 목록으로 되돌아간다

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 reservations-detail.approved.json의 scenarioIds에 적는다. -->
