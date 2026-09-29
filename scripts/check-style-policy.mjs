#!/usr/bin/env node
// tokens.ts에는 제품 의미를 가진 solid color와 font family만 둔다.
// px/rgba/spacing/radius/layout 같은 컴포넌트 구현값은 Emotion 스타일에 직접 작성한다.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokensPath = join(root, 'src', 'shared', 'theme', 'tokens.ts')
const source = readFileSync(tokensPath, 'utf8')

const rules = [
  {
    name: 'implementation token group',
    pattern: /^\s*(?:space|radius|layout):\s*\{/m,
    guidance:
      'space/radius/layout 값은 사용하는 Emotion 스타일에 직접 작성하세요.',
  },
  {
    name: 'font size token group',
    pattern: /^\s*size:\s*\{/m,
    guidance: 'font-size는 사용하는 Emotion 스타일에 직접 작성하세요.',
  },
  {
    name: 'CSS dimension token',
    pattern:
      /['"`][^'"`\n]*\d+(?:\.\d+)?(?:px|rem|em|vh|vw|vmin|vmax)[^'"`\n]*['"`]/i,
    guidance:
      'CSS 치수는 tokens.ts가 아니라 사용하는 Emotion 스타일에 직접 작성하세요.',
  },
  {
    name: 'contextual color token',
    pattern: /['"`][^'"`\n]*(?:rgba?|hsla?|color-mix)\([^'"`\n]*['"`]/i,
    guidance: 'alpha/계산 색상은 사용하는 Emotion 스타일에 직접 작성하세요.',
  },
]

const violations = rules
  .filter(({ pattern }) => pattern.test(source))
  .map(({ name, guidance }) => ({ name, guidance }))

if (violations.length > 0) {
  console.error(JSON.stringify({ pass: false, violations }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify({ pass: true, checked: 'src/shared/theme/tokens.ts' }),
)
