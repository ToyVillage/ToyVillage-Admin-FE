# Prompt — Create API Contract

API ID로 Notion 데이터베이스를 검색하고 정확히 한 결과의 상세 페이지를 읽는다. 사용자가 URL을 제공했다면 검색 결과와 같은 페이지인지 비교한다.

1. 원문을 `harness/artifacts/api/<feature>.notion-source.md`에 출처와 함께 정리한다.
2. 데이터베이스와 상세 페이지의 API ID, Method, Path, 인증 정보를 비교한다.
3. 누락과 명시적 `없음`을 구분한다.
4. 불일치 또는 STOP 조건이 있으면 Contract를 만들지 말고 백엔드 질문 목록을 출력한다.
5. 통과하면 `templates/api-contract.md`와 JSON schema에 맞춰 contract.md와 contract.json을 생성한다.

명세 값을 번역하거나 정규화할 수는 있지만 새로운 서버 값을 추측하지 않는다.
