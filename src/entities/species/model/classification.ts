import { taxonGroupLabels } from './labels'
import type { Species } from './types'

const subClassificationSeparator = ' - '

/** 종 상세 `분류군` 값 — `설치목 - 천축서과` → `포유류 · 설치목 · 천축서과`, 세부 분류가 없으면 라벨만. */
export function formatTaxonGroupLine(
  species: Pick<Species, 'taxonGroup' | 'subClassification'>,
): string {
  const label = taxonGroupLabels[species.taxonGroup]
  const pieces = splitSubClassification(species.subClassification)
  return [label, ...pieces].join(' · ')
}

/** 종 상세 `세부분류` 값 — 마지막 조각(`천축서과`). 세부 분류가 없으면 `undefined`. */
export function lastSubClassification(
  subClassification: string | undefined,
): string | undefined {
  return splitSubClassification(subClassification).at(-1)
}

function splitSubClassification(subClassification: string | undefined) {
  if (!subClassification) return []
  return subClassification
    .split(subClassificationSeparator)
    .map((piece) => piece.trim())
    .filter(Boolean)
}
