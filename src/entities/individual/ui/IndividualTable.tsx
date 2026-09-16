import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableAppearance,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
  type DataTableSearch,
} from '@/shared/ui'
import type { IndividualListItem, IndividualSex } from '../model/types'
import { IndividualSexBadge } from './IndividualSexBadge'

interface IndividualTableProps {
  individuals: IndividualListItem[]
  onRowClick: (id: string) => void
  search: DataTableSearch
  pagination: DataTablePagination
  /** 빈 상태 문구. 로딩 중에는 생략해 문구를 띄우지 않는다. */
  emptyLabel?: ReactNode
  /** 행 우측 케밥 메뉴. 메뉴 동작(이동·삭제)은 페이지가 소유한다. */
  renderRowAction: (individual: IndividualListItem) => ReactNode
}

interface IndividualTableRow extends DataTableRow {
  name: string
  sex: IndividualSex
  birthYear: string
}

// Figma `individual list`(130:9534) — 섹션 헤더 하단 24, 헤더 `#DDDDE3`, 행 구분선 `#848491`.
// 나머지(테두리·헤더 52·행 92·inset 40·페이지네이션 안쪽)는 DataTable 기본값이다.
const appearance: DataTableAppearance = {
  offsetTop: 24,
  headerBackground: 'tableHeaderStrong',
  dividerColor: 'textGuide',
}

// Figma 컬럼 고정폭: 이름 520 / 성별 300 / 출생연도 420 / 케밥 80.
const baseColumns: DataTableColumn[] = [
  {
    key: 'name',
    header: '이름',
    width: 520,
    render: (row) => <NameCell>{row.name}</NameCell>,
  },
  {
    key: 'sex',
    header: '성별',
    width: 300,
    render: (row) => (
      <IndividualSexBadge sex={(row as IndividualTableRow).sex} />
    ),
  },
  {
    key: 'birthYear',
    header: '출생연도',
    width: 420,
    render: (row) => <BirthYearCell>{row.birthYear}</BirthYearCell>,
  },
]

// Individual → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function IndividualTable({
  individuals,
  onRowClick,
  search,
  pagination,
  emptyLabel,
  renderRowAction,
}: IndividualTableProps) {
  const individualById = new Map(
    individuals.map((individual) => [individual.id, individual]),
  )
  const columns: DataTableColumn[] = [
    ...baseColumns,
    {
      key: 'actions',
      // Figma 액션 컬럼에는 헤더 라벨이 없다.
      header: '',
      width: 80,
      paddingX: 0,
      align: 'center',
      variant: 'action',
      render: (row) => {
        const individual = individualById.get(row.id)
        return individual ? renderRowAction(individual) : null
      },
    },
  ]

  return (
    <TableScroll>
      <TableFrame>
        <DataTable
          rows={individuals.map((individual): IndividualTableRow => ({
            id: individual.id,
            name: individual.name,
            sex: individual.sex,
            birthYear: `${individual.birthYear}년`,
          }))}
          columns={columns}
          onRowClick={onRowClick}
          rowTestId="individual-row"
          search={search}
          pagination={pagination}
          emptyLabel={emptyLabel}
          appearance={appearance}
        />
      </TableFrame>
    </TableScroll>
  )
}

// 좁은 화면에서는 표만 가로 스크롤한다. 넓은 화면에서는 케밥 메뉴가
// 표 밖으로 나가야 하므로 overflow 를 두지 않는다.
const TableScroll = styled.div`
  @media (max-width: 980px) {
    overflow-x: auto;
  }
`

const TableFrame = styled.div`
  min-width: 1320px;
`

const NameCell = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const BirthYearCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`
