// publishing-lib.mjs — approve.mjs·gate-check.mjs 가 함께 쓰는 경로와 해시 계산.

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

// Figma 에서 내려받은 기준 이미지: harness/publishing/baselines/<feature>/*.png
export function baselineDir(feature) {
  return join(root, 'harness', 'publishing', 'baselines', feature)
}

export function baselineFiles(feature) {
  const dir = baselineDir(feature)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.png'))
    .sort()
}

// 기준 이미지 전체를 하나의 해시로 묶는다. 파일 이름도 넣어 이름 변경·추가·삭제를 잡는다.
export function baselineHash(feature) {
  const files = baselineFiles(feature)
  if (files.length === 0) return null
  const hash = createHash('sha256')
  for (const name of files) {
    hash.update(name)
    hash.update(readFileSync(join(baselineDir(feature), name)))
  }
  return hash.digest('hex')
}

// Figma 스크린샷 비교 테스트: tests/visual/<feature>.visual.ts
export function visualSpecPath(feature) {
  return join(root, 'tests', 'visual', `${feature}.visual.ts`)
}
