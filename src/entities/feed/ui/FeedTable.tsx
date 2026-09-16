import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import {
  formatAnimalLabel,
  formatFedDate,
  formatFeedLabel,
} from '../model/format'
import type { FeedRecord } from '../model/types'

interface FeedTableProps {
  feeds: FeedRecord[]
  onRowClick: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel: string
}

// Figma `748:14291` 의 열 구성. 케밥 열은 디자인에서 가려져 있어 만들지 않고,
// 남는 폭은 마지막 `급여시간` 열이 채운다.
// 급여일시는 날짜와 시간을 따로 보여 준다.
const columns: DataTableColumn[] = [
  { key: 'animal', header: '대상 개체', width: 220, variant: 'title' },
  { key: 'feed', header: '먹이 종류 · 급여량', width: 440, variant: 'title' },
  { key: 'feeder', header: '급여자', width: 240, render: mutedCell('feeder') },
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 240,
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
          animal: formatAnimalLabel(feed.animalType, feed.animalName),
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

// Figma 의 `급여자`·`급여날짜`·`급여시간` 은 gray/60(#848491) 22px 다.
function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <MutedCell>{row[key]}</MutedCell>
  }
}

const MutedCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
