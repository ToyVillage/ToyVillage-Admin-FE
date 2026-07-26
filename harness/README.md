# Harness

이 저장소의 작업 하네스는 작업 유형별로 분리되어 있다.

| 작업           | 진입점                  | durable 입력/승인                          | runtime 산출물         |
| -------------- | ----------------------- | ------------------------------------------ | ---------------------- |
| Figma 퍼블리싱 | `publishing/RUNBOOK.md` | `publishing/specs`, `publishing/approvals` | `artifacts/publishing` |
| API 연동       | `api/RUNBOOK.md`        | `api/specs`, `api/approvals`               | `artifacts/api`        |

공통 프론트엔드 규칙은 `shared/code-rules.md`, 공통 반복 중단 규칙은 `no-progress.md`를 사용한다.

`artifacts/`는 실행 중 스크립트가 필요한 하위 디렉터리를 자동 생성하는 Git 비추적 영역이다. 승인 기록은 각 작업 유형의 `approvals/`에 저장하며 Git으로 추적한다.
