import { css, type Theme } from '@emotion/react'

// `+` 아이콘 pill 버튼 모양. 이동하는 `LinkButton` 과 모달을 여는 `PillButton` 이 같이 쓴다.
export const pillButtonStyles = (theme: Theme) => css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 0;
  background: ${theme.colors.textStrong};
  color: ${theme.colors.surface};
  border-radius: 53px;
  text-decoration: none;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;

  &:focus-visible {
    outline: 3px solid ${theme.colors.accent};
    outline-offset: 3px;
  }
`

export const pillButtonIconStyles = css`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  object-fit: none;
`
