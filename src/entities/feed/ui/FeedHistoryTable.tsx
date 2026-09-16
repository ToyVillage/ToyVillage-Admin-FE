import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableColumn,
  type DataTableRow,
} from '@/shared/ui'
import { formatFedDate, formatFeedLabel } from '../model/format'
import type { FeedHistoryRecord } from '../model/types'

interface FeedHistoryTableProps {
  records: FeedHistoryRecord[]
  emptyLabel: string
}

// Figma `1400:15136` (feed history table). 페이지네이션 없이 이력 전체를 보여준다.
const columns: DataTableColumn[] = [
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 180,
    render: mutedCell('fedDate'),
  },
  {
    key: 'fedTime',
    header: '급여시간',
    width: 120,
    render: mutedCell('fedTime'),
  },
  { key: 'feeder', header: '급여자', width: 170, render: mutedCell('feeder') },
  {
    key: 'feed',
    header: '먹이 종류 · 급여량',
    width: 250,
    render: (row) => <StrongCell>{row.feed}</StrongCell>,
  },
  {
    key: 'note',
    header: '특이사항',
    render: (row) => <NoteCell>{row.note}</NoteCell>,
  },
]

const appearance = {
  headerBackground: 'tableHeaderStrong',
  headerColor: 'textStrong',
  headerFontWeight: 600,
  dividerColor: 'tableDivider',
} as const

export function FeedHistoryTable({
  records,
  emptyLabel,
}: FeedHistoryTableProps) {
  return (
    <DataTable
      rows={records.map(
        (record): DataTableRow => ({
          id: record.id,
          fedDate: formatFedDate(record.fedDate),
          fedTime: record.fedTime,
          feeder: record.feederName,
          feed: formatFeedLabel(record.feedType, record.feedAmount),
          note: record.note,
        }),
      )}
      columns={columns}
      rowTestId="feed-history-row"
      emptyLabel={emptyLabel}
      appearance={appearance}
    />
  )
}

// Figma 의 `급여날짜`·`급여시간`·`급여자` 는 gray/60(#848491) 20px 다.
function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <MutedCell>{row[key]}</MutedCell>
  }
}

// Figma 의 급여일시·급여자는 한 줄로 놓인다(열 경계보다 글자가 살짝 넓다).
const MutedCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  white-space: nowrap;
`

const StrongCell = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  white-space: nowrap;
`

// 열 폭을 넘치면 한 줄로 자르고 말줄임표로 끝낸다(Figma `1402:15172`).
const NoteCell = styled.span`
  overflow: hidden;
  width: 100%;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`
