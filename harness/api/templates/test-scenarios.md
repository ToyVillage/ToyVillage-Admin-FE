# API Test Scenarios — <feature>

## Mock S1

- 목적:
- Mock request:
- Mock response:
- 사용자 동작:
- 기대 결과:

## Staging R1

- 실행 여부: disabled
- 실제 request:
- 사전 조건/테스트 계정:
- 사용자 동작:
- 기대 status와 결과:
- 생성 데이터 식별자:
- 정리 절차:

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- Staging 시나리오는 승인된 origin과 method만 사용
- Staging 쓰기 시나리오는 성공·실패와 무관하게 테스트 데이터 정리
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
