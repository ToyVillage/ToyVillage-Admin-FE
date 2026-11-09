import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 퍼블리싱 하네스 ③ 테스트 선작성 흐름: 동결 전 구현 게이트 차단, 기준 이미지·스크린샷 테스트 해시.
// 실제 승인 기록을 건드리지 않도록 스크립트를 임시 저장소로 복사해 실행한다.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const scripts = ['gate-check.mjs', 'approve.mjs', 'publishing-lib.mjs']

function makeRepo({ functional = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'publishing-harness-'))
  mkdirSync(join(root, 'scripts'))
  for (const name of scripts)
    copyFileSync(join(repoRoot, 'scripts', name), join(root, 'scripts', name))
  for (const dir of [
    'harness/publishing/specs',
    'harness/publishing/approvals',
    'tests/e2e',
    'tests/visual',
  ])
    mkdirSync(join(root, dir), { recursive: true })
  writeFileSync(
    join(root, 'harness/publishing/specs/demo.spec.md'),
    `---\nfeature: demo\nrequires_functional_test: ${functional}\n---\n`,
  )
  writeFileSync(
    join(root, 'harness/publishing/approvals/demo.scenario-draft.md'),
    '# S1: 목록이 보인다\n',
  )
  return root
}

function run(root, script, args) {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  delete env.NODE_OPTIONS
  return spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    env,
  })
}

function addBaseline(root, name = 'list.png', bytes = 'png-1') {
  const dir = join(root, 'harness/publishing/baselines/demo')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), bytes)
}

function sentinel(root) {
  return JSON.parse(
    readFileSync(
      join(root, 'harness/publishing/approvals/demo.approved.json'),
      'utf8',
    ),
  )
}

test('구현 게이트는 e2e 가 동결되기 전에는 막는다', (t) => {
  const root = makeRepo()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert.equal(
    run(root, 'approve.mjs', ['demo', '--by', 'dev', '--scenarios', 'S1'])
      .status,
    0,
  )

  assert.equal(run(root, 'gate-check.mjs', ['demo']).status, 0)
  const blocked = run(root, 'gate-check.mjs', ['demo', '--stage', 'implement'])
  assert.equal(blocked.status, 4)
  assert.match(blocked.stdout, /e2e 테스트가 아직 동결되지 않음/)

  writeFileSync(join(root, 'tests/e2e/demo.spec.ts'), '// S1\n')
  assert.equal(run(root, 'approve.mjs', ['demo', '--freeze']).status, 0)
  assert.equal(
    run(root, 'gate-check.mjs', ['demo', '--stage', 'implement']).status,
    0,
  )
})

test('기준 이미지는 승인 때 해시로 묶이고 바뀌면 게이트가 막는다', (t) => {
  const root = makeRepo()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  addBaseline(root)
  run(root, 'approve.mjs', ['demo', '--by', 'dev', '--scenarios', 'S1'])
  assert.match(sentinel(root).baselineHash, /^[0-9a-f]{64}$/)
  assert.equal(run(root, 'gate-check.mjs', ['demo']).status, 0)

  addBaseline(root, 'list.png', 'png-2')
  const changed = run(root, 'gate-check.mjs', ['demo'])
  assert.equal(changed.status, 4)
  assert.match(changed.stdout, /baselineHash 불일치/)
})

test('승인 뒤 추가된 기준 이미지는 재승인 전까지 막는다', (t) => {
  const root = makeRepo()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  run(root, 'approve.mjs', ['demo', '--by', 'dev', '--scenarios', 'S1'])
  addBaseline(root)

  const result = run(root, 'gate-check.mjs', ['demo'])
  assert.equal(result.status, 4)
  assert.match(result.stdout, /승인 기록에 없음/)
})

test('기준 이미지가 있으면 스크린샷 테스트까지 동결해야 구현 게이트를 통과한다', (t) => {
  const root = makeRepo()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  addBaseline(root)
  run(root, 'approve.mjs', ['demo', '--by', 'dev', '--scenarios', 'S1'])
  writeFileSync(join(root, 'tests/e2e/demo.spec.ts'), '// S1\n')

  const noVisual = run(root, 'approve.mjs', ['demo', '--freeze'])
  assert.equal(noVisual.status, 1)
  assert.match(noVisual.stderr, /스크린샷 테스트 파일 없음/)

  writeFileSync(join(root, 'tests/visual/demo.visual.ts'), '// list\n')
  assert.equal(run(root, 'approve.mjs', ['demo', '--freeze']).status, 0)
  assert.match(sentinel(root).visualHash, /^[0-9a-f]{64}$/)
  assert.equal(
    run(root, 'gate-check.mjs', ['demo', '--stage', 'implement']).status,
    0,
  )

  writeFileSync(join(root, 'tests/visual/demo.visual.ts'), '// changed\n')
  const changed = run(root, 'gate-check.mjs', ['demo', '--stage', 'implement'])
  assert.equal(changed.status, 4)
  assert.match(changed.stdout, /visualHash 불일치/)
})

test('정적 feature 는 기준 이미지가 없으면 동결 없이 구현 게이트를 통과한다', (t) => {
  const root = makeRepo({ functional: false })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  run(root, 'approve.mjs', ['demo', '--by', 'dev'])

  assert.equal(
    run(root, 'gate-check.mjs', ['demo', '--stage', 'implement']).status,
    0,
  )
  const freeze = run(root, 'approve.mjs', ['demo', '--freeze'])
  assert.equal(freeze.status, 1)
  assert.match(freeze.stderr, /동결할 테스트 없음/)
})

test('기존 notice-list 는 구현 게이트도 그대로 통과한다', () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  delete env.NODE_OPTIONS
  const result = spawnSync(
    process.execPath,
    [
      join(repoRoot, 'scripts', 'gate-check.mjs'),
      'notice-list',
      '--stage',
      'implement',
    ],
    { cwd: repoRoot, encoding: 'utf8', env },
  )
  assert.equal(result.status, 0, result.stdout)
})
