import type { AnimalSpecies } from './types'

// 목록은 날짜·분류·페이지로 조회한다. 서버가 분류를 걸러 주므로 key 에 함께 둔다.
export const feedQueryKeys = {
  all: ['feeds'] as const,
  list: (date: string, species: AnimalSpecies | null, page: number) =>
    ['feeds', 'list', { date, species, page }] as const,
  detail: (feedLogId: string) => ['feeds', 'detail', feedLogId] as const,
  history: (animalManageId: string) =>
    ['feeds', 'history', animalManageId] as const,
}
