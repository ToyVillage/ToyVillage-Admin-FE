import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import plusIcon from './assets/plus.svg'
import { pillButtonIconStyles, pillButtonStyles } from './pillButtonStyles'

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
  ${({ theme }) => pillButtonStyles(theme)}
`

const PlusIcon = styled.img`
  ${pillButtonIconStyles}
`
