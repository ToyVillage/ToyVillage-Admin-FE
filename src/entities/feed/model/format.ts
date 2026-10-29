import { formatIsoDate } from '@/shared/lib'
import type { FeedUnit } from './types'

/** 단위 표기. `GML` → `g/ml`, `KGL` → `kg/l` */
export const feedUnitLabels = {
  GML: 'g/ml',
  KGL: 'kg/l',
} as const satisfies Record<FeedUnit, string>

/** `2026-09-03` → `2026.09.03` — 5층 `급여일` */
export function formatFedDate(fedDate: string): string {
  return formatIsoDate(fedDate)
}

/** `2026-09-03` + `09:30` → `2026.09.03 09:30` — 4층 `급여일시` */
export function formatFedAt(fedDate: string, fedTime: string): string {
  return `${formatIsoDate(fedDate)} ${fedTime}`
}

/** `카피바라` + `동식이` → `카피바라 · 동식이` */
export function formatAnimalLabel(
  animalType: string,
  animalName: string,
): string {
  return `${animalType} · ${animalName}`
}

/** 소수 둘째 자리까지. `1.25` · `200` */
export function formatAmountNumber(amount: number): string {
  return String(Number(amount.toFixed(2)))
}

/** `200` + `GML` → `200 g/ml`. 값이 없으면 `-` */
export function formatFeedQuantity(
  amount: number | null,
  unit: FeedUnit,
): string {
  if (amount === null) return '-'
  return `${formatAmountNumber(amount)} ${feedUnitLabels[unit]}`
}

/** 특이사항이 없으면 `-` */
export function formatNote(note: string): string {
  return note.trim() ? note : '-'
}
