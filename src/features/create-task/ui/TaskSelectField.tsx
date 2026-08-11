import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import styled from '@emotion/styled'

export interface TaskSelectOption {
  value: string
  label: string
}

interface TaskSelectFieldProps {
  label: string
  placeholder: string
  options: TaskSelectOption[]
  value: string | null
  onChange: (value: string) => void
}

// Figma "section" / "title section" — 공개범위·담당자 공용 드롭다운.
// 바깥 클릭과 Esc 로 선택 없이 닫힌다.
export const TaskSelectField = forwardRef<
  HTMLButtonElement,
  TaskSelectFieldProps
>(function TaskSelectField(
  { label, placeholder, options, value, onChange },
  ref,
) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <Card ref={containerRef}>
      <Label id={`${listId}-label`}>{label}</Label>
      <Control>
        <Trigger
          ref={ref}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${listId}-label`}
          onClick={() => setOpen((current) => !current)}
        >
          <TriggerText $empty={!selected}>
            {selected?.label ?? placeholder}
          </TriggerText>
          <Chevron viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.4 6.6 10l1.4-1.4 4 4 4-4L17.4 10z" />
          </Chevron>
        </Trigger>

        {open && (
          <OptionList role="listbox" aria-labelledby={`${listId}-label`}>
            {options.map((option) => (
              <OptionItem
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </OptionItem>
            ))}
          </OptionList>
        )}
      </Control>
    </Card>
  )
})

const Card = styled.div`
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 184px;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Label = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
`

const Control = styled.div`
  position: relative;
`

const Trigger = styled.button`
  display: flex;
  width: 100%;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 20px 24px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  font-family: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const TriggerText = styled.span<{ $empty: boolean }>`
  color: ${({ theme, $empty }) =>
    $empty ? theme.colors.textFaint : theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
`

const Chevron = styled.svg`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  fill: ${({ theme }) => theme.colors.textFaint};
`

const OptionList = styled.div`
  position: absolute;
  z-index: 2;
  top: calc(100% + 8px);
  left: 0;
  display: flex;
  width: 100%;
  flex-direction: column;
  padding: 8px 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
`

const OptionItem = styled.button`
  min-height: 56px;
  padding: 0 24px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 22px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${({ theme }) => theme.colors.background};
  }
`
