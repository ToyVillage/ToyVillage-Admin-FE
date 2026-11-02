import type { ActivityFloor } from './types'

export const activityQueryKeys = {
  all: ['activity'] as const,
  feed: (date: string, floor: ActivityFloor) =>
    ['activity', 'feed', { date, floor }] as const,
  observation: (date: string) => ['activity', 'observation', { date }] as const,
  workLog: (date: string) => ['activity', 'work-log', { date }] as const,
}
