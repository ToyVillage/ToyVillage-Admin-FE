import type { ReactNode } from 'react'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { formatFedDate, formatFeedLabel } from '../model/format'
import type { FeedRecord } from '../model/types'
import { TruncatedCell } from './TruncatedCell'

interface FeedTableProps {
  feeds: FeedRecord[]
  onRowClick: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel: string
  // 첫 조회 중. 헤더·검색바는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
  /** 행 오른쪽 케밥 메뉴. 메뉴 동작(수정·삭제)은 페이지가 소유한다. */
  renderRowAction?: (feed: FeedRecord) => ReactNode
}

// Figma `feed list table`(2580:24892) 의 열 구성. 남는 폭은 `먹이 종류 · 급여량` 이 채운다.
// 대상 개체와 급여일시는 각각 두 열로 나눠 보여 준다(한 칸에 붙이면 줄바꿈으로 깨진다).
// `종` 은 Figma 140 이면 좌우 여백 40 을 빼고 `호랑이` 도 잘려 180 으로 넓히고, 그만큼 먹이 열이 줄어든다.
const columns: DataTableColumn[] = [
  { key: 'animalKind', header: '종', width: 180, render: cell('animalKind') },
  {
    key: 'animalName',
    header: '개체명',
    width: 180,
    render: cell('animalName'),
  },
  // 남는 폭은 `먹이 종류 · 급여량` 이 채운다.
  { key: 'feed', header: '먹이 종류 · 급여량', render: cell('feed') },
  // 잔량은 잘리면 안 되는 숫자라 날짜·시간처럼 좌우 여백을 줄인다.
  {
    key: 'remainingAmount',
    header: '잔량',
    width: 140,
    paddingX: 24,
    render: cell('remainingAmount'),
  },
  { key: 'feeder', header: '급여자', width: 160, render: mutedCell('feeder') },
  // 날짜·시간은 잘리면 안 되는 값이라 좌우 여백을 줄인다.
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 180,
    paddingX: 24,
    render: mutedCell('fedDate'),
  },
  {
    key: 'fedTime',
    header: '급여시간',
    width: 140,
    paddingX: 24,
    render: mutedCell('fedTime'),
  },
]

// 케밥 열. Figma 에는 머리행 라벨이 없다.
const actionColumnWidth = 80

// 열 폭 합계. 화면이 이보다 좁아지면 표를 가로로 스크롤한다.
export const feedTableMinWidth =
  180 + 180 + 260 + 140 + 160 + 180 + 140 + actionColumnWidth

const appearance = {
  headerBackground: 'tableHeaderStrong',
  headerColor: 'textStrong',
  dividerColor: 'textGuide',
} as const

export function FeedTable({
  feeds,
  onRowClick,
  pagination,
  emptyLabel,
  loading,
  renderRowAction,
}: FeedTableProps) {
  const feedById = new Map(feeds.map((feed) => [feed.id, feed]))
  const tableColumns: DataTableColumn[] = renderRowAction
    ? [
        ...columns,
        {
          key: 'actions',
          header: '',
          width: actionColumnWidth,
          paddingX: 0,
          align: 'center',
          variant: 'action',
          render: (row) => {
            const feed = feedById.get(row.id)
            return feed ? renderRowAction(feed) : null
          },
        },
      ]
    : columns

  return (
    <DataTable
      rows={feeds.map((feed): DataTableRow => ({
        id: feed.id,
        animalKind: feed.animalType,
        animalName: feed.animalName,
        feed: formatFeedLabel(feed.feedType, feed.feedAmount),
        remainingAmount: feed.remainingAmount,
        feeder: feed.feederName,
        fedDate: formatFedDate(feed.fedDate),
        fedTime: feed.fedTime,
      }))}
      columns={tableColumns}
      onRowClick={onRowClick}
      rowTestId="feed-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={500}
      appearance={appearance}
      loading={loading}
    />
  )
}

// 값이 열 폭을 넘으면 말줄임한다.
function cell(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedCell value={String(row[key] ?? '')} />
  }
}

// Figma 의 `급여자`·`급여날짜`·`급여시간` 은 gray/60(#848491) 22px 다.
function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedCell value={String(row[key] ?? '')} muted />
  }
}
