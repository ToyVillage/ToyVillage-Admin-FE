import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

export function TaskBackLink() {
  return (
    <BackLink to="/tasks">
      <BackIcon viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 4-8 8 8 8" />
      </BackIcon>
      뒤로가기
    </BackLink>
  )
}

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding-left: 6px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`

const BackIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
`
