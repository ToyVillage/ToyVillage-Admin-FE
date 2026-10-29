import type { FeedFloor } from '@/entities/feed'

// 4층과 5층은 서로 다른 API 라 라우트로 층을 구분한다.
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

export const feedListPath = '/feeds'

/** 수정 화면이 저장 뒤 돌아갈 곳. */
export type FeedEditOrigin = 'list' | 'record' | 'history'

/** 급여 화면 사이에 넘기는 이동 state. */
export interface FeedNavState {
  /** 목록의 조회 조건(`?date=…&floor=…`). 목록으로 돌아갈 때 쓴다. */
  listSearch?: string
  /** 목록 대신 돌아갈 화면(개체 상세 등). */
  backPath?: string
  from?: FeedEditOrigin
  toast?: 'edit-success' | 'delete-success'
  /** `backPath` 로 돌아갈 때 그 화면에 다시 넘길 state(기록 상세의 조회 조건 등). */
  returnState?: FeedNavState
}

export function readFeedNavState(state: unknown): FeedNavState {
  return (state as FeedNavState | null) ?? {}
}
