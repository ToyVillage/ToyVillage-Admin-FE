import styled from '@emotion/styled'

interface WorkLogFormWizardStepsProps {
  current: 1 | 2
}

const steps = [
  { step: 1, caption: '1단계', label: '항목 설정' },
  { step: 2, caption: '2단계', label: '구역 번호 설정' },
] as const

// Figma componentSet `1:11277` — `1:11286`(1단계 활성) / `1:11278`(2단계 활성).
// 활성 dot 은 파란 원 안에 흰 링과 파란 점이 겹쳐 있고, 지나온 단계는 점 없이 파란 원만 남는다.
export function WorkLogFormWizardSteps({
  current,
}: WorkLogFormWizardStepsProps) {
  return (
    <Nav aria-label="양식 만들기 단계">
      <Track>
        <Connector $done={current === 2} aria-hidden="true" />
        {steps.map((item) => {
          const reached = current >= item.step
          return (
            <Step key={item.step}>
              <Dot $reached={reached} aria-hidden="true">
                {current === item.step && <DotRing />}
              </Dot>
              <Caption>{item.caption}</Caption>
              <Label aria-current={current === item.step ? 'step' : undefined}>
                {item.label}
              </Label>
            </Step>
          )
        })}
      </Track>
    </Nav>
  )
}

const Nav = styled.nav`
  display: flex;
  justify-content: center;
`

// Figma 420x103: dot 중심 사이 간격 280px, connector 는 그 사이를 잇는다.
const Track = styled.ol`
  position: relative;
  display: grid;
  width: 420px;
  margin: 0;
  padding: 0;
  grid-template-columns: 1fr 1fr;
  list-style: none;
`

const Connector = styled.span<{ $done: boolean }>`
  position: absolute;
  z-index: 0;
  top: 15px;
  left: 25%;
  width: 50%;
  height: 2px;
  background: ${({ theme, $done }) =>
    $done ? theme.colors.accent : theme.colors.tableHeaderStrong};
`

const Step = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`

const Dot = styled.span<{ $reached: boolean }>`
  position: relative;
  z-index: 1;
  display: grid;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme, $reached }) =>
    $reached ? theme.colors.accent : theme.colors.tableHeaderStrong};
  place-items: center;
`

const DotRing = styled.span`
  display: grid;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  place-items: center;

  &::after {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    content: '';
  }
`

const Caption = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Label = styled.span`
  margin-top: -8px;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
`
