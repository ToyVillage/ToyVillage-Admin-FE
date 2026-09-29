#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseOption, repositoryRoot } from './api-harness-lib.mjs'

const policies = [
  ['새 axios 인스턴스', /\baxios\.create\s*\(/g],
  ['raw axios 호출', /\baxios\.(?:get|post|put|patch|delete|request)\s*\(/g],
  ['raw fetch 호출', /\bfetch\s*\(/g],
  ['any 타입', /(?:[:<]\s*any\b|\bas\s+any\b|\bany\s*\[\s*\])/g],
  ['@ts-ignore', /@ts-ignore/g],
]

export function checkApiPolicy({ root, files }) {
  const errors = []
  for (const input of files) {
    const path = resolve(root, input)
    const pathFromRoot = relative(root, path)
    if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
      errors.push(`${input}: 저장소 밖 경로`)
      continue
    }
    if (!pathFromRoot.startsWith(`src${sep}`)) {
      errors.push(`${input}: API policy는 src/ 변경 파일만 허용`)
      continue
    }
    if (!/\.[cm]?[jt]sx?$/.test(path)) continue
    if (!existsSync(path)) {
      errors.push(`${input}: 파일 없음`)
      continue
    }
    const source = readFileSync(path, 'utf8')
    for (const [label, pattern] of policies) {
      pattern.lastIndex = 0
      if (pattern.test(source)) errors.push(`${pathFromRoot}: ${label} 감지`)
    }
  }
  return errors
}

function main() {
  const args = process.argv.slice(2)
  const feature = args[0]
  const rootOption = parseOption(args, '--root')
  const optionIndexes = new Set()
  for (const name of ['--root']) {
    const index = args.indexOf(name)
    if (index >= 0) {
      optionIndexes.add(index)
      optionIndexes.add(index + 1)
    }
  }
  const files = args
    .slice(1)
    .filter((_, index) => !optionIndexes.has(index + 1))
  if (!feature || feature.startsWith('--') || files.length === 0) {
    console.error(
      'usage: check-api-policy.mjs <feature> <changed-file...> [--root path]',
    )
    process.exit(2)
  }
  const root = resolve(rootOption ?? repositoryRoot)
  const errors = checkApiPolicy({ root, files })
  if (errors.length > 0) {
    console.error(`[api-policy:${feature}] failed\n- ${errors.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`[api-policy:${feature}] pass (${files.length} files)`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main()
