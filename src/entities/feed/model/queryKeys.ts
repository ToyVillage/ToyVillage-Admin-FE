import type { FeedFloor } from './types'

// 4층과 5층은 서로 다른 API 라 같은 id 가 두 층에 있을 수 있다. key 에 층을 둔다.
export const feedQueryKeys = {
  all: ['feeds'] as const,
  lists: ['feeds', 'list'] as const,
  list: (date: string, floor: FeedFloor, page: number) =>
    ['feeds', 'list', { date, floor, page }] as const,
  detail: (floor: FeedFloor, feedLogId: string) =>
    ['feeds', 'detail', floor, feedLogId] as const,
  history: (floor: FeedFloor, animalManageId: string) =>
    ['feeds', 'history', floor, animalManageId] as const,
}
