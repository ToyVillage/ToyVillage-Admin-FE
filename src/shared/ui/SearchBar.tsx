import { useId } from 'react'
import styled from '@emotion/styled'
import searchIcon from './assets/search-material.svg'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

// Figma "search" 컴포넌트(2387:2480 / 인스턴스 4606:7700)의 공용 구현.
// height 60, padding 12/16, radius 44, 아이콘 26, gap 8, placeholder Medium 20 / #AFAFBA.
export function SearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: SearchBarProps) {
  const id = useId()
  const label = ariaLabel ?? placeholder ?? '검색'
  return (
    <Bar>
      <Icon src={searchIcon} alt="" aria-hidden="true" />
      <VisuallyHidden htmlFor={id}>{label}</VisuallyHidden>
      <Input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      />
    </Bar>
  )
}

const Bar = styled.div`
  display: flex;
  height: 60px;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const Icon = styled.img`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
`

const Input = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &::-webkit-search-cancel-button {
    cursor: pointer;
  }
`

const VisuallyHidden = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`
