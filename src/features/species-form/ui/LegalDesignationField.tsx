import { useId, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { FormFieldCard, RemoveIconButton, useFocusFrame } from '@/shared/ui'
import { LegalDesignationAddDialog } from './LegalDesignationAddDialog'

interface LegalDesignationFieldProps {
  /** 기본 선택지. 항상 이 순서로 먼저 보이고 제거 버튼이 없다. */
  presets: readonly string[]
  /** 선택된 이름, 화면 순서 */
  value: string[]
  onChange: (value: string[]) => void
}

// Figma `field / 법정지정분류`(127:9354) — 다중 선택 pill + 직접 추가.
// 표시 목록(기본 선택지 + 직접 추가 항목)은 이 필드가 갖고 선택값만 밖으로 올린다.
// 수정 진입 시 저장값 중 기본 선택지에 없는 이름으로 직접 추가 목록을 채운다.
export function LegalDesignationField({
  presets,
  value,
  onChange,
}: LegalDesignationFieldProps) {
  const labelId = useId()
  const hintId = useId()
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const [customNames, setCustomNames] = useState(() =>
    value.filter((name) => !presets.includes(name)),
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const focusFrame = useFocusFrame()

  const names = [...presets, ...customNames]
  const selectedNames = new Set(value)

  function emitSelection(nextSelectedNames: Set<string>, nextNames: string[]) {
    onChange(nextNames.filter((name) => nextSelectedNames.has(name)))
  }

  function handleToggle(name: string) {
    const nextSelectedNames = new Set(selectedNames)
    if (nextSelectedNames.has(name)) nextSelectedNames.delete(name)
    else nextSelectedNames.add(name)
    emitSelection(nextSelectedNames, names)
  }

  function handleRemove(name: string) {
    setCustomNames(customNames.filter((customName) => customName !== name))
    onChange(value.filter((selectedName) => selectedName !== name))
  }

  // 직접 추가한 이름은 목록 끝에 붙고 바로 선택된다.
  function handleAdd(name: string) {
    setCustomNames([...customNames, name])
    emitSelection(new Set([...value, name]), [...names, name])
    closeAddDialog()
  }

  // 모달 cleanup 이 inert 를 푼 뒤에 호출 버튼으로 포커스를 돌린다.
  function closeAddDialog() {
    setIsAddDialogOpen(false)
    focusFrame(() => addButtonRef.current)
  }

  return (
    <FormFieldCard
      label="법정지정분류"
      labelId={labelId}
      hint="해당하는 항목을 모두 선택해주세요. 목록에 없으면 직접 추가할 수 있습니다."
      hintId={hintId}
    >
      <Pills role="group" aria-labelledby={labelId} aria-describedby={hintId}>
        {names.map((name) => {
          const isCustom = !presets.includes(name)
          const isSelected = selectedNames.has(name)

          return (
            <Pill
              key={name}
              data-selected={isSelected}
              data-removable={isCustom}
            >
              <ToggleButton
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleToggle(name)}
              >
                {name}
              </ToggleButton>
              {isCustom && (
                <RemoveIconButton
                  type="button"
                  aria-label={`${name} 삭제`}
                  onClick={() => handleRemove(name)}
                />
              )}
            </Pill>
          )
        })}
        <AddButton
          ref={addButtonRef}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </PlusIcon>
          법정분류 추가
        </AddButton>
      </Pills>
      {isAddDialogOpen && (
        <LegalDesignationAddDialog
          existingNames={names}
          onCancel={closeAddDialog}
          onAdd={handleAdd}
        />
      )}
    </FormFieldCard>
  )
}

// Figma 는 한 줄 overflow-clip 이지만 직접 추가로 항목이 늘어나 줄바꿈한다.
const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

// Figma 는 테두리를 안쪽 stroke 로 그린다. CSS 에서는 테두리 1px 만큼 padding 을 줄인다.
// 직접 추가 항목은 padding 14px 24px 14px 32px, 글자-제거 아이콘 gap 8px.
const Pill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.choiceMuted};

  &[data-removable='true'] {
    padding-right: 23px;
  }

  &[data-selected='true'] {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentBg};
    color: ${({ theme }) => theme.colors.accent};
  }

  &:has(> button[aria-pressed]:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const ToggleButton = styled.button`
  padding: 13px 31px;
  border: 0;
  border-radius: 100px;
  outline: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  [data-removable='true'] > & {
    padding-right: 0;
  }
`

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 13px 31px 13px 23px;
  border: 1px solid ${({ theme }) => theme.colors.textGuide};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const PlusIcon = styled.svg`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
`
