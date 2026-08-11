import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskStatusBadge } from './TaskStatusBadge'
import type { TaskListItem, TaskPriority, TaskStatus } from '../model/types'

interface TaskTableProps {
  tasks: TaskListItem[]
  onRowClick?: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel?: string
  /** 완료기한 위험색 판정 기준일(YYYY-MM-DD). 테스트 주입용. */
  today?: string
}

interface TaskTableRow extends DataTableRow {
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  overdue: boolean
}

const columns: DataTableColumn[] = [
  { key: 'assigneeName', header: '담당자', render: renderPlainCell('assigneeName') },
  { key: 'title', header: '제목', render: renderPlainCell('title') },
  {
    key: 'status',
    header: '상태',
    render: (row) => <TaskStatusBadge status={(row as TaskTableRow).status} />,
  },
  {
    key: 'priority',
    header: '우선순위',
    render: (row) => (
      <TaskPriorityBadge priority={(row as TaskTableRow).priority} />
    ),
  },
  {
    key: 'dueDate',
    header: '완료기한',
    render: (row) => {
      const task = row as TaskTableRow
      return <DueDate $overdue={task.overdue}>{task.dueDate}</DueDate>
    },
  },
  { key: 'visibility', header: '공개범위', render: renderPlainCell('visibility') },
]

// Task → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function TaskTable({
  tasks,
  onRowClick,
  pagination,
  emptyLabel,
  today,
}: TaskTableProps) {
  const baseline = today ?? formatToday()

  return (
    <DataTable
      rows={tasks.map(
        (task): TaskTableRow => ({
          id: task.id,
          assigneeName: task.assigneeName,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          visibility: task.visibility,
          overdue: task.dueDate < baseline,
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="task-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
    />
  )
}

function renderPlainCell(key: keyof TaskListItem) {
  return function render(row: DataTableRow) {
    return <PlainCell>{row[key]}</PlainCell>
  }
}

function formatToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const PlainCell = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`

// 완료기한이 오늘보다 이전이면 상태와 무관하게 위험색으로 표시한다(spec 결정 사항).
const DueDate = styled.span<{ $overdue: boolean }>`
  color: ${({ theme, $overdue }) =>
    $overdue ? theme.colors.danger : theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`
