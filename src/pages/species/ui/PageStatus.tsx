import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

type PageStatusProps =
  | { state: 'loading'; message: string }
  | { state: 'not-found'; message: string; linkTo: string; linkLabel: string }

// 개체관리 화면의 조회 중·없는 대상 상태(EditTaskPage 패턴). 상세는 본문 대신,
// 등록·수정은 폼·이탈 보호 없이 이 카드만 그린다.
export function PageStatus(props: PageStatusProps) {
  if (props.state === 'loading') {
    return (
      <StatePage>
        <StateCard role="status">{props.message}</StateCard>
      </StatePage>
    )
  }

  return (
    <StatePage>
      <StateCard role="alert">
        {props.message}
        <BackToParent to={props.linkTo}>{props.linkLabel}</BackToParent>
      </StateCard>
    </StatePage>
  )
}

const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  display: flex;
  width: min(100%, 560px);
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const BackToParent = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 600;
`
