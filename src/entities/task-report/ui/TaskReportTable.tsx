import styled from '@emotion/styled'
import {
  TaskPriorityBadge,
  TaskStatusBadge,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import type { TaskReportListItem } from '../model/types'

interface TaskReportTableProps {
  reports: TaskReportListItem[]
  onRowClick?: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel?: string
}

interface TaskReportTableRow extends DataTableRow {
  taskStatus: TaskStatus
  priority: TaskPriority
}

// 컬럼 구성은 업무관리 목록(Figma 3721:3736)과 같은 표 컴포넌트 계열이라 배지까지 그대로 재사용한다.
const columns: DataTableColumn[] = [
  {
    key: 'assigneeName',
    header: '담당자',
    render: renderPlainCell('assigneeName'),
  },
  { key: 'title', header: '제목', render: renderPlainCell('title') },
  {
    key: 'taskStatus',
    header: '상태',
    render: (row) => (
      <TaskStatusBadge status={(row as TaskReportTableRow).taskStatus} />
    ),
  },
  {
    key: 'priority',
    header: '우선순위',
    render: (row) => (
      <TaskPriorityBadge priority={(row as TaskReportTableRow).priority} />
    ),
  },
  { key: 'dueDate', header: '완료기한', render: renderPlainCell('dueDate') },
  {
    key: 'visibility',
    header: '공개범위',
    render: renderPlainCell('visibility'),
  },
]

export function TaskReportTable({
  reports,
  onRowClick,
  pagination,
  emptyLabel,
}: TaskReportTableProps) {
  return (
    <DataTable
      rows={reports.map(
        (report): TaskReportTableRow => ({
          id: report.id,
          assigneeName: report.assigneeName,
          title: report.title,
          taskStatus: report.taskStatus,
          priority: report.priority,
          dueDate: report.dueDate,
          visibility: report.visibility,
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="task-report-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
    />
  )
}

function renderPlainCell(key: keyof TaskReportListItem) {
  return function render(row: DataTableRow) {
    return <PlainCell>{row[key]}</PlainCell>
  }
}

const PlainCell = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`
