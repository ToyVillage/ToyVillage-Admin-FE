import styled from '@emotion/styled'

interface TaskAssigneeCellProps {
  name: string
  /** 대표를 제외한 나머지 담당자 수. 0 이면 `외 N명` 을 렌더하지 않는다. */
  extraCount: number
}

// Figma 목록 `담당자` 셀. 대표 담당자 이름과 나머지 인원 수를 두 텍스트로 나눠 쓴다.
export function TaskAssigneeCell({ name, extraCount }: TaskAssigneeCellProps) {
  return (
    <Cell>
      <Name>{name}</Name>
      {extraCount > 0 && <Extra>외 {extraCount}명</Extra>}
    </Cell>
  )
}

const Cell = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Extra = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
