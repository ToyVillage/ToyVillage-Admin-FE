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
  // 날짜·시간은 잘리면 안 되는 값이라 좌우 여백을 줄이고 폭을 넉넉히 둔다.
  {
    key: 'fedDate',
    header: '급여날짜',
    width: 200,
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
  { key: 'feeder', header: '급여자', width: 170, render: mutedCell('feeder') },
  {
    key: 'feed',
    header: '먹이 종류 · 급여량',
    width: 250,
    render: (row) => {
      const value = String(row.feed ?? '')
      return <StrongCell title={value}>{value}</StrongCell>
    },
  },
  {
    key: 'note',
    header: '특이사항',
    render: (row) => {
      const value = String(row.note ?? '')
      return <NoteCell title={value}>{value}</NoteCell>
    },
  },
]

// 열 폭 합계(마지막 `특이사항` 은 최소 260 로 본다).
export const feedHistoryTableMinWidth = 200 + 140 + 170 + 250 + 260

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
    const value = String(row[key] ?? '')
    return <MutedCell title={value}>{value}</MutedCell>
  }
}

// 값이 열 폭보다 길면 줄바꿈하지 않고 말줄임한다(행 높이가 늘면 표가 어긋난다).
const MutedCell = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const StrongCell = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  text-overflow: ellipsis;
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
