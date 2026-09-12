import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

interface TaskBackLinkProps {
  /** 돌아갈 경로. 생성·상세는 목록, 수정은 그 업무의 상세로 돌아간다. */
  to?: string
}

export function TaskBackLink({ to = '/tasks' }: TaskBackLinkProps) {
  return (
    <BackLink to={to}>
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
