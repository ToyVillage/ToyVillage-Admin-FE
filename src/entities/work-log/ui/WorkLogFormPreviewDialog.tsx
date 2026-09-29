import { useEffect, useEffectEvent, useId, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import {
  fadeIn,
  motionDuration,
  motionEasing,
  popIn,
  trapTab,
} from '@/shared/ui'
import closeIcon from '@/shared/ui/assets/close-line.svg'
import type {
  WorkLogFormDetail,
  WorkLogFormEditorType,
  WorkLogQuestionType,
  WorkLogSheetColumn,
  WorkLogSheetRow,
} from '../model/types'
import { WorkLogSheet } from './WorkLogSheet'

interface WorkLogFormPreviewDialogProps {
  form: WorkLogFormDetail
  onClose: () => void
}

// 양식 유형 → 시트 열 유형. 주관식은 작성된 일지에서 장문형 열(넓은 폭)로 그려진다.
const sheetTypeByFormType: Record<WorkLogFormEditorType, WorkLogQuestionType> =
  {
    TEXT: 'LONG_TEXT',
    CHOICE: 'CHOICE',
    CHECKBOX: 'CHECKBOX',
    FILE: 'FILE',
  }

// Figma `양식 미리보기 모달`(2433:24720). 양식으로 작성될 일지 시트를 답변 없이 보여준다.
// 행은 설정된 구역, 열은 질문이다. 표는 작성된 일지 상세의 시트와 같은 규격이다.
export function WorkLogFormPreviewDialog({
  form,
  onClose,
}: WorkLogFormPreviewDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const columns = useMemo<WorkLogSheetColumn[]>(
    () =>
      form.questions.map((question) => ({
        id: question.id,
        label: question.label,
        type: sheetTypeByFormType[question.type],
      })),
    [form.questions],
  )
  const rows = useMemo<WorkLogSheetRow[]>(
    () => form.zones.map((zone) => ({ zone, values: {} })),
    [form.zones],
  )

  // 부모가 다시 그려져도 초점·inert 설정을 다시 하지 않도록 닫기는 이벤트로 감싼다.
  const requestClose = useEffectEvent(() => onClose())

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }

      if (event.key === 'Tab') trapTab(dialogRef.current, event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')

      // 닫으면 모달을 연 `표로 미리보기` 버튼으로 초점을 돌려준다.
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [])

  return createPortal(
    <Overlay
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        // 기본 동작(배경에 초점 주기)이 되돌려 준 초점을 다시 빼앗지 않게 막는다.
        event.preventDefault()
        onClose()
      }}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <Header>
          <Title id={titleId}>양식 미리보기</Title>
          <CloseButton
            ref={closeRef}
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <img src={closeIcon} alt="" aria-hidden="true" />
          </CloseButton>
        </Header>
        <WorkLogSheet columns={columns} rows={rows} />
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
  animation: ${fadeIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

// Figma 1400 = 표 1320 + 좌우 패딩 40. 좁은 화면에서는 줄고 표가 가로로 스크롤된다.
const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 1400px);
  /* 구역이 많아도 닫기 버튼이 화면 밖으로 밀리지 않게 높이를 막고 안에서 스크롤한다. */
  max-height: calc(100dvh - 16px * 2);
  overflow-y: auto;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
  animation: ${popIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: normal;
`

const CloseButton = styled.button`
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`
