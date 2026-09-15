import { formatIsoDate } from '@/shared/lib'

/** `2026-09-03` + `09:30` → `2026.09.03 09:30` */
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
