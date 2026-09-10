import styled from '@emotion/styled'
import {
  DataTable,
  KebabMenu,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { formatWorkLogDate } from '../model/date'
import type { WorkLog } from '../model/types'

interface WorkLogTableProps {
  logs: WorkLog[]
  onRowClick: (id: string) => void
  onDelete: (id: string) => void
  // 한 번에 한 행만 열리도록 열린 케밥의 id 를 목록 소유자가 관리한다.
  openKebabId: string | null
  onOpenKebabChange: (id: string | null) => void
  pagination?: DataTablePagination
  emptyLabel: string
}

// Figma `1:3420` 의 열 구성. 케밥 열(80)은 헤더 텍스트가 없다.
const emptyColumns: DataTableColumn[] = [
  { key: 'authorName', header: '작성자', width: 240 },
  { key: 'formName', header: '양식', width: 840 },
  { key: 'date', header: '날짜', width: 240, render: renderDateCell },
]

export function WorkLogTable({
  logs,
  onRowClick,
  onDelete,
  openKebabId,
  onOpenKebabChange,
  pagination,
  emptyLabel,
}: WorkLogTableProps) {
  // 빈 상태(Figma `1:3509`)에는 케밥 열이 없고 `양식` 열이 840 으로 넓어진다.
  const columns: DataTableColumn[] =
    logs.length === 0
      ? emptyColumns
      : [
          { key: 'authorName', header: '작성자', width: 240 },
          { key: 'formName', header: '양식', width: 760 },
          { key: 'date', header: '날짜', width: 240, render: renderDateCell },
          {
            key: 'kebab',
            header: '',
            width: 80,
            paddingX: 0,
            align: 'center',
            render: (row) => (
              <KebabMenu
                open={openKebabId === row.id}
                onOpenChange={(open) =>
                  onOpenKebabChange(open ? row.id : null)
                }
                ariaLabel={`${String(row.formName)} 관리 메뉴`}
                items={[
                  {
                    label: '삭제',
                    tone: 'danger',
                    onSelect: () => onDelete(row.id),
                  },
                ]}
              />
            ),
          },
        ]

  return (
    <DataTable
      rows={logs.map(
        (log): DataTableRow => ({
          id: log.id,
          authorName: log.authorName,
          formName: log.formName,
          date: formatWorkLogDate(log.date),
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="work-log-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={500}
    />
  )
}

function renderDateCell(row: DataTableRow) {
  return <DateCell>{row.date}</DateCell>
}

const DateCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
