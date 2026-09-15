import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import {
  formatAnimalLabel,
  formatFedAt,
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
// 남는 폭은 마지막 `급여일시` 열이 채운다.
const columns: DataTableColumn[] = [
  { key: 'animal', header: '대상 개체', width: 240, variant: 'title' },
  { key: 'feed', header: '먹이 종류 · 급여량', width: 480, variant: 'title' },
  { key: 'feeder', header: '급여자', width: 280, render: mutedCell('feeder') },
  { key: 'fedAt', header: '급여일시', render: mutedCell('fedAt') },
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
          fedAt: formatFedAt(feed.fedDate, feed.fedTime),
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

// Figma 의 `급여자`·`급여일시` 는 gray/60(#848491) 22px 다.
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
