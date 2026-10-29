import type { FeedUnit } from './types'

const unitLabel: Record<FeedUnit, string> = { GML: 'g/ml', KGL: 'kg/l' }

/** `200` + `GML` → `200 g/ml`, `1.25` + `KGL` → `1.25 kg/l`. 값이 없으면 `-` */
export function formatFeedQuantity(
  amount: number | null,
  unit: FeedUnit,
): string {
  if (amount === null) return '-'
  return `${Number(amount.toFixed(2))} ${unitLabel[unit]}`
}

/** 첨부 개수 → `1개`, 없으면 `-` */
export function formatAttachmentCount(count: number): string {
  return count > 0 ? `${count}개` : '-'
}
