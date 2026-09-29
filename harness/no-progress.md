# No-Progress 조건

`scripts/loop-guard.mjs`는 `harness/artifacts/loop-state.json`에 작업별 상태를 저장한다.

## Scope key

- 퍼블리싱: `publishing:<feature>`
- API: `api:<feature>`
- 기존 `yarn harness:loop ... <feature>` 명령은 호환을 위해 `publishing:<feature>`로 해석한다.

상태 파일은 scope key별 map이며 각 값은 다음 필드를 가진다.

```text
scope
feature
iteration
lastErrorHash
lastDiffHash
errorHashStreak
diffHashStreak
```

## STOP 조건

다음 중 하나라도 충족되면 중단한다.

1. `iteration >= 3`
2. 같은 `lastErrorHash`가 2회 연속 발생
3. 오류가 남아 있는 동안 같은 `lastDiffHash`가 2회 연속 발생

정체 조건과 반복 상한이 동시에 충족되면 정체 사유를 우선 보고한다.

## 명령

```bash
yarn harness:loop reset publishing:<feature>
yarn harness:loop record api:<feature> --error <hash> --diff <hash>
yarn harness:loop status api:<feature>
```

성공 시 해당 scope를 reset하거나 더 이상 재시도하지 않는다. STOP 이후에는 자동 재시도하지 않고 마지막 오류와 사유를 보고한다.
