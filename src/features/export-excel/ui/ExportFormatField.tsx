import { useId } from 'react'
import styled from '@emotion/styled'
import type { ExcelExportMode } from '@/entities/excel-export'
import { Radio } from '@/shared/ui'

interface ExportFormatFieldProps {
  value: ExcelExportMode
  onChange: (mode: ExcelExportMode) => void
}

const formatOptions: {
  mode: ExcelExportMode
  name: string
  description: string
}[] = [
  {
    mode: 'SHEET',
    name: '엑셀 파일 (.xlsx)',
    description: '항목별 시트 · 첨부파일은 엑셀 안에 포함',
  },
  {
    mode: 'ZIP',
    name: '압축 파일 (.zip)',
    description: '항목별 엑셀 · 첨부파일은 원본 그대로 포함',
  },
]

// Figma `파일 형식`(3706:25836) — 카드 아무 곳이나 눌러도 형식이 바뀐다.
export function ExportFormatField({ value, onChange }: ExportFormatFieldProps) {
  const id = useId()
  const titleId = `${id}-title`

  return (
    <Card aria-labelledby={titleId}>
      <Title id={titleId}>파일 형식</Title>
      <Options role="radiogroup" aria-labelledby={titleId}>
        {formatOptions.map((option) => (
          <Option key={option.mode} data-checked={value === option.mode}>
            <Radio
              name={id}
              value={option.mode}
              checked={value === option.mode}
              onChange={() => onChange(option.mode)}
              aria-labelledby={`${id}-${option.mode}-name`}
              aria-describedby={`${id}-${option.mode}-description`}
            />
            <Text>
              <Name id={`${id}-${option.mode}-name`}>{option.name}</Name>
              <Description id={`${id}-${option.mode}-description`}>
                {option.description}
              </Description>
            </Text>
          </Option>
        ))}
      </Options>
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

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
`

// 항목 카드(ExportTargetCard)와 같이 테두리는 늘 1px 로 두고 선택 시 안쪽 그림자로 2px 처럼 보이게 한다.
const Option = styled.label`
  display: flex;
  min-width: 0;
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

const Description = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
`
