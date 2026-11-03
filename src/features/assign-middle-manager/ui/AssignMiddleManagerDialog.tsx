import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import {
  EmployeeIdentity,
  filterByNameOrUsername,
  type AssignableEmployee,
} from '@/entities/employee'
import {
  Checkbox,
  OutlinedSearchField,
  fadeIn,
  motionDuration,
  motionEasing,
  popIn,
  trapTab,
} from '@/shared/ui'

interface AssignMiddleManagerDialogProps {
  /** 아직 중간 관리자가 아닌 직원 */
  employees: AssignableEmployee[]
  loading: boolean
  loadFailed: boolean
  onSubmit: (employeeIds: number[]) => Promise<void>
  onCancel: () => void
  /** 지정 성공. 호출부가 같은 틱에 모달을 닫고 결과를 알린다(갱신은 기다리지 않는다). */
  onAssigned: () => void
  /** 지정 실패. 모달과 선택은 그대로 두고 호출부가 알린다. */
  onError: (error: unknown) => void
}

// Figma `중간 관리자 지정 모달` — 기본(3832:26009) · 2명 선택(3832:26144).
export function AssignMiddleManagerDialog({
  employees,
  loading,
  loadFailed,
  onSubmit,
  onCancel,
  onAssigned,
  onError,
}: AssignMiddleManagerDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [isPending, setIsPending] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const submittingRef = useRef(false)
  // 호출부가 매 렌더 새 onCancel 을 넘겨도 아래 effect 가 다시 돌지 않게 ref 로 읽는다.
  const onCancelRef = useRef(onCancel)

  // 걸러져 안 보이는 직원의 선택도 유지되고 함께 지정된다.
  const visibleEmployees = filterByNameOrUsername(employees, keyword)
  const selectedIds = employees
    .filter(({ id }) => selected.has(id))
    .map(({ id }) => id)
  const statusLabel = getStatusLabel({
    loading,
    loadFailed,
    employeeCount: employees.length,
    visibleCount: visibleEmployees.length,
  })

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    searchRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!submittingRef.current) onCancelRef.current()
        return
      }

      if (event.key === 'Tab') trapTab(dialogRef.current, event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [])

  function toggle(employeeId: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(employeeId)) next.add(employeeId)
      return next
    })
  }

  function cancel() {
    if (!submittingRef.current) onCancel()
  }

  async function submit() {
    if (submittingRef.current || selectedIds.length === 0) return

    submittingRef.current = true
    setIsPending(true)

    try {
      await onSubmit(selectedIds)
      submittingRef.current = false
      onAssigned()
    } catch (error) {
      submittingRef.current = false
      setIsPending(false)
      onError(error)
    }
  }

  return createPortal(
    <Overlay
      onMouseDown={(event) => event.target === event.currentTarget && cancel()}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isPending || loading}
      >
        <Heading>
          <Title id={titleId}>중간 관리자 지정</Title>
          <Description id={descriptionId}>
            중간 관리자로 지정할 직원을 선택하세요
          </Description>
        </Heading>

        <OutlinedSearchField
          inputRef={searchRef}
          value={keyword}
          placeholder="이름 또는 아이디 검색"
          ariaLabel="이름 또는 아이디 검색"
          onChange={setKeyword}
        />

        <ListArea>
          {statusLabel != null ? (
            <ListStatus role="status">{statusLabel}</ListStatus>
          ) : (
            <EmployeeList>
              {visibleEmployees.map((employee) => {
                const checked = selected.has(employee.id)
                return (
                  <li key={employee.id}>
                    <EmployeeRow $selected={checked}>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggle(employee.id)}
                      />
                      <EmployeeIdentity
                        name={employee.name}
                        username={employee.username}
                      />
                    </EmployeeRow>
                  </li>
                )
              })}
            </EmployeeList>
          )}
        </ListArea>

        <Actions>
          <CancelButton type="button" disabled={isPending} onClick={cancel}>
            취소
          </CancelButton>
          <SubmitButton
            type="button"
            $pending={isPending}
            disabled={isPending || selectedIds.length === 0}
            onClick={() => void submit()}
          >
            {selectedIds.length > 0
              ? `${selectedIds.length}명 지정하기`
              : '지정하기'}
          </SubmitButton>
        </Actions>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

interface StatusLabelInput {
  loading: boolean
  loadFailed: boolean
  employeeCount: number
  visibleCount: number
}

function getStatusLabel({
  loading,
  loadFailed,
  employeeCount,
  visibleCount,
}: StatusLabelInput): string | null {
  if (loading) return ''
  if (loadFailed) return '직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.'
  if (employeeCount === 0) return '지정할 수 있는 직원이 없습니다'
  if (visibleCount === 0) return '검색결과가 없습니다'
  return null
}

const Overlay = styled.div`
  position: fixed;
  z-index: 21;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 40px 0;
  background: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 640px);
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
  animation: ${popIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma: 5행(행 79 + 간격 4) 높이. 걸러져 행이 줄어도 모달 높이가 흔들리지 않게 고정하고, 넘치면 안에서 스크롤한다.
const ListArea = styled.div`
  height: 411px;
  overflow-y: auto;
`

const EmployeeList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
`

const EmployeeRow = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.background : 'transparent'};
  cursor: pointer;
`

const ListStatus = styled.p`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
`

const DialogButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 16px 24px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const CancelButton = styled(DialogButton)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`

// 선택 0명(Figma 3832:26027)은 회색, 제출 중은 원래 색을 흐리게 둔다.
const SubmitButton = styled(DialogButton)<{ $pending: boolean }>`
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};

  &:disabled {
    background: ${({ theme, $pending }) =>
      $pending ? theme.colors.textStrong : theme.colors.textGuide};
    cursor: ${({ $pending }) => ($pending ? 'wait' : 'not-allowed')};
    opacity: ${({ $pending }) => ($pending ? 0.65 : 1)};
  }
`
