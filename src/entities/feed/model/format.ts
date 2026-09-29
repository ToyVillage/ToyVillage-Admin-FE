import { formatIsoDate } from '@/shared/lib'

/** `2026-09-03` → `2026.09.03` — 표·상세 카드의 `급여날짜` */
export function formatFedDate(fedDate: string): string {
  return formatIsoDate(fedDate)
}

/** `2026-09-03` + `09:30` → `2026.09.03 09:30` — 급여 이력 표의 `급여일시` */
export function formatFedAt(fedDate: string, fedTime: string): string {
  return `${formatIsoDate(fedDate)} ${fedTime}`
}

/** `표범` + `레오` → `표범 · 레오` */
export function formatAnimalLabel(
  animalType: string,
  animalName: string,
): string {
  return `${animalType} · ${animalName}`
}

/** `생닭` + `1.2kg` → `생닭 1.2kg` */
export function formatFeedLabel(feedType: string, feedAmount: string): string {
  return `${feedType} ${feedAmount}`
}

/** 급여량은 실수다(단위 필드 없음). 화면 표기 단위는 kg 로 둔다. `1.2kg` · `2kg` */
export function formatFeedAmount(feedAmount: number): string {
  return `${Number(feedAmount.toFixed(2))}kg`
}
