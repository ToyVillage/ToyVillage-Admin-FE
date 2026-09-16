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
}

// Figma `748:14291` 의 열 구성. 케밥 열은 디자인에서 가려져 있어 만들지 않고,
// 남는 폭은 마지막 `급여시간` 열이 채운다.
// 대상 개체와 급여일시는 각각 두 열로 나눠 보여 준다(한 칸에 붙이면 줄바꿈으로 깨진다).
const columns: DataTableColumn[] = [
  { key: 'animalKind', header: '종', width: 200, render: cell('animalKind') },
  { key: 'animalName', header: '개체명', width: 180, render: cell('animalName') },
  { key: 'feed', header: '먹이 종류 · 급여량', width: 320, render: cell('feed') },
  { key: 'feeder', header: '급여자', width: 180, render: mutedCell('feeder') },
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 200,
    render: mutedCell('fedDate'),
  },
  { key: 'fedTime', header: '급여시간', render: mutedCell('fedTime') },
]

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
}: FeedTableProps) {
  return (
    <DataTable
      rows={feeds.map(
        (feed): DataTableRow => ({
          id: feed.id,
          animalKind: feed.animalType,
          animalName: feed.animalName,
          feed: formatFeedLabel(feed.feedType, feed.feedAmount),
          feeder: feed.feederName,
          fedDate: formatFedDate(feed.fedDate),
          fedTime: feed.fedTime,
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="feed-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={500}
      appearance={appearance}
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
