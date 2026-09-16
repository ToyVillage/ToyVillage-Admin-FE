import { useId, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createLegalStatus,
  deleteLegalStatus,
  legalStatusQueryKeys,
  speciesQueryKeys,
  type LegalStatus,
} from '@/entities/species'
import {
  DeleteConfirmationDialog,
  FormFieldCard,
  RemoveIconButton,
  useFocusFrame,
} from '@/shared/ui'
import { LegalDesignationAddDialog } from './LegalDesignationAddDialog'

interface LegalDesignationFieldProps {
  /** 기본 선택지. 항상 이 순서로 먼저 보이고 제거 버튼이 없다. */
  presets: readonly string[]
  /** 서버 공용 목록. 조회 중이거나 실패하면 undefined. */
  statuses: LegalStatus[] | undefined
  loadFailed: boolean
  /** 선택된 이름, 화면 순서 */
  value: string[]
  onChange: (value: string[]) => void
}

// Figma `field / 법정지정분류`(127:9354) — 다중 선택 pill + 직접 추가.
// 표시 목록 = 기본 선택지 → 서버 공용 목록(✕ 로 서버에서 삭제) → 저장값 중 목록에 없는 이름.
// 목록에 없는 저장값(공용 목록에서 삭제된 분류)은 선택된 채 보이고 저장할 때 다시 만든다.
export function LegalDesignationField({
  presets,
  statuses,
  loadFailed,
  value,
  onChange,
}: LegalDesignationFieldProps) {
  const labelId = useId()
  const hintId = useId()
  const queryClient = useQueryClient()
  const addButtonRef = useRef<HTMLButtonElement>(null)
  // 렌더 전 연속 제출(더블클릭·Enter 연타)도 막는다. isPending 은 다음 렌더에야 바뀐다.
  const addingRef = useRef(false)
  const deletingRef = useRef(false)
  const removeButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LegalStatus | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const focusFrame = useFocusFrame()

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      await createLegalStatus({ kind: name })
      await queryClient.invalidateQueries({
        queryKey: legalStatusQueryKeys.all,
      })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: async (status: LegalStatus) => {
      await deleteLegalStatus({ animalLegalStatusId: status.id })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: legalStatusQueryKeys.all }),
        // 이 분류를 가진 종의 상세 응답 id 가 null 로 바뀐다.
        queryClient.invalidateQueries({
          queryKey: speciesQueryKeys.all,
          refetchType: 'none',
        }),
      ])
    },
  })

  const serverStatuses = (statuses ?? []).filter(
    (status) => !presets.includes(status.name),
  )
  const knownNames = [...presets, ...serverStatuses.map(({ name }) => name)]
  const orphanNames = value.filter((name) => !knownNames.includes(name))
  const names = [...knownNames, ...orphanNames]
  const selectedNames = new Set(value)

  function statusByName(name: string) {
    return serverStatuses.find((status) => status.name === name)
  }

  function handleToggle(name: string) {
    const nextSelectedNames = new Set(selectedNames)
    if (nextSelectedNames.has(name)) nextSelectedNames.delete(name)
    else nextSelectedNames.add(name)
    onChange(names.filter((item) => nextSelectedNames.has(item)))
  }

  // 새 분류는 공용 목록을 다시 받은 뒤 선택값 끝에 붙는다.
  function handleAdd(name: string) {
    if (addingRef.current || addMutation.isPending) return

    addingRef.current = true
    addMutation.mutate(name, {
      onSettled: () => {
        addingRef.current = false
      },
      onSuccess: () => {
        onChange([...value.filter((item) => item !== name), name])
        closeAddDialog()
      },
    })
  }

  // 모달 cleanup 이 inert 를 푼 뒤에 호출 버튼으로 포커스를 돌린다.
  function closeAddDialog() {
    addMutation.reset()
    setIsAddDialogOpen(false)
    focusFrame(() => addButtonRef.current)
  }

  function handleConfirmDelete() {
    if (!deleteTarget || deletingRef.current || deleteMutation.isPending) return

    deletingRef.current = true
    const target = deleteTarget
    deleteMutation.mutate(target, {
      onSettled: () => {
        deletingRef.current = false
      },
      onSuccess: () => {
        setDeleteTarget(null)
        setDeleteFailed(false)
        onChange(value.filter((name) => name !== target.name))
        focusFrame(() => addButtonRef.current)
      },
      onError: () => {
        setDeleteTarget(null)
        setDeleteFailed(true)
        focusFrame(() => removeButtonsRef.current.get(target.name))
      },
    })
  }

  function handleCancelDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    focusFrame(() => removeButtonsRef.current.get(target.name))
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
          const status = statusByName(name)
          const isSelected = selectedNames.has(name)

          return (
            <Pill
              key={name}
              data-selected={isSelected}
              data-removable={Boolean(status)}
            >
              <ToggleButton
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleToggle(name)}
              >
                {name}
              </ToggleButton>
              {status && (
                <RemoveIconButton
                  ref={(node: HTMLButtonElement | null) => {
                    if (node) removeButtonsRef.current.set(name, node)
                    else removeButtonsRef.current.delete(name)
                  }}
                  type="button"
                  aria-label={`${name} 삭제`}
                  onClick={() => {
                    setDeleteFailed(false)
                    setDeleteTarget(status)
                  }}
                />
              )}
            </Pill>
          )
        })}
        <AddButton
          ref={addButtonRef}
          type="button"
          aria-haspopup="dialog"
          disabled={!statuses}
          onClick={() => setIsAddDialogOpen(true)}
        >
          <PlusIcon viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </PlusIcon>
          법정분류 추가
        </AddButton>
      </Pills>
      {loadFailed && (
        <StatusRow role="alert">
          법정지정분류를 불러오지 못했습니다. 다시 시도해 주세요.
        </StatusRow>
      )}
      {deleteFailed && (
        <StatusRow role="alert">
          삭제하지 못했습니다. 다시 시도해 주세요.
        </StatusRow>
      )}
      {isAddDialogOpen && (
        <LegalDesignationAddDialog
          existingNames={names}
          pending={addMutation.isPending}
          failed={addMutation.isError}
          onCancel={closeAddDialog}
          onAdd={handleAdd}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </FormFieldCard>
  )
}

const StatusRow = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 20px;
  font-weight: 500;
`

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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

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
