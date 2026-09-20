import styled from '@emotion/styled'
import {
  DataTable,
  TruncatedText,
  type DataTableColumn,
  type DataTableRow,
} from '@/shared/ui'
import { formatFedDate, formatFeedLabel } from '../model/format'
import type { FeedHistoryRecord } from '../model/types'

interface FeedHistoryTableProps {
  records: FeedHistoryRecord[]
  emptyLabel: string
  /** 이력 행을 누르면 그 급여 기록 상세로 간다. 행 id 가 `feedLogId` 다. */
  onSelect: (feedLogId: string) => void
  // 첫 조회 중. 헤더·검색바는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
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
    render: (row) => <StrongCell value={String(row.feed ?? '')} />,
  },
  {
    key: 'note',
    header: '특이사항',
    render: (row) => <NoteCell value={String(row.note ?? '')} />,
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
  onSelect,
  loading,
}: FeedHistoryTableProps) {
  return (
    <DataTable
      rows={records.map((record): DataTableRow => ({
        id: record.id,
        fedDate: formatFedDate(record.fedDate),
        fedTime: record.fedTime,
        feeder: record.feederName,
        feed: formatFeedLabel(record.feedType, record.feedAmount),
        note: record.note,
      }))}
      columns={columns}
      rowTestId="feed-history-row"
      onRowClick={onSelect}
      emptyLabel={emptyLabel}
      appearance={appearance}
      loading={loading}
    />
  )
}

// Figma 의 `급여날짜`·`급여시간`·`급여자` 는 gray/60(#848491) 20px 다.
function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <MutedCell value={String(row[key] ?? '')} />
  }
}

// 값이 열 폭보다 길면 줄바꿈하지 않고 말줄임한다(행 높이가 늘면 표가 어긋난다).
const MutedCell = styled(TruncatedText)`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const StrongCell = styled(TruncatedText)`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
`

// 열 폭을 넘치면 한 줄로 자르고 말줄임표로 끝낸다(Figma `1402:15172`).
const NoteCell = styled(TruncatedText)`
  width: 100%;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
