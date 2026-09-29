# RUNBOOK — API Integration Harness

어떤 AI 에이전트든 같은 순서와 STOP 조건을 따른다. 공통 코드 규칙은 `harness/shared/code-rules.md`, API 전용 규칙은 `harness/api/api-rules.md`가 기준이다.

## ① API 작업 요청 확인

- 입력: `harness/api/specs/<feature>.spec.md`
- Prompt: 없음
- 산출물: 확인된 feature, API ID, 대상 경로
- 검증: frontmatter 필수 값과 `real_server` 설정
- STOP: API ID 누락, spec 누락, production 환경, staging 외 실제 서버, HTTP 주소, 빈 허용 method
- 다음 단계: API ID가 하나로 확정됨
- 승인: 불필요

## ② API ID로 Notion API 검색

- 입력: API ID, 선택적 Notion URL
- Prompt: `prompts/create-contract.md`
- 산출물: `harness/artifacts/api/<feature>.notion-source.md`
- 검증: API ID 정확 일치 결과가 1개
- STOP: 0개, 2개 이상, API ID 누락, 접근 권한 없음
- 다음 단계: 단일 데이터베이스 행과 상세 페이지 식별
- 승인: 불필요

## ③ API 상세 명세 조회

- 입력: ②의 데이터베이스 행과 상세 페이지
- Prompt: `prompts/create-contract.md`
- 산출물: notion-source 보강
- 검증: Basic, 인증, 요청, 성공 응답, 오류 응답 섹션 구분
- STOP: 상세 페이지 접근 불가, 동일 문서의 서로 다른 endpoint, 제공 URL과 검색 결과 불일치
- 다음 단계: 누락과 명시적 `없음`이 구분됨
- 승인: 불필요

## ④ API Contract 생성

- 입력: 검증된 Notion 원문
- Prompt: `prompts/create-contract.md`
- 산출물: `<feature>.contract.md`, `<feature>.contract.json`
- 검증: `api-input-contract.md`의 구조와 출처 필드 충족
- STOP: 명세 값을 추측해야 함
- 다음 단계: JSON Contract 생성 완료
- 승인: 불필요

## ⑤ Contract 검증

- 입력: contract.json
- Prompt: 없음
- 산출물: validator 결과
- 검증: `yarn harness:api:validate <feature>` 통과
- STOP: `api-input-contract.md`의 STOP 조건 하나라도 충족
- 다음 단계: exit 0
- 승인: 불필요

## ⑥ 기존 프로젝트 API 구조 분석

- 입력: 승인 전 Contract, `src`, package.json
- Prompt: `prompts/analyze-and-plan.md`
- 산출물: `<feature>.project-analysis.md`
- 검증: 공통 Axios 실제 경로, 타입 위치, query/mutation, query key, 화면 연결 지점 확인
- STOP: 기존 패턴을 찾지 못했는데 새 구조 선택이 필요한 경우
- 다음 단계: 변경 파일과 재사용 대상이 근거와 함께 식별됨
- 승인: 불필요

## ⑦ 구현 계획과 테스트 시나리오 작성

- 입력: Contract, 프로젝트 분석
- Prompt: `prompts/analyze-and-plan.md`, `prompts/draft-tests.md`
- 산출물: `<feature>.implementation-plan.md`, `<feature>.test-scenarios.md`
- 검증: 요청/응답/오류/캐시/탐색 동작이 Contract 범위 안에 있음
- STOP: 명세 누락을 테스트 기대값으로 보완해야 함
- 다음 단계: 계획과 시나리오가 검토 가능
- 승인: 불필요

## ⑧ 개발자 승인

- 입력: task spec, Contract, 계획, 테스트 시나리오
- Prompt: 없음
- 산출물: `harness/api/approvals/<feature>.*`, `<feature>.approved.json`
- 검증: `yarn harness:api:approve <feature> --by <developer>`가 모든 해시를 생성
- STOP: 승인 거절, 필수 파일 누락, Contract 검증 실패
- 다음 단계: `yarn harness:api:gate <feature>` 통과
- 승인: 필수

## ⑨ API 연동 구현

- 입력: 승인 디렉터리의 동결 파일
- Prompt: `prompts/integrate-api.md`
- 산출물: 프론트엔드 API 타입, 호출 함수, query/mutation, UI 연결
- 검증: Contract 밖의 필드 없음, 기존 공통 Axios 사용
- STOP: 승인 파일 해시 불일치, 구현 중 새 명세 결정 필요
- 다음 단계: 변경 범위 구현 완료
- 승인: ⑧ 승인 재사용

## ⑩ 정적 검증

- 입력: 변경 파일
- Prompt: 없음
- 산출물: policy, lint, typecheck, build 결과
- 검증: `harness:api:policy`, lint, typecheck, build 통과
- STOP: 테스트/규칙 완화 없이는 실패를 해결할 수 없는 경우
- 다음 단계: 모든 정적 검증 exit 0
- 승인: 불필요

## ⑪ Mock 기반 프론트 기능 테스트

- 입력: 승인 테스트 시나리오, Mock 기반 Playwright 테스트
- Prompt: 없음
- 산출물: 테스트 결과
- 검증: `yarn verify:api <feature>` 통과
- STOP: 실제 서버 연결 없이는 재현 불가, 승인되지 않은 시나리오 필요
- 다음 단계: 승인 테스트 해시와 실행 테스트 일치 및 통과
- 승인: 테스트 파일 freeze 시 승인 기록 갱신 필요

## ⑫ Staging 실제 서버 테스트

- 조건: 승인 task spec의 `real_server.enabled: true`
- 입력: 승인된 staging HTTPS `base_url`, 허용 method, 동결된 `tests/e2e/api-real/<feature>.real.spec.ts`, 테스트 계정/자격증명
- Prompt: 없음
- 산출물: 실제 요청·응답을 사용한 Playwright 결과와 테스트 데이터 정리 결과
- 검증: `yarn harness:api:approve <feature> --freeze-real` 후 `yarn verify:api:real <feature> --confirm-staging` 통과
- 안전장치: 로컬 프론트엔드만 실행, staging origin 외 요청 차단, 승인 method 외 요청 차단, worker 1, service worker 차단
- STOP: production 주소, HTTPS가 아닌 주소, 미승인 method, 테스트 계정/자격증명 누락, 테스트 데이터 정리 불가
- 다음 단계: 실제 서버 호환성 통과 또는 실패 근거 확보
- 승인: task spec과 실제 서버 테스트 해시 승인 필수
- 비고: `real_server.enabled: false`이면 실행하지 않고 최종 보고에 `미실행`으로 기록한다. Mock 통과를 실제 연동 통과로 간주하지 않는다.

## ⑬ 실패 수정

- 입력: 최초 실패, 변경 diff
- Prompt: `prompts/fix-code.md`
- 산출물: 코드 수정과 `api:<feature>` 반복 상태
- 검증: 승인 파일과 테스트는 수정하지 않고 실패 원인 해소
- STOP: 3회 도달 또는 동일 오류/diff 2회 반복
- 다음 단계: ⑩부터 재검증
- 승인: 기준 파일 변경 시 ⑧로 돌아감

## ⑭ 최종 결과 보고

- 입력: 변경 목록과 전체 검증 결과
- Prompt: `templates/final-report.md`
- 산출물: 구현 요약, 검증 증거, 잔여 위험
- 검증: Mock과 staging 실제 서버 결과가 분리되고 production/Notion 요청이 없으며 미해결 항목이 명시됨
- STOP: 필수 검증 미실행 또는 실패
- 다음 단계: 작업 종료
- 승인: 불필요
