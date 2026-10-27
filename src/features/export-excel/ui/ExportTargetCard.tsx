import { useId } from 'react'
import styled from '@emotion/styled'
import type {
  ExcelExportTarget,
  ExcelExportTargetOption,
} from '@/entities/excel-export'
import { ExportCheckbox } from './ExportCheckbox'

interface ExportTargetCardProps {
  option: ExcelExportTargetOption
  checked: boolean
  onToggle: (target: ExcelExportTarget) => void
}

// Figma `export item / <이름> (on|off)`(2995:25187 등). 카드 아무 곳이나 눌러도 선택이 바뀐다.
export function ExportTargetCard({
  option,
  checked,
  onToggle,
}: ExportTargetCardProps) {
  const id = useId()
  const nameId = `${id}-name`
  const basisId = `${id}-basis`

  return (
    <Card data-checked={checked}>
      <ExportCheckbox
        checked={checked}
        onChange={() => onToggle(option.id)}
        labelledBy={nameId}
        describedBy={basisId}
      />
      <Text>
        <Name id={nameId}>{option.name}</Name>
        <Basis id={basisId}>{option.basis}</Basis>
      </Text>
    </Card>
  )
}

// Figma 선택 테두리는 2px 이지만, 테두리 두께가 바뀌면 내용이 1px 밀린다.
// 테두리는 늘 1px 로 두고 선택 시 안쪽 그림자 1px 를 더해 2px 로 보이게 한다.
const Card = styled.label`
  display: flex;
  min-width: 0;
  min-height: 104px;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  &[data-checked='true'] {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.accent};
  }
`

const Text = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  line-height: 1.2;
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
`

const Basis = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
`
