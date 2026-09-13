import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { TaskPriorityBadge, type TaskPriority } from '@/entities/task'
import {
  DataTable,
  type DataTableAppearance,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import { TaskReportReviewBadge } from './TaskReportReviewBadge'
import type {
  TaskReportListItem,
  TaskReportReviewStatus,
} from '../model/types'

interface TaskReportTableProps {
  reports: TaskReportListItem[]
  onRowClick?: (id: string) => void
  pagination?: DataTablePagination
  emptyLabel?: string
  /** 행 우측 액션 셀(케밥 메뉴). 넘기지 않으면 액션 컬럼을 그리지 않는다. */
  renderRowAction?: (report: TaskReportListItem) => ReactNode
}

interface TaskReportTableRow extends DataTableRow {
  assigneeName: string
  reviewStatus: TaskReportReviewStatus
  priority: TaskPriority
  dueDate: string
}

// Figma `report list`(yot 141:9720). 컬럼 폭 300/320/300/320 + 액션 80.
const baseColumns: DataTableColumn[] = [
  {
    key: 'assigneeName',
    header: '담당자',
    width: 300,
    render: renderPlainCell('assigneeName'),
  },
  {
    key: 'reviewStatus',
    header: '상태',
    width: 320,
    render: (row) => (
      <TaskReportReviewBadge
        status={(row as TaskReportTableRow).reviewStatus}
      />
    ),
  },
  {
    key: 'priority',
    header: '우선순위',
    width: 300,
    // Figma `common / 뱃지 / 우선순위` 는 업무관리 목록과 같은 컴포넌트다.
    render: (row) => (
      <TaskPriorityBadge priority={(row as TaskReportTableRow).priority} />
    ),
  },
  {
    key: 'dueDate',
    header: '완료기한',
    width: 320,
    render: renderPlainCell('dueDate'),
  },
]

// 업무관리 목록 표(`TaskTable`)와 같은 계열이다. 탭바(y278 h46) 아래 30px 에서 표가 시작한다.
const appearance: DataTableAppearance = {
  offsetTop: 30,
  bordered: false,
  headerHeight: 72,
  headerBackground: 'tableHeaderStrong',
  headerFontSize: 22,
  rowHeight: 100,
  dividerColor: 'textFaint',
  dividerInset: 0,
  align: 'left',
  paginationPlacement: 'outside',
}

export function TaskReportTable({
  reports,
  onRowClick,
  pagination,
  emptyLabel,
  renderRowAction,
}: TaskReportTableProps) {
  const reportById = new Map(reports.map((report) => [report.id, report]))
  const columns: DataTableColumn[] = renderRowAction
    ? [
        ...baseColumns,
        {
          key: 'actions',
          // Figma 액션 컬럼에는 헤더 라벨이 없다.
          header: '',
          width: 80,
          // 케밥 버튼은 셀 내 x=18 이다.
          paddingX: 18,
          variant: 'action',
          render: (row) => {
            const report = reportById.get(row.id)
            return report ? renderRowAction(report) : null
          },
        },
      ]
    : baseColumns

  return (
    <DataTable
      rows={reports.map(
        (report): TaskReportTableRow => ({
          id: report.id,
          assigneeName: report.assigneeName,
          reviewStatus: report.reviewStatus,
          priority: report.priority,
          dueDate: report.dueDate,
        }),
      )}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="task-report-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
      appearance={appearance}
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
