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
}

// Figma `748:14291` 의 열 구성. 케밥 열은 디자인에서 가려져 있어 만들지 않고,
// 남는 폭은 마지막 `급여시간` 열이 채운다.
// 대상 개체와 급여일시는 각각 두 열로 나눠 보여 준다(한 칸에 붙이면 줄바꿈으로 깨진다).
const columns: DataTableColumn[] = [
  { key: 'animalKind', header: '종', width: 200, render: cell('animalKind') },
  {
    key: 'animalName',
    header: '개체명',
    width: 180,
    render: cell('animalName'),
  },
  // 남는 폭은 `먹이 종류 · 급여량` 이 채운다.
  { key: 'feed', header: '먹이 종류 · 급여량', render: cell('feed') },
  { key: 'feeder', header: '급여자', width: 180, render: mutedCell('feeder') },
  // 날짜·시간은 잘리면 안 되는 값이라 좌우 여백을 줄이고 폭을 넉넉히 둔다.
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 220,
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

// 열 폭 합계. 화면이 이보다 좁아지면 표를 가로로 스크롤한다.
export const feedTableMinWidth = 200 + 180 + 320 + 180 + 220 + 140

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
}: FeedTableProps) {
  return (
    <DataTable
      rows={feeds.map((feed): DataTableRow => ({
        id: feed.id,
        animalKind: feed.animalType,
        animalName: feed.animalName,
        feed: formatFeedLabel(feed.feedType, feed.feedAmount),
        feeder: feed.feederName,
        fedDate: formatFedDate(feed.fedDate),
        fedTime: feed.fedTime,
      }))}
      columns={columns}
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
