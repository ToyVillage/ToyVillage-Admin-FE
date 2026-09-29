import styled from '@emotion/styled'
import eyeIcon from '../assets/eye.svg'
import eyeOffIcon from '../assets/eye-off.svg'

interface PasswordVisibilityButtonProps {
  isVisible: boolean
  onToggle: () => void
}

export function PasswordVisibilityButton({
  isVisible,
  onToggle,
}: PasswordVisibilityButtonProps) {
  const accessibleName = isVisible ? '비밀번호 숨기기' : '비밀번호 표시'

  return (
    <ToggleButton
      type="button"
      aria-label={accessibleName}
      aria-pressed={isVisible}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      <Icon
        src={isVisible ? eyeIcon : eyeOffIcon}
        alt=""
        aria-hidden="true"
      />
    </ToggleButton>
  )
}

const ToggleButton = styled.button`
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Icon = styled.img`
  width: 28px;
  height: 28px;
`
