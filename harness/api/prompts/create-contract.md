# Prompt — Create API Contract

API ID로 Notion 데이터베이스를 검색하고 정확히 한 결과의 상세 페이지를 읽는다. 사용자가 URL을 제공했다면 검색 결과와 같은 페이지인지 비교한다.

1. 원문을 `harness/artifacts/api/<feature>.notion-source.md`에 출처와 함께 정리한다.
2. 데이터베이스와 상세 페이지의 API ID, Method, Path, 인증 정보를 비교한다.
3. 누락과 명시적 `없음`을 구분한다.
4. 불일치 또는 STOP 조건이 있으면 Contract를 만들지 말고 백엔드 질문 목록을 출력한다.
5. 같은 Method·Path로 `yarn harness:api:swagger-source <feature> <METHOD> <path>`를 실행해 Swagger operation을 `<feature>.swagger-source.json`에 저장한다.
6. Notion과 Swagger를 항목별로 비교한다: path·query 파라미터, 요청 필드, 응답 필드, 타입·enum·nullable, 성공·오류 코드.
   - 같으면 그대로 쓴다.
   - Notion에 빠진 값(타입·enum·필드)은 Swagger 값으로 채우고 contract.md에 `Swagger 보충`으로 표시한다.
   - 다르면 Contract를 만들지 말고 다른 항목 목록을 개발자에게 보여 준다. 개발자가 정한 기준과 이유를 contract.md에 남긴다.
   - Swagger에 없는 값(접근 역할, 응답 필드 필수 여부, 설명·예시)은 Notion을 따른다.
7. 통과하면 `templates/api-contract.md`와 JSON schema에 맞춰 contract.md와 contract.json을 생성하고, swagger-source의 `source`를 contract.json `source.swagger`에 옮긴다.

명세 값을 번역하거나 정규화할 수는 있지만 새로운 서버 값을 추측하지 않는다.
