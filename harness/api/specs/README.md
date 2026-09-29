# API Task Specs

`templates/api-task-spec.md`를 복사해 `<feature>.spec.md`를 만든다. `api_id`는 필수이며 AI가 임의로 생성하지 않는다.

실제 서버 검증이 필요하면 `real_server.enabled: true`, `environment: staging`,
HTTPS `base_url`, Contract에 필요한 `allowed_methods`를 작성해 개발자 승인에
포함한다. production 환경은 허용하지 않는다.
