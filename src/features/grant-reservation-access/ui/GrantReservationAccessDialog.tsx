import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import type { Staff } from '@/entities/reservation'
import staffAddIcon from './assets/staff-add.svg'
import staffAddedIcon from './assets/staff-added.svg'

interface GrantReservationAccessDialogProps {
  reservationCount: number
  staff: Staff[]
  pending?: boolean
  onCancel: () => void
  onConfirm: (staffIds: string[]) => void
}

// 선택한 예약에 접근할 직원을 지정하는 모달. Figma: 제목 + 직원 이름 검색 +
// 직원별(아바타·이름·추가/추가완료 토글) 목록 + 취소/확인.
// 진입 시 체크한 예약 건수(reservationCount)를 제목 아래에 함께 보여준다.
export function GrantReservationAccessDialog({
  reservationCount,
  staff,
  pending = false,
  onCancel,
  onConfirm,
}: GrantReservationAccessDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const pendingRef = useRef(pending)
  const [query, setQuery] = useState('')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  const filteredStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return staff
    return staff.filter((member) =>
      member.name.toLowerCase().includes(keyword),
    )
  }, [query, staff])

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'))

    focusables()[0]?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        // 저장(권한 부여) 진행 중에는 취소 버튼과 동일하게 Escape로 닫지 않는다.
        if (pendingRef.current) return
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
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
  }, [onCancel])

  function toggleStaff(id: string) {
    setSelectedStaffIds((current) =>
      current.includes(id)
        ? current.filter((staffId) => staffId !== id)
        : [...current, id],
    )
  }

  return createPortal(
    <Overlay>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Title id={titleId}>권한 줄 직원을 선택해주세요</Title>
        <ReservationCount aria-live="polite">
          선택한 예약 {reservationCount}건
        </ReservationCount>

        <SearchBar>
          <SearchGlyph viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </SearchGlyph>
          <SearchInput
            type="search"
            value={query}
            placeholder="검색할 직원 이름 입력"
            aria-label="직원 이름 검색"
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchBar>

        <StaffList role="group" aria-label="직원 목록">
          {filteredStaff.map((member) => {
            const added = selectedStaffIds.includes(member.id)
            return (
              <StaffItem key={member.id}>
                <Avatar aria-hidden="true" />
                <StaffName>{member.name} 사원</StaffName>
                <ToggleButton
                  type="button"
                  aria-pressed={added}
                  aria-label={
                    added ? `${member.name} 권한 추가됨` : `${member.name} 추가`
                  }
                  onClick={() => toggleStaff(member.id)}
                >
                  <ToggleImage
                    src={added ? staffAddedIcon : staffAddIcon}
                    alt=""
                  />
                </ToggleButton>
              </StaffItem>
            )
          })}
        </StaffList>

        <Actions>
          <CancelButton type="button" disabled={pending} onClick={onCancel}>
            취소
          </CancelButton>
          <ConfirmButton
            type="button"
            disabled={pending}
            onClick={() => onConfirm(selectedStaffIds)}
          >
            {pending ? '저장 중' : '확인'}
          </ConfirmButton>
        </Actions>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

const Overlay = styled.div`
  position: fixed;
  z-index: 21;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
`

const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 600px);
  max-height: calc(100vh - 80px);
  flex-direction: column;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const ReservationCount = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const SearchBar = styled.div`
  display: flex;
  height: 60px;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding: 12px 24px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const SearchGlyph = styled.svg`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  fill: none;
  stroke: ${({ theme }) => theme.colors.textFaint};
  stroke-width: 2;
  stroke-linecap: round;
`

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }
`

const StaffList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  overflow-y: auto;
`

const StaffItem = styled.div`
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
`

const Avatar = styled.span`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.avatar};
`

const StaffName = styled.span`
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`

const ToggleButton = styled.button`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
    border-radius: 23px;
  }
`

const ToggleImage = styled.img`
  display: block;
  height: 46px;
  width: auto;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
`

const DialogButton = styled.button`
  min-width: 100px;
  height: 56px;
  padding: 0 24px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`

const CancelButton = styled(DialogButton)`
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
`

const ConfirmButton = styled(DialogButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
`
