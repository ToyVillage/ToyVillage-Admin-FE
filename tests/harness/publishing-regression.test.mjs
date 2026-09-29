import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

test('publishing harness uses the task-specific directory', () => {
  assert.equal(
    existsSync(join(root, 'harness', 'publishing', 'RUNBOOK.md')),
    true,
  )
  assert.equal(
    existsSync(join(root, 'harness', 'publishing', 'HARNESS.md')),
    true,
  )
  assert.equal(existsSync(join(root, 'harness', 'RUNBOOK.md')), false)
  assert.equal(existsSync(join(root, 'harness', 'HARNESS.md')), false)
})

test('existing publishing package commands remain available', () => {
  const packageJson = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8'),
  )
  for (const command of [
    'harness:map-tokens',
    'harness:verify',
    'harness:gate',
    'harness:loop',
    'harness:approve',
    'verify:e2e',
  ]) {
    assert.equal(
      typeof packageJson.scripts[command],
      'string',
      `${command} is missing`,
    )
  }
})

test('notice-list approval and e2e hashes remain valid after the move', () => {
  const approvalsDir = join(root, 'harness', 'publishing', 'approvals')
  const sentinel = JSON.parse(
    readFileSync(join(approvalsDir, 'notice-list.approved.json'), 'utf8'),
  )

  assert.equal(
    sha256(join(approvalsDir, 'notice-list.scenario-draft.md')),
    sentinel.scenarioHash,
  )
  assert.equal(
    sha256(join(root, 'tests', 'e2e', 'notice-list.spec.ts')),
    sentinel.e2eHash,
  )
})

test('existing notice-list publishing gate still passes', () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(
    process.execPath,
    [join(root, 'scripts', 'gate-check.mjs'), 'notice-list'],
    { cwd: root, encoding: 'utf8', env },
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
