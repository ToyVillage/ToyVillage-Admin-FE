import type { AnimalSpecies } from './types'

// 급여 기록 생성·수정 뒤에는 목록만 무효화한다. `all` 을 통째로 무효화하면
// 상세 화면이 사라진 기록을 다시 조회한다.
// 목록 key 에 분류를 넣어 탭을 바꿀 때마다 그 분류로 다시 조회한다.
export const feedQueryKeys = {
  all: ['feeds'] as const,
  list: (date: string, species: AnimalSpecies | null) =>
    ['feeds', 'list', { date, species }] as const,
  detail: (feedLogId: string) => ['feeds', 'detail', feedLogId] as const,
}
