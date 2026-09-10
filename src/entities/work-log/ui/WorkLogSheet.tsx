import styled from '@emotion/styled'
import type { WorkLogSheetColumn, WorkLogSheetRow } from '../model/types'

interface WorkLogSheetProps {
  columns: WorkLogSheetColumn[]
  rows: WorkLogSheetRow[]
}

// Figma 516:13990(worklog sheet) / 541:14171(유형별). 첫 열은 `설정된 구역`,
// 그 뒤로 양식의 질문이 한 열씩 놓이고 셀 표기는 질문 유형에 따라 달라진다.
export function WorkLogSheet({ columns, rows }: WorkLogSheetProps) {
  return (
    <Scroll>
      <Sheet>
        <HeaderRow data-testid="work-log-sheet-header">
          <ZoneHeadCell>설정된 구역</ZoneHeadCell>
          {columns.map((column) => (
            <HeadCell key={column.id} $wide={column.type === 'LONG_TEXT'}>
              {column.label}
            </HeadCell>
          ))}
        </HeaderRow>
        {rows.map((row, rowIndex) => (
          <Row key={`${row.zone}-${rowIndex}`} data-testid="work-log-sheet-row">
            <ZoneCell $last={rowIndex === rows.length - 1}>{row.zone}</ZoneCell>
            {columns.map((column) => (
              <Cell
                key={column.id}
                $wide={column.type === 'LONG_TEXT'}
                $last={rowIndex === rows.length - 1}
              >
                {renderValue(column, row.values[column.id])}
              </Cell>
            ))}
          </Row>
        ))}
      </Sheet>
    </Scroll>
  )
}

function renderValue(
  column: WorkLogSheetColumn,
  value: string | string[] | null | undefined,
) {
  // 파일 업로드 셀은 이 화면에서 표기하지 않는다(spec).
  if (column.type === 'FILE' || value == null) return null

  if (column.type === 'CHECKBOX') {
    const picked = Array.isArray(value) ? value : [value]
    return (
      <Chips>
        {picked.map((item, index) => (
          <Chip key={`${item}-${index}`}>{item}</Chip>
        ))}
      </Chips>
    )
  }

  const text = Array.isArray(value) ? value.join(', ') : value
  if (column.type === 'LONG_TEXT') return <LongText>{text}</LongText>
  return <Text>{text}</Text>
}

// 질문 열 폭: 장문형은 남는 폭을 채우고 그 밖은 200px(Figma 1:5694).
// 질문이 많아 1320px 을 넘으면 200px 열이 먼저 줄어든다(Figma 541:14081 처럼 좁아진다).
const columnWidth = (wide: boolean) =>
  wide
    ? 'flex: 1 1 240px; min-width: 240px;'
    : 'flex: 0 1 200px; min-width: 120px;'

// `설정된 구역` 열도 같은 이유로 최소 120px 까지 줄어든다.
const zoneWidth = 'flex: 0 1 160px; min-width: 120px;'

const Scroll = styled.div`
  width: 100%;
  overflow-x: auto;
`

const Sheet = styled.div`
  min-width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`

const HeaderRow = styled.div`
  display: flex;
  min-height: 56px;
  background: ${({ theme }) => theme.colors.background};
`

const Row = styled.div`
  display: flex;
  min-height: 64px;
`

const cellFrame = `
  display: flex;
  align-items: center;
  padding: 0 24px;
`

const ZoneHeadCell = styled.div`
  ${cellFrame}
  ${zoneWidth}
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-bottom: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 600;
`

const HeadCell = styled.div<{ $wide: boolean }>`
  ${cellFrame}
  ${({ $wide }) => columnWidth($wide)}
  border-bottom: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 20px;
  font-weight: 500;

  &:not(:last-of-type) {
    border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

const ZoneCell = styled.div<{ $last: boolean }>`
  ${cellFrame}
  ${zoneWidth}
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  ${({ theme, $last }) =>
    $last
      ? ''
      : `border-bottom: 1px solid ${theme.colors.tableHeaderStrong};`}
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`

const Cell = styled.div<{ $wide: boolean; $last: boolean }>`
  ${cellFrame}
  ${({ $wide }) => columnWidth($wide)}
  ${({ theme, $last }) =>
    $last
      ? ''
      : `border-bottom: 1px solid ${theme.colors.tableHeaderStrong};`}

  &:not(:last-of-type) {
    border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

const Text = styled.span`
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
`

// 장문형은 열 폭을 넘으면 한 줄로 말줄임한다(spec). 행 높이는 늘지 않는다.
const LongText = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 20px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Chips = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`
