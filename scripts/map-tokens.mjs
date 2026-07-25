#!/usr/bin/env node
// map-tokens.mjs — semantic token 후보 + direct CSS 값 수집기 (읽기 전용).
// 이 저장소의 Figma는 Variables를 노출하지 않으므로(설계: design-input-contract.md),
// solid color/font family만 기존 tokens.ts와 대조한다.
// px/rgba/font size/weight/spacing/radius는 구현 참고값이며 토큰 후보로 제안하지 않는다.
//
// 사용: node scripts/map-tokens.mjs <feature>
//   입력:  harness/artifacts/publishing/<feature>.figma.txt
//   출력:  harness/artifacts/publishing/<feature>.token-candidates.json
//          harness/artifacts/publishing/<feature>.token-diff.report.md
// tokens.ts 는 절대 수정하지 않는다.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const feature = process.argv[2]
if (!feature) {
  console.error('usage: node scripts/map-tokens.mjs <feature>')
  process.exit(1)
}

const artifactsDir = join(root, 'harness', 'artifacts', 'publishing')
const figmaPath = join(artifactsDir, `${feature}.figma.txt`)
const tokensPath = join(root, 'src', 'shared', 'theme', 'tokens.ts')

if (!existsSync(figmaPath)) {
  console.error(`[map-tokens] missing figma dump: ${figmaPath}`)
  console.error(
    '  → 에이전트가 get_figma_data 결과를 이 경로에 저장해야 합니다.',
  )
  process.exit(1)
}
if (!existsSync(artifactsDir)) mkdirSync(artifactsDir, { recursive: true })

const figma = readFileSync(figmaPath, 'utf8')
const tokensSrc = existsSync(tokensPath) ? readFileSync(tokensPath, 'utf8') : ''

// 기존 tokens.ts 값 집합 (단일 인용부호 문자열 전부)
const existing = new Set(
  [...tokensSrc.matchAll(/'([^']*)'/g)].map((m) => m[1].toLowerCase()),
)

// --- harvest helpers ---
function countBy(values, compareWithTokens = false) {
  const map = new Map()
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1)
  return [...map.entries()]
    .map(([value, count]) => ({
      value,
      count,
      matched: compareWithTokens
        ? existing.has(String(value).toLowerCase())
        : undefined,
    }))
    .sort((a, b) => b.count - a.count)
}

// 색: #RRGGBB
const colors = countBy(
  [...figma.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toUpperCase()),
  true,
)
const alphaColors = countBy([
  ...[...figma.matchAll(/#[0-9a-fA-F]{8}\b/g)].map((m) => m[0].toUpperCase()),
  ...[...figma.matchAll(/rgba?\([^\n)]+\)/gi)].map((m) => m[0]),
  ...[...figma.matchAll(/hsla?\([^\n)]+\)/gi)].map((m) => m[0]),
])

// 폰트 family / size / weight
const fontFamilies = countBy(
  [...figma.matchAll(/fontFamily:\s*"?([^"\n,}]+)"?/g)].map((m) => m[1].trim()),
  true,
)
const fontSizes = countBy(
  [...figma.matchAll(/fontSize:\s*(\d+)/g)].map((m) => `${m[1]}px`),
)
const fontWeights = countBy(
  [...figma.matchAll(/fontWeight:\s*(\d+)/g)].map((m) => m[1]),
)

// 간격: padding / gap 의 px 값
const spacingRaw = []
for (const m of figma.matchAll(/padding[:=]\s*"?([0-9px\s]+?)"?[,}\n]/g)) {
  for (const px of m[1].matchAll(/(\d+)px/g)) spacingRaw.push(`${px[1]}px`)
}
for (const m of figma.matchAll(/gap[:=]\s*"?(\d+)px/g))
  spacingRaw.push(`${m[1]}px`)
const spacing = countBy(spacingRaw)

// 반경: borderRadius
const radius = countBy(
  [...figma.matchAll(/borderRadius[:=]\s*"?(\d+)px/g)].map((m) => `${m[1]}px`),
)

const candidates = {
  feature,
  tokenCandidates: { colors, fontFamilies },
  directValues: {
    alphaColors,
    fontSizes,
    fontWeights,
    spacing,
    radius,
  },
}
writeFileSync(
  join(artifactsDir, `${feature}.token-candidates.json`),
  JSON.stringify(candidates, null, 2) + '\n',
)

// --- diff report (markdown) ---
function tokenSection(title, rows, tokenPathHint) {
  if (rows.length === 0) return `### ${title}\n(없음)\n`
  const lines = rows.map(
    (r) =>
      `| \`${r.value}\` | ${r.count} | ${r.matched ? '✅ matched' : '🆕 new'} | ${r.matched ? '(기존)' : tokenPathHint} |`,
  )
  return [
    `### ${title}`,
    `| 값 | 사용 | 상태 | 제안 tokens.ts 경로 |`,
    `|----|------|------|---------------------|`,
    ...lines,
    '',
  ].join('\n')
}

function directSection(title, rows) {
  if (rows.length === 0) return `### ${title}\n(없음)\n`
  const lines = rows.map((row) => `| \`${row.value}\` | ${row.count} |`)
  return [`### ${title}`, '| 값 | 사용 |', '|----|------|', ...lines, ''].join(
    '\n',
  )
}

const newCount = [colors, fontFamilies].flat().filter((r) => !r.matched).length

const report = [
  `# Token Diff Report — ${feature}`,
  '',
  `> Figma Variables 미노출 → semantic token 후보와 direct CSS 구현값을 분리해 수집합니다.`,
  `> tokens.ts 는 수정되지 않았습니다(읽기 전용). solid color/font family의 new 항목만 개발자 확인 후 반영합니다.`,
  `> px·rgba·font size/weight·spacing·radius는 토큰에 저장하지 않고 사용하는 Emotion 스타일에 직접 작성합니다.`,
  '',
  `- matched: 기존 tokens.ts 값과 동일`,
  `- new: 기존에 없는 semantic token 후보 → 개발자가 이름 부여(color.* / font.body) 후 반영`,
  `- 신규 semantic token 후보 개수: **${newCount}**`,
  '',
  '## Semantic token candidates',
  '',
  tokenSection('Solid colors → color.*', colors, 'color.<name>'),
  tokenSection('Font families → font.*', fontFamilies, 'font.<name>'),
  '## Direct CSS implementation values',
  '',
  directSection('Alpha/calculated colors', alphaColors),
  directSection('Font sizes', fontSizes),
  directSection('Font weights', fontWeights),
  directSection('Spacing', spacing),
  directSection('Radius', radius),
  '',
  `> 참고: 확정 시 \`color.*\`는 theme.ts에서 \`colors.*\`로 투영됨(color→colors 리네임).`,
].join('\n')

writeFileSync(
  join(artifactsDir, `${feature}.token-diff.report.md`),
  report + '\n',
)

console.log(
  JSON.stringify({
    feature,
    colors: colors.length,
    new: newCount,
    wroteTokens: false,
    outputs: [
      `${feature}.token-candidates.json`,
      `${feature}.token-diff.report.md`,
    ],
  }),
)
