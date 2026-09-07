import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import plusIcon from './assets/plus.svg'

// + 아이콘 pill 링크 버튼. "공지/자료 생성하기" 등 라우트·라벨만 다른 버튼 공통화.
interface LinkButtonProps {
  to: string
  children: ReactNode
}

export function LinkButton({ to, children }: LinkButtonProps) {
  return (
    <Button to={to}>
      <PlusIcon src={plusIcon} alt="" />
      <span>{children}</span>
    </Button>
  )
}

const Button = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  border-radius: 53px;
  text-decoration: none;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
`

const PlusIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  object-fit: none;
`
