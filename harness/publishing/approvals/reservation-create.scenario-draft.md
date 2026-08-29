# Scenario Draft — reservation-create

출처: `harness/publishing/specs/reservation-create.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오
### S1: 생성 폼 표시
- Given: `/notices/reservations/create` 진입
- When: 화면 렌더
- Then: `뒤로가기`, 4개 섹션 헤더(상담일/방문일/사전답사/페이지 권한), 필수 라벨(`단체명 *` 등), `생성하기` 버튼이 보인다. 초기 인풋은 플레이스홀더.

### S2: 섹션 접기/펼치기
- Given: 생성 폼
- When: `상담일 관련` 헤더 chevron 클릭
- Then: 해당 섹션 필드가 접히고, 접힌 헤더에 상태 배지(미완료/완료)가 보인다. 다시 클릭하면 펼쳐진다.

### S3: 필수 미입력 검증(인라인)
- Given: 빈 생성 폼
- When: `생성하기` 클릭
- Then: 빈 필수 텍스트/숫자 필드 하단에 `내용을 입력해주세요!`, date에 `날짜를 선택해주세요!`, time에 `시간을 선택해주세요!`가 빨강으로 표시되고 목록 이동은 일어나지 않는다.

### S4: 정상 생성
- Given: 모든 필수값 입력
- When: `생성하기` 클릭
- Then: mock 생성 후 `/notices/reservations`로 이동한다.

## 엣지/상호작용
### S5: 시간 am/pm 선택
- Given: 방문 시간 필드
- When: am/pm 드롭다운을 열고 `pm` 선택
- Then: 표시가 `pm`으로 바뀐다.

### S6: 페이지 권한 배정 추가/취소
- Given: 페이지 권한 섹션(배정팀 비어있음)
- When: 배정가능 직원의 `추가하기` 클릭 → 이후 배정팀 직원의 `취소하기` 클릭
- Then: 추가 시 배정팀에 나타나고 배정가능에서 빠지며, 취소 시 원복된다.

### S7: 뒤로가기
- Given: 생성 폼
- When: `뒤로가기` 클릭
- Then: `/notices/reservations`로 이동한다.

---
<!-- 개발자: 승인 시나리오 id를 figma-review.md와 approved.json의 scenarioIds에 기입, 불필요한 것은 가지치기. -->
