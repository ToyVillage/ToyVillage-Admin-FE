export { feedAnimalHistoryPath, feedRecordPath } from '@/entities/feed'

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

// 이동 state 가 없을 때 매번 새 객체를 만들지 않는다(useCallback 의존성이 매 렌더 바뀌지 않게).
const emptyFeedNavState: FeedNavState = {}

export function readFeedNavState(state: unknown): FeedNavState {
  return (state as FeedNavState | null) ?? emptyFeedNavState
}
