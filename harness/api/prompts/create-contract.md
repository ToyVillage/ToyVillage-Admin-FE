# Prompt — Create API Contract

API ID로 Notion 데이터베이스를 검색하고, 같은 API의 스테이징 Swagger operation을 함께 본다. 사용자가 Notion URL을 제공했다면 검색 결과와 같은 페이지인지 비교한다.

1. Notion 검색 결과가 정확히 1개면 원문을 `harness/artifacts/api/<feature>.notion-source.md`에 출처와 함께 정리하고, 데이터베이스와 상세 페이지의 API ID, Method, Path, 인증 정보를 비교한다. 누락과 명시적 `없음`을 구분한다.
2. Notion 검색 결과가 0개면 개발자에게 Method·Path를 받는다. 모르면 STOP한다.
3. 1 또는 2의 Method·Path로 `yarn harness:api:swagger-source <feature> <METHOD> <path>`를 실행해 Swagger operation을 `<feature>.swagger-source.json`에 저장한다. Notion 경로가 Swagger에 없으면 개발자에게 Swagger에서 같은 API의 Method·Path를 확인받아 다시 실행하고, 그 경로로도 없으면 STOP한다.
4. Notion이 있으면 Notion과 Swagger를 항목별로 비교한다: Method·Path, path·query 파라미터, 요청 필드, 응답 필드, 타입·enum·nullable, 성공·오류 코드.
   - 같으면 그대로 쓴다.
   - Notion에 빠진 값(타입·enum·필드)은 Swagger 값으로 채우고 contract.md에 `Swagger 보충`으로 표시한다.
   - 다르면 Contract를 만들지 말고 다른 항목 목록을 개발자에게 보여 준다. 개발자가 정한 기준과 이유를 contract.md에 남긴다.
   - Swagger에 없는 값(접근 역할, 응답 필드 필수 여부, 설명·예시)은 Notion을 따른다.
5. Notion이 없으면 Swagger를 기준으로 쓰고, Swagger에 없는 값(접근 역할, 응답 필드 필수 여부)은 개발자에게 묻는다. contract.md에 `Notion 명세 없음, Swagger 기준`을 표시한다.
6. 불일치나 STOP 조건이 남아 있으면 Contract를 만들지 말고 백엔드 질문 목록을 출력한다.
7. 통과하면 `templates/api-contract.md`와 JSON schema에 맞춰 contract.md와 contract.json을 생성하고, swagger-source의 `source`를 contract.json `source.swagger`에 옮긴다. Notion이 없으면 `source`는 `apiIdMatchCount: 0`과 `swagger`만 둔다.

명세 값을 번역하거나 정규화할 수는 있지만 새로운 서버 값을 추측하지 않는다.
