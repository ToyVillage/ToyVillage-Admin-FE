# Team Work Rules

퍼블리싱 하네스와 API 하네스가 함께 사용하는 팀 작업 규칙이다. 커밋·PR·브랜치·이슈·리뷰 답글·검증 실행 방식을 다룬다. 개인 AI 메모리에 있는 규칙과 이 문서가 다르면 이 문서를 따른다.

## 1. 커밋 단위

- 커밋은 계층·기능별로 나눈다. 예: 화면 구현, API 연동, e2e를 각각 따로 커밋한다.
- 이번 작업에서 바꾼 파일만 스테이징한다. `git add -A`·`git add .`으로 관계없는 변경을 섞지 않는다.

## 2. PR 제목과 본문

- PR 제목은 브랜치 이름을 그대로 쓰고 하이픈만 공백으로 바꾼다. 예: `#103/mock-e2e-fix` → `#103/mock e2e fix`
- 본문은 `.github/pull_request_template.md` 양식(📌 관련 이슈 / ✨ 작업 내용 / 🛠️ 변경 사항 / 💬 리뷰어에게)을 채운다.
- `🤖 Generated with Claude Code` 같은 AI 표기 줄을 넣지 않는다.

## 3. 커밋 메시지

- `type: 내용` 한 줄로 쓴다. type은 `feat`·`fix`·`test`·`docs`·`chore`·`refactor`·`style` 중에서 고른다.
- 내용은 명사형으로 끝낸다(`추가`·`제거`·`수정`·`보강`). `~한다` 같은 종결어미를 쓰지 않는다.
  - 예: `fix: 미제출 담당자 줄에 업무 보고 화살표 추가`
- scope(`feat(task):`), 본문, `Co-Authored-By`·`Claude-Session` 같은 트레일러를 넣지 않는다.
  - Claude Code는 `.claude/settings.json`의 `attribution`으로 자동 표기를 끈다. 다른 도구는 이 규칙대로 직접 뺀다.

## 4. 이슈와 브랜치

- 새 문제를 발견하면 현재 브랜치에서 바로 고치지 않는다. 이슈를 먼저 만든다.
- 브랜치는 최신 `origin/develop`에서 `#이슈번호/slug` 이름으로 만든다. 예: `#231/feed-detail-skeleton`

## 5. 임의 git ref 금지

- 백업 브랜치, 작업과 무관한 브랜치, 태그를 요청 없이 만들지 않는다.

## 6. 머지와 푸시

- PR 없이 `develop`·`main`에 머지하거나 직접 푸시하지 않는다.
- 강제 푸시(`--force`, `--force-with-lease`)를 하지 않는다. 이미 푸시한 커밋은 새 커밋으로 고친다.
- `WIP`처럼 작업 중간 상태를 담은 커밋을 남기지 않는다.

## 7. 이슈 양식

- 이슈는 `.github/ISSUE_TEMPLATE/`의 양식으로 쓴다.
- 제목은 기능이면 `[FEAT] `, 버그면 `[BUG] `로 시작한다.

## 8. CodeRabbit 답글

- CodeRabbit 리뷰에 답할 때는 고친 커밋 해시만 적는다. 설명을 덧붙이지 않는다.

## 9. e2e 실행

- e2e는 격리 포트로 실행한다.

  ```bash
  PLAYWRIGHT_BASE_URL=http://localhost:5199 CI=1 yarn playwright test
  ```

- `yarn verify:e2e <feature>`도 같은 환경 변수를 앞에 붙여 실행한다.
- 이 규칙은 mock e2e에만 해당한다. 실서버 검증(`yarn verify:api:real`)은 스테이징 CORS가 허용된 5173으로 실행한다.
- 기본 포트 5173에 `yarn dev`가 떠 있으면 Playwright가 그 서버를 재사용한다(`reuseExistingServer: !CI`). 그러면 mock 대신 `.env`의 스테이징 API로 요청이 나가 결과가 오염된다.

## 10. 스테이징 500 확인

- 스테이징 API(`api-stag.toyvillage.kr`)는 없는 경로에도 404가 아니라 500을 반환한다.
- 500을 받으면 서버 오류로 단정하지 말고, 존재하지 않는 경로(예: `GET /definitely-not-real`)와 있는 경로를 같은 토큰으로 호출해 비교한다.
  - 토큰이 없거나 잘못되면 경로와 관계없이 403(빈 본문)이 먼저 오므로, 정상 토큰으로 호출해야 비교가 된다.
  - 있는 경로(예: `GET /dashboard/count`)도 같은 토큰으로 호출해 200인지 확인한다. 200이 아니면 서버 전체 문제로 본다.
  - 있는 경로는 200인데 확인하려는 경로와 없는 경로가 둘 다 500이면 미배포로 추정하고 백엔드에 배포 여부를 확인한다.
  - 400·404가 오면 그 경로는 존재한다. 이 서버는 없는 경로를 500으로 처리하므로 404는 실제 경로가 보낸 응답이다.
