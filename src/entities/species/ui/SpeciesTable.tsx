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
import { taxonGroupLabels } from '../model/labels'
import type { SpeciesListItem } from '../model/types'

interface SpeciesTableProps {
  species: SpeciesListItem[]
  onRowClick: (id: string) => void
  search: DataTableSearch
  pagination: DataTablePagination
  /** 빈 상태 문구. 로딩 중에는 생략해 문구를 띄우지 않는다. */
  emptyLabel?: ReactNode
  /** 행 우측 케밥 메뉴. 메뉴 동작(이동·삭제)은 페이지가 소유한다. */
  renderRowAction: (species: SpeciesListItem) => ReactNode
  // 첫 조회 중. 헤더·검색바는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
}

// Figma `species list`(127:9099) — 탭바 하단 32, 헤더 `#DDDDE3`, 행 구분선 `#848491`.
const appearance: DataTableAppearance = {
  offsetTop: 32,
  bordered: true,
  headerHeight: 52,
  headerBackground: 'tableHeaderStrong',
  headerFontSize: 20,
  rowHeight: 92,
  dividerColor: 'textGuide',
  dividerInset: 40,
  align: 'left',
  paginationPlacement: 'inside',
}

// Figma 컬럼 고정폭: 분류군 240 / 국명 282 / 학명 478 / 마리수 240 / 케밥 80.
const baseColumns: DataTableColumn[] = [
  {
    key: 'taxonGroup',
    header: '분류군',
    width: 240,
    render: (row) => <MutedCell>{row.taxonGroup}</MutedCell>,
  },
  {
    key: 'koreanName',
    header: '국명',
    width: 282,
    render: (row) => <NameCell>{row.koreanName}</NameCell>,
  },
  {
    key: 'scientificName',
    header: '학명',
    width: 478,
    render: (row) => <MutedCell>{row.scientificName}</MutedCell>,
  },
  {
    key: 'individualCount',
    header: '마리수',
    width: 240,
    render: (row) => <CountCell>{row.individualCount}</CountCell>,
  },
]

// Species → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function SpeciesTable({
  species,
  onRowClick,
  search,
  pagination,
  emptyLabel,
  renderRowAction,
  loading,
}: SpeciesTableProps) {
  const speciesById = new Map(species.map((item) => [item.id, item]))
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
        const item = speciesById.get(row.id)
        return item ? renderRowAction(item) : null
      },
    },
  ]

  return (
    <TableScroll>
      <TableFrame>
        <DataTable
          rows={species.map((item): DataTableRow => ({
            id: item.id,
            taxonGroup: taxonGroupLabels[item.taxonGroup],
            koreanName: item.koreanName,
            scientificName: item.scientificName,
            individualCount: String(item.individualCount),
          }))}
          columns={columns}
          onRowClick={onRowClick}
          rowTestId="species-row"
          search={search}
          pagination={pagination}
          emptyLabel={emptyLabel}
          appearance={appearance}
          loading={loading}
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

const MutedCell = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const NameCell = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const CountCell = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`
