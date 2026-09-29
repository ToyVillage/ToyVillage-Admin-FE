# Prompt — Analyze Project and Plan

검증된 Contract를 기준으로 저장소의 실제 API 구조를 분석한다.

- 공통 Axios 인스턴스와 export 방식을 확인한다.
- 관련 entity, feature, page, 타입, query/mutation, query key, route를 검색한다.
- 재사용할 패턴과 변경 파일을 근거 경로와 함께 기록한다.
- 새로운 abstraction은 기존 패턴으로 해결할 수 없을 때만 제안한다.
- Contract 밖의 서버 동작이 필요하면 구현 계획을 중단하고 질문으로 분리한다.

`project-analysis.md`와 `implementation-plan.md`를 각각 생성한다.
