import type { ReactNode } from 'react'
import { DataTable, type DataTableColumn, type DataTableRow } from '@/shared/ui'
import {
  formatFedAt,
  formatFedDate,
  formatFeedQuantity,
  formatNote,
} from '../model/format'
import type { FeedFloor, FeedHistoryRecord } from '../model/types'
import { TruncatedCell } from './TruncatedCell'

interface FeedHistoryTableProps {
  floor: FeedFloor
  records: FeedHistoryRecord[]
  emptyLabel: string
  // 첫 조회 중. 헤더는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
  /** 행을 누르면 그 급여 기록 상세로 이동한다. */
  onRowClick?: (id: string) => void
  /** 행 오른쪽 케밥 메뉴. 메뉴 동작(수정·삭제)은 페이지가 소유한다. */
  renderRowAction?: (record: FeedHistoryRecord) => ReactNode
}

// Figma `individual detail`(749:14665) 급여 이력 표 — 앱 4층 입력 칸. 페이지네이션 없이 전체를 보여준다.
const floorFourColumns: DataTableColumn[] = [
  {
    key: 'fedAt',
    header: '급여일시',
    // `2026.09.03 09:30`(24px, 약 200px)이 잘리지 않는 폭. 늘어난 만큼 특이사항이 줄어든다.
    width: 250,
    paddingX: 24,
    render: cell('fedAt'),
  },
  {
    key: 'feedType',
    header: '먹이 종류',
    width: 220,
    render: cell('feedType'),
  },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 140,
    paddingX: 16,
    render: cell('feedAmount'),
  },
  {
    key: 'remainingAmount',
    header: '잔량',
    width: 140,
    paddingX: 16,
    render: cell('remainingAmount'),
  },
  { key: 'note', header: '특이사항', render: cell('note') },
  { key: 'feeder', header: '급여자', width: 150, render: mutedCell('feeder') },
]

// Figma `individual detail (5층)`(3316:25799) — 앱 5층 입력 칸.
const floorFiveColumns: DataTableColumn[] = [
  {
    key: 'fedAt',
    header: '급여일',
    width: 200,
    paddingX: 24,
    render: cell('fedAt'),
  },
  { key: 'feedType', header: '먹이 종류', render: cell('feedType') },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 220,
    render: cell('feedAmount'),
  },
  { key: 'feeder', header: '급여자', width: 190, render: mutedCell('feeder') },
]

const actionColumnWidth = 80

export const feedHistoryTableMinWidth =
  250 + 220 + 140 + 140 + 260 + 150 + actionColumnWidth

const appearance = {
  headerBackground: 'tableHeaderStrong',
  headerColor: 'textStrong',
  dividerColor: 'textGuide',
} as const

export function FeedHistoryTable({
  floor,
  records,
  emptyLabel,
  loading,
  onRowClick,
  renderRowAction,
}: FeedHistoryTableProps) {
  const columns = floor === '4' ? floorFourColumns : floorFiveColumns
  const recordById = new Map(records.map((record) => [record.id, record]))
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
            const record = recordById.get(row.id)
            return record ? renderRowAction(record) : null
          },
        },
      ]
    : columns

  return (
    <DataTable
      rows={records.map((record): DataTableRow => ({
        id: record.id,
        fedAt:
          floor === '4'
            ? formatFedAt(record.fedDate, record.fedTime)
            : formatFedDate(record.fedDate),
        feedType: record.feedType,
        feedAmount: formatFeedQuantity(record.feedAmount, record.unit),
        remainingAmount: formatFeedQuantity(
          record.remainingAmount,
          record.unit,
        ),
        note: formatNote(record.note),
        feeder: record.feederName,
      }))}
      columns={tableColumns}
      onRowClick={onRowClick}
      rowTestId="feed-history-row"
      headerTestId="feed-history-header"
      emptyLabel={emptyLabel}
      appearance={appearance}
      loading={loading}
    />
  )
}

function cell(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedCell value={String(row[key] ?? '')} />
  }
}

function mutedCell(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedCell value={String(row[key] ?? '')} muted />
  }
}
