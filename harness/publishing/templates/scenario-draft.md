<!-- AI가 행동명세로부터 생성하는 시나리오 초안. 개발자가 게이트에서 승인/가지치기한다. 승인 후 동결. -->

# Scenario Draft — <feature>

출처: `harness/publishing/specs/<feature>.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오
### S1: <제목>
- Given: <초기 상태>
- When: <사용자 행동>
- Then: <기대 결과>

### S2: <제목>
- Given / When / Then …

## 엣지 케이스
### S3: <빈 목록 / 에러 / 경계값 등>
- Given / When / Then …

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 <feature>.approved.json의 scenarioIds에 적는다.
     불필요한 시나리오는 여기서 삭제(가지치기). 승인되지 않은 시나리오는 Playwright로 변환되지 않는다. -->
