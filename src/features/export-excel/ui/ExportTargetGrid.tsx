import { useId } from 'react'
import styled from '@emotion/styled'
import {
  excelExportTargetOptions,
  type ExcelExportTarget,
} from '@/entities/excel-export'
import { ExportCheckbox } from './ExportCheckbox'
import { ExportTargetCard } from './ExportTargetCard'

interface ExportTargetGridProps {
  selectedTargets: ExcelExportTarget[]
  onToggle: (target: ExcelExportTarget) => void
  onToggleAll: () => void
}

// Figma `항목 선택`(2995:25179) — 제목·전체 선택과 항목 9개 격자.
export function ExportTargetGrid({
  selectedTargets,
  onToggle,
  onToggleAll,
}: ExportTargetGridProps) {
  const titleId = useId()

  const selectedCount = selectedTargets.length
  const allSelected = selectedCount === excelExportTargetOptions.length
  const someSelected = selectedCount > 0 && !allSelected

  return (
    <Card aria-labelledby={titleId}>
      <Header>
        <Title id={titleId}>내보낼 항목</Title>
        <SelectAll>
          <ExportCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={onToggleAll}
          />
          전체 선택
        </SelectAll>
      </Header>
      <Grid>
        {excelExportTargetOptions.map((option) => (
          <ExportTargetCard
            key={option.id}
            option={option}
            checked={selectedTargets.includes(option.id)}
            onToggle={onToggle}
          />
        ))}
      </Grid>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const SelectAll = styled.label`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.textValue};
  cursor: pointer;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 20px;

  @media (max-width: 1320px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`
