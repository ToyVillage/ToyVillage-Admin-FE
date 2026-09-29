import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import plusIcon from './assets/plus.svg'
import { pillButtonIconStyles, pillButtonStyles } from './pillButtonStyles'

// `LinkButton` 과 같은 모양이지만 이동하지 않고 동작(모달 열기 등)을 실행한다.
interface PillButtonProps {
  onClick: () => void
  children: ReactNode
}

export function PillButton({ onClick, children }: PillButtonProps) {
  return (
    <Button type="button" onClick={onClick}>
      <PlusIcon src={plusIcon} alt="" aria-hidden="true" />
      <span>{children}</span>
    </Button>
  )
}

const Button = styled.button`
  ${({ theme }) => pillButtonStyles(theme)}
`

const PlusIcon = styled.img`
  ${pillButtonIconStyles}
`
