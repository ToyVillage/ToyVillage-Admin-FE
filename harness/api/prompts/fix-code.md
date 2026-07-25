# Prompt — Fix API Integration Code

실패한 검증의 최초 원인과 변경 diff를 확인하고 구현 코드만 수정한다.

- Contract, 승인 파일, 테스트 시나리오, 테스트 기대값을 바꾸지 않는다.
- 오류를 빈 값, `any`, `@ts-ignore`, lint 완화로 숨기지 않는다.
- 수정 후 정적 검증부터 다시 실행한다.
- `api:<feature>` scope로 loop guard를 기록한다.

기준 파일 자체가 잘못된 경우 수정하지 말고 재승인이 필요하다고 보고한다.
