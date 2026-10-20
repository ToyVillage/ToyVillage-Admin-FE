import type { ComponentPropsWithRef } from 'react'
import styled from '@emotion/styled'
import { motionDuration, motionEasing } from './motion'

type ToggleSwitchProps = Omit<
  ComponentPropsWithRef<'button'>,
  'role' | 'onChange'
> & {
  checked: boolean
  onChange: (checked: boolean) => void
}

// Figma `toggle`(2775:24905) — 56x32 트랙과 24px 손잡이. 켜지면 손잡이가 오른쪽으로 간다.
export function ToggleSwitch({
  checked,
  onChange,
  ...props
}: ToggleSwitchProps) {
  return (
    <Track
      type="button"
      role="switch"
      aria-checked={checked}
      $checked={checked}
      {...props}
      onClick={() => onChange(!checked)}
    >
      <Knob aria-hidden="true" $checked={checked} />
    </Track>
  )
}

const Track = styled.button<{ $checked: boolean }>`
  display: inline-flex;
  width: 56px;
  height: 32px;
  flex: 0 0 56px;
  align-items: center;
  padding: 4px;
  border: 0;
  border-radius: 16px;
  background: ${({ theme, $checked }) =>
    $checked ? theme.colors.accent : theme.colors.dialogBorder};
  cursor: pointer;
  transition: background-color ${motionDuration.color}ms ${motionEasing.enter};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Knob = styled.span<{ $checked: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transform: translateX(${({ $checked }) => ($checked ? '24px' : '0')});
  transition: transform ${motionDuration.color}ms ${motionEasing.enter};
`
