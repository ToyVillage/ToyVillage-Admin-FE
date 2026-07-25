# Prompt — Draft API Tests

Contract와 기대 UI 동작으로 테스트 시나리오를 작성한다.

- 조회: 정상 데이터, 빈 데이터, 서버 오류
- 등록/수정: 성공, 입력 오류, 서버 오류
- 삭제: 성공, 존재하지 않는 데이터, 권한 또는 서버 오류
- 필요한 경우 loading, 인증/권한 오류, 중복 제출, 캐시 갱신, 성공 이동을 추가한다.

각 시나리오는 Contract의 status와 body만 사용한다. 실제 서버 대신 Playwright `page.route()`로 응답을 mock할 수 있어야 한다. 승인 전 테스트 코드는 작성하지 않는다.
