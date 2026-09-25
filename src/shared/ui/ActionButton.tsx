import type { ComponentPropsWithoutRef } from 'react'
import styled from '@emotion/styled'
import { motionDuration, motionEasing } from './motion'

interface ActionButtonProps extends ComponentPropsWithoutRef<'button'> {
  // Figma 의 검은 버튼은 대부분 hug 높이(61px)지만, 구역 설정 행의 `생성`·`추가` 는
  // 옆 입력과 높이를 맞춘 66px 이다.
  height?: number
}

// Figma `1:4402`(다음) / `1:5509`(생성하기) / `1:4241`(저장하기) /
// `1:5466`(생성) / `1:5475`(추가) — 같은 규격의 검은 주요 액션 버튼.
export function ActionButton({ height, ...props }: ActionButtonProps) {
  return <Button type="button" $height={height} {...props} />
}

const Button = styled.button<{ $height?: number }>`
  display: inline-flex;
  height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  transition: opacity ${motionDuration.color}ms ${motionEasing.enter};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
