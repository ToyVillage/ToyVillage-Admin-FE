import type { ReactNode } from 'react'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { formatFeedQuantity, formatNote } from '../model/format'
import type { FeedFloor, FeedRecord } from '../model/types'
import { TruncatedCell } from './TruncatedCell'

interface FeedTableProps {
  floor: FeedFloor
  feeds: FeedRecord[]
  onRowClick: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel: string
  // 첫 조회 중. 헤더는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
  /** 행 오른쪽 케밥 메뉴. 메뉴 동작(수정·삭제)은 페이지가 소유한다. */
  renderRowAction?: (feed: FeedRecord) => ReactNode
}

// Figma `feeding main (4층)`(3305:25819) — 앱 4층 입력 칸. 폭은 padding 을 포함한다.
// 8열이라 첫 열만 표 구분선 여백(40)에 맞추고 나머지는 좌우 16 으로 줄인다.
const floorFourColumns: DataTableColumn[] = [
  {
    key: 'animalKind',
    header: '일반명',
    width: 260,
    render: cell('animalKind'),
  },
  {
    key: 'animalName',
    header: '개체명',
    width: 110,
    paddingX: 16,
    render: cell('animalName'),
  },
  {
    key: 'fedTime',
    header: '급여시간',
    width: 100,
    paddingX: 16,
    render: mutedCell('fedTime'),
  },
  {
    key: 'feedType',
    header: '먹이 종류',
    paddingX: 16,
    render: cell('feedType'),
  },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 150,
    paddingX: 16,
    render: cell('feedAmount'),
  },
  {
    key: 'remainingAmount',
    header: '잔량',
    width: 136,
    paddingX: 16,
    render: cell('remainingAmount'),
  },
  { key: 'note', header: '특이사항', paddingX: 16, render: cell('note') },
  {
    key: 'feeder',
    header: '급여자',
    width: 96,
    paddingX: 16,
    render: mutedCell('feeder'),
  },
]

// Figma `feeding main (5층)`(3305:26598) — 앱 5층 입력 칸.
const floorFiveColumns: DataTableColumn[] = [
  {
    key: 'animalKind',
    header: '일반명',
    width: 300,
    render: cell('animalKind'),
  },
  {
    key: 'animalName',
    header: '개체명',
    width: 220,
    render: cell('animalName'),
  },
  { key: 'feedType', header: '먹이 종류', render: cell('feedType') },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 220,
    render: cell('feedAmount'),
  },
  { key: 'feeder', header: '급여자', width: 140, render: mutedCell('feeder') },
]

// 케밥 열. Figma 에는 머리행 라벨이 없다.
const actionColumnWidth = 80

// 열 폭 합계(가변 열은 최소 200). 화면이 이보다 좁아지면 표를 가로로 스크롤한다.
export const feedTableMinWidth =
  260 + 110 + 100 + 200 + 150 + 136 + 200 + 96 + actionColumnWidth

// 디자인 시스템 `list`(1:11043) — 진한 머리 행·회색 구분선.
const appearance = {
  headerBackground: 'tableHeaderStrong',
  headerColor: 'textStrong',
  dividerColor: 'textGuide',
} as const

export function FeedTable({
  floor,
  feeds,
  onRowClick,
  pagination,
  emptyLabel,
  loading,
  renderRowAction,
}: FeedTableProps) {
  const columns = floor === '4' ? floorFourColumns : floorFiveColumns
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
        fedTime: feed.fedTime,
        feedType: feed.feedType,
        feedAmount: formatFeedQuantity(feed.feedAmount, feed.unit),
        remainingAmount: formatFeedQuantity(feed.remainingAmount, feed.unit),
        note: formatNote(feed.note),
        feeder: feed.feederName,
      }))}
      columns={tableColumns}
      onRowClick={onRowClick}
      rowTestId="feed-row"
      headerTestId="feed-table-header"
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

// 시간·사람 열은 디자인 시스템 `list` 의 날짜 열처럼 gray/60(#848491) 22px 다.
function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedCell value={String(row[key] ?? '')} muted />
  }
}
