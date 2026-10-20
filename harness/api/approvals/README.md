# API Approvals

개발자가 `yarn harness:api:approve <feature>`를 실행하면 승인된 task spec, Contract, 구현 계획, 테스트 시나리오와 해시 JSON이 이 디렉터리에 저장된다. 승인자(`git config user.name`)와 승인 시점 커밋도 함께 기록한다. 승인할 수 있는 사람은 `harness/api/approvers.json`에 있다.

파일이나 해시를 손으로 작성하지 않는다. 기준 파일이 바뀌면 `yarn harness:api:changes <feature>`로 바뀐 부분을 확인하고 재승인한다.
