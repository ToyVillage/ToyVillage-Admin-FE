import styled from '@emotion/styled'
import {
  DataTable,
  KebabMenu,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { formatWorkLogDate } from '../model/date'
import type { WorkLogForm } from '../model/types'

interface WorkLogFormTableProps {
  forms: WorkLogForm[]
  onRowClick: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  openKebabId: string | null
  onOpenKebabChange: (id: string | null) => void
  pagination?: DataTablePagination
  emptyLabel: string
}

// Figma `479:14491` 의 열 구성. `항목`(600~760) 열은 헤더도 셀도 비어 있는
// 미사용 열이라 `양식` 열 760 에 합쳐 구현한다(spec 비고).
const emptyColumns: DataTableColumn[] = [
  { key: 'name', header: '양식', width: 760 },
  { key: 'authorName', header: '작성자', width: 200, paddingX: 24 },
  { key: 'date', header: '날짜', width: 360, paddingX: 24, render: renderDateCell },
]

export function WorkLogFormTable({
  forms,
  onRowClick,
  onEdit,
  onDelete,
  openKebabId,
  onOpenKebabChange,
  pagination,
  emptyLabel,
}: WorkLogFormTableProps) {
  const columns: DataTableColumn[] =
    forms.length === 0
      ? emptyColumns
      : [
          { key: 'name', header: '양식', width: 760 },
          { key: 'authorName', header: '작성자', width: 200, paddingX: 24 },
          {
            key: 'date',
            header: '날짜',
            width: 280,
            paddingX: 24,
            render: renderDateCell,
          },
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
                ariaLabel={`${String(row.name)} 관리 메뉴`}
                items={[
                  { label: '수정', onSelect: () => onEdit(row.id) },
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
      rows={forms.map(
        (form): DataTableRow => ({
          id: form.id,
          name: form.name,
          authorName: form.authorName,
          date: formatWorkLogDate(form.date),
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="work-log-form-row"
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
