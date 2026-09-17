import styled from '@emotion/styled'
import circleLarge from '../assets/brand-circle-large.svg'
import circleSmall from '../assets/brand-circle-small.svg'
import circleTop from '../assets/brand-circle-top.svg'
import quarter from '../assets/brand-quarter.svg'

// 장식 패널이라 보조기술에는 노출하지 않는다.
export function LoginBrandPanel() {
  return (
    <Panel aria-hidden="true">
      <Square />
      <Shape src={circleLarge} alt="" $left={40} $top={120} $size={360} />
      <Shape src={circleTop} alt="" $left={460} $top={40} $size={260} />
      <Shape src={quarter} alt="" $left={40} $top={480} $size={260} />
      <Shape src={circleSmall} alt="" $left={540} $top={420} $size={190} />
      <BrownSquare />
      <Copy>
        <Eyebrow>Toy Village Operator</Eyebrow>
        <Headline>
          동물원의 하루를,
          <br />한 곳에서 관리해요.
        </Headline>
        <Body>
          공지부터 업무 지시, 개체 기록까지
          <br />
          운영에 필요한 모든 것을 담았습니다.
        </Body>
      </Copy>
    </Panel>
  )
}

const Panel = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.brandPanel};

  @media (max-width: 1279px) {
    display: none;
  }
`

const Square = styled.div`
  position: absolute;
  top: 300px;
  left: 300px;
  width: 300px;
  height: 300px;
  background: ${({ theme }) => theme.colors.brandPanelShape};
`

const BrownSquare = styled.div`
  position: absolute;
  top: 620px;
  left: 300px;
  width: 160px;
  height: 160px;
  background: rgba(115, 84, 55, 0.55);
`

const Shape = styled.img<{ $left: number; $top: number; $size: number }>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
`

const Copy = styled.div`
  position: absolute;
  bottom: 98px;
  left: 80px;
  display: flex;
  width: 600px;
  flex-direction: column;
`

const Eyebrow = styled.p`
  margin: 0;
  color: rgba(169, 236, 221, 0.34);
  font-size: 18px;
  font-weight: 600;
  line-height: normal;
`

const Headline = styled.p`
  margin: 20px 0 0;
  color: ${({ theme }) => theme.colors.surface};
  font-size: 44px;
  font-weight: 600;
  line-height: normal;
`

const Body = styled.p`
  margin: 32px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
`
