import styled from '@emotion/styled'
import {
  DataTable,
  KebabMenu,
  TruncatedText,
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
  // 첫 조회 중. 헤더·검색바는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
}

// Figma `479:14491` 의 열 구성. `항목`(600~760) 열은 헤더도 셀도 비어 있는
// 미사용 열이라 `양식` 열 760 에 합쳐 구현한다(spec 비고).
// `양식` 열은 폭을 고정하지 않고 남는 폭을 채운다. 1320 에서는 Figma 대로 760 이 되고,
// 화면이 좁아지면 이 열만 줄어 케밥이 표 밖으로 밀려나지 않는다.
const emptyColumns: DataTableColumn[] = [
  { key: 'name', header: '양식', render: renderNameCell },
  {
    key: 'authorName',
    header: '작성자',
    width: 200,
    paddingX: 24,
    render: renderAuthorCell,
  },
  {
    key: 'date',
    header: '날짜',
    width: 360,
    paddingX: 24,
    render: renderDateCell,
  },
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
  loading,
}: WorkLogFormTableProps) {
  const columns: DataTableColumn[] =
    forms.length === 0
      ? emptyColumns
      : [
          { key: 'name', header: '양식', render: renderNameCell },
          {
            key: 'authorName',
            header: '작성자',
            width: 200,
            paddingX: 24,
            render: renderAuthorCell,
          },
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
                onOpenChange={(open) => onOpenKebabChange(open ? row.id : null)}
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
      rows={forms.map((form): DataTableRow => ({
        id: form.id,
        name: form.name,
        authorName: form.authorName,
        date: formatWorkLogDate(form.date),
      }))}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="work-log-form-row"
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={500}
      loading={loading}
    />
  )
}

function renderNameCell(row: DataTableRow) {
  return <TruncatedText value={String(row.name)} />
}

// 작성자는 로그인 아이디(`scenario.manager` 등)라 열 폭을 넘을 수 있다.
// 날짜 열을 침범하지 않게 말줄임하고, hover 로 전체 값을 보여준다.
function renderAuthorCell(row: DataTableRow) {
  return <TruncatedText value={String(row.authorName)} />
}

function renderDateCell(row: DataTableRow) {
  return <DateCell>{row.date}</DateCell>
}

const DateCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
