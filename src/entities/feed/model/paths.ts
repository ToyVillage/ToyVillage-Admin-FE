import type { FeedFloor } from './types'

// 4층과 5층은 서로 다른 API 라 라우트로 층을 구분한다. 먹이 급여 화면과 개체 상세가 함께 쓴다.
export function feedRecordPath(floor: FeedFloor, feedLogId: string): string {
  return floor === '4'
    ? `/feeds/${feedLogId}`
    : `/feeds/fifth-floor/${feedLogId}`
}

export function feedAnimalHistoryPath(
  floor: FeedFloor,
  animalManageId: number | string,
): string {
  return floor === '4'
    ? `/feeds/animals/${animalManageId}`
    : `/feeds/fifth-floor/animals/${animalManageId}`
}
