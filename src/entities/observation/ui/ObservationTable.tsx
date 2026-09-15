import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableAppearance,
  type DataTableColumn,
  type DataTableRow,
} from '@/shared/ui'
import { formatObservationDate } from '../model/date'
import type { Observation } from '../model/types'

interface ObservationTableProps {
  /** 현재 페이지 행. 페이지 자르기는 호출부가 한다. */
  rows: Observation[]
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  onRowClick: (observationId: string) => void
  /** 첨부 칸. 팝오버 열림 상태를 페이지가 소유하므로 렌더를 위임받는다. */
  renderAttachments: (observation: Observation) => ReactNode
  /** 행 케밥. 메뉴 열림·이동·삭제는 페이지가 소유한다. */
  renderRowAction: (observation: Observation) => ReactNode
  emptyLabel: ReactNode
}

interface ObservationTableRow extends DataTableRow {
  date: string
  observerName: string
  title: string
}

// 섹션 헤더↔표 24px(species-detail 과 같은 설정). 테두리·헤더 52·행 92·inset 40·페이지네이션 inside 는 기본값이다.
const appearance: DataTableAppearance = {
  offsetTop: 24,
  headerBackground: 'tableHeaderStrong',
  dividerColor: 'textGuide',
}

// Figma COMPONENT `observation list`(127:9224) — 컬럼 고정폭 날짜 200 / 관찰자 180 / 제목 560 / 첨부 300 / 액션 80.
export function ObservationTable({
  rows,
  page,
  pageCount,
  onPageChange,
  onRowClick,
  renderAttachments,
  renderRowAction,
  emptyLabel,
}: ObservationTableProps) {
  const observationById = new Map(
    rows.map((observation) => [observation.id, observation]),
  )

  function renderWithObservation(
    render: (observation: Observation) => ReactNode,
  ) {
    return function renderCell(row: DataTableRow) {
      const observation = observationById.get(row.id)
      return observation ? render(observation) : null
    }
  }

  const columns: DataTableColumn[] = [
    {
      key: 'date',
      header: '날짜',
      width: 200,
      render: (row) => (
        <MutedText>{(row as ObservationTableRow).date}</MutedText>
      ),
    },
    {
      key: 'observerName',
      header: '관찰자',
      width: 180,
      render: (row) => (
        <MutedText>{(row as ObservationTableRow).observerName}</MutedText>
      ),
    },
    {
      key: 'title',
      header: '제목',
      width: 560,
      render: (row) => (
        <TitleText>{(row as ObservationTableRow).title}</TitleText>
      ),
    },
    {
      key: 'attachments',
      header: '첨부',
      width: 300,
      // 칸 안 클릭(칩·`외 N개`·빈 곳)이 행 이동을 일으키지 않게 action 칸으로 둔다.
      variant: 'action',
      render: renderWithObservation(renderAttachments),
    },
    {
      key: 'actions',
      // Figma 액션 컬럼에는 헤더 라벨이 없다. 케밥 44×52 는 칸 가운데(@18,20)다.
      header: '',
      width: 80,
      paddingX: 0,
      align: 'center',
      variant: 'action',
      render: renderWithObservation(renderRowAction),
    },
  ]

  return (
    <TableScroll>
      <TableFrame>
        <DataTable
          rows={rows.map((observation): ObservationTableRow => ({
            id: observation.id,
            date: formatObservationDate(observation.observedAt),
            observerName: observation.observerName,
            title: observation.title,
          }))}
          columns={columns}
          onRowClick={onRowClick}
          rowTestId="observation-row"
          pagination={{ page, pageCount, onChange: onPageChange }}
          emptyLabel={emptyLabel}
          appearance={appearance}
        />
      </TableFrame>
    </TableScroll>
  )
}

// 좁은 화면에서는 표만 가로 스크롤한다. 넓은 화면에서는 케밥 메뉴·첨부 팝오버가
// 표 밖으로 나가야 하므로 overflow 를 두지 않는다.
const TableScroll = styled.div`
  @media (max-width: 980px) {
    overflow-x: auto;
  }
`

const TableFrame = styled.div`
  min-width: 1320px;
`

const MutedText = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const TitleText = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`
