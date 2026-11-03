import type { Ref } from 'react'
import styled from '@emotion/styled'
import searchIcon from './assets/search-material.svg'

interface OutlinedSearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
  inputRef?: Ref<HTMLInputElement>
}

// Figma `search`(직원 계정 관리 · 권한 관리) — 흰 바탕 테두리 입력. 높이 52, radius 8, 아이콘 24.
// 폭은 부모를 채운다. 카드 안 알약 모양인 `SearchBar` 와 규격이 다르다.
export function OutlinedSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  inputRef,
}: OutlinedSearchFieldProps) {
  return (
    <Field>
      <Icon src={searchIcon} alt="" aria-hidden="true" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

const Field = styled.label`
  display: flex;
  width: 100%;
  height: 52px;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Icon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const Input = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }
`
