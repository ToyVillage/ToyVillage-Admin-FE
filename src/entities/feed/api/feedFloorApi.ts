import type {
  FeedFloor,
  FeedHistoryRecord,
  FeedRecordDetail,
} from '../model/types'
import { getFeedDetail, getFeedHistory, getFeeds } from './feedApi'
import type { FeedListPage } from './feedApi'
import {
  deleteFifthFloorFeed,
  getFifthFloorFeedDetail,
  getFifthFloorFeedHistory,
  getFifthFloorFeeds,
  updateFifthFloorFeed,
} from './fifthFloorFeedApi'
import { deleteFeed, updateFeed } from './feedMutations'
import type { FeedUnitCode } from './types'

// 화면은 층만 알고 부른다. 4층은 `feed-log-controller`, 5층은 `fifth-floor-feed-log-controller` 다.

export function getFloorFeeds(
  floor: FeedFloor,
  request: { date: string; page: number; size: number },
): Promise<FeedListPage> {
  return floor === '4' ? getFeeds(request) : getFifthFloorFeeds(request)
}

export function getFloorFeedDetail(
  floor: FeedFloor,
  feedLogId: number,
): Promise<FeedRecordDetail> {
  return floor === '4'
    ? getFeedDetail({ feedLogId })
    : getFifthFloorFeedDetail({ feedLogId })
}

export function getFloorFeedHistory(
  floor: FeedFloor,
  animalManageId: number,
): Promise<FeedHistoryRecord[]> {
  return floor === '4'
    ? getFeedHistory(animalManageId)
    : getFifthFloorFeedHistory(animalManageId)
}

export function deleteFloorFeed(
  floor: FeedFloor,
  feedLogId: number,
): Promise<void> {
  return floor === '4'
    ? deleteFeed({ feedLogId })
    : deleteFifthFloorFeed({ feedLogId })
}

export interface FloorFeedUpdateInput {
  feed: FeedRecordDetail
  feedType: string
  feedAmount: number
  /** 4층만 보낸다. */
  remainingAmount: number
  /** 4층만 보낸다. */
  significant: string
}

// 화면에서 바꾸지 않는 급여 시각과 단위는 상세 응답 원본을 그대로 보낸다.
export async function updateFloorFeed({
  feed,
  feedType,
  feedAmount,
  remainingAmount,
  significant,
}: FloorFeedUpdateInput): Promise<void> {
  const feedLogId = Number(feed.id)
  const feedUnit: FeedUnitCode = feed.unit
  if (feed.floor === '5') {
    await updateFifthFloorFeed({
      feedLogId,
      feedDate: feed.fedAtValue,
      feedType,
      feedAmount,
      feedUnit,
    })
    return
  }
  await updateFeed({
    feedLogId,
    feedDateTime: feed.fedAtValue,
    feedType,
    feedAmount,
    remainingAmount,
    feedUnit,
    significant,
  })
}
