# API Integration Harness

Notion API 명세를 바로 코드로 옮기지 않고 검증 가능한 API Contract로 고정한 뒤, 프로젝트의 기존 API 구조에 맞춰 구현하는 하네스이다.

## 흐름

```text
API 연동 요청
→ API ID로 Notion API 검색
→ API 상세 명세 조회
→ API Contract 생성
→ Contract 검증
→ 기존 프로젝트 API 구조 분석
→ 구현 계획 작성
→ 테스트 시나리오 작성
→ 개발자 승인
→ API 연동 구현
→ 정적 검증
→ Mock 기반 기능 테스트
→ (승인된 경우) staging 실제 서버 테스트
→ 실패 시 코드 수정
→ 최종 결과 보고
```

## 원칙

- API 이름보다 API ID를 우선한다.
- Notion 명세를 읽은 직후 코드를 작성하지 않는다.
- 승인된 Contract, 구현 계획, 테스트 시나리오만 구현 기준으로 사용한다.
- 명세에 없는 Method, Path, 권한, 타입, enum, 응답 필드를 추측하지 않는다.
- 데이터베이스와 상세 페이지 값이 다르면 중단한다.
- 기존 공통 Axios, 타입, TanStack Query, Query Key 패턴을 우선한다.
- 승인 이후 기준 파일이 바뀌면 재승인한다.
- 실제 서버 요청과 Notion 수정은 자동 실행하지 않는다.
- 실제 서버 검증은 승인된 staging 설정, 동결된 전용 테스트, 명시적 실행 확인이 모두 있을 때만 수행한다.

## 조회 순서

1. API ID로 API 데이터베이스를 검색한다.
2. 정확히 한 행과 일치하는지 확인한다.
3. 그 행의 상세 페이지를 조회한다.
4. 데이터베이스의 Method, Path, 인증 정보를 읽는다.
5. 상세 페이지의 Request와 Response를 읽는다.
6. 중복 속성을 비교한다.
7. 일치할 때만 Contract를 생성한다.

사용자가 API ID와 Notion URL을 함께 제공하면 검색 결과와 URL이 같은 API인지 비교한다. 다르면 중단한다.

## 산출물

검토 중 산출물은 `harness/artifacts/api/`에 생성하고 Git에 커밋하지 않는다. 승인 시 `harness/api/approvals/`에 해시와 함께 복사한다.

```text
<feature>.notion-source.md
<feature>.contract.md
<feature>.contract.json
<feature>.project-analysis.md
<feature>.implementation-plan.md
<feature>.test-scenarios.md
```

자세한 단계는 [`RUNBOOK.md`](./RUNBOOK.md)를 따른다.
