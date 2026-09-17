import { useEffect, useId, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { AttachmentChip, downloadStoredFile } from '@/shared/ui'
import type { ObservationAttachment } from '../model/types'

interface ObservationAttachmentCellProps {
  attachments: ObservationAttachment[]
  observationTitle: string
  /** 첨부 팝오버 열림. 한 번에 하나만 열리도록 목록(페이지)이 소유한다. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 파일 서버에서 받지 못했다. 알림은 페이지가 띄운다. */
  onDownloadError: () => void
}

type PopoverPlacement = 'below' | 'above'
type PopoverAlign = 'start' | 'end'

// 팝오버 높이 추정(Figma 970:26527): 칩 56 · 칩 간격 8 · padding 16 · 테두리 1 · 트리거와 간격 8.
function estimatePopoverHeight(count: number) {
  return count * 56 + (count - 1) * 8 + 16 * 2 + 2 + 8
}

// 팝오버 너비 추정: 칩 최대 316(padding 12×2 · 아이콘 20 · 파일명 최대 230 · 다운로드 24 · 간격 8×2 · 테두리 2)
// + padding 16×2 + 테두리 2.
const estimatedPopoverWidth = 316 + 16 * 2 + 2

// Figma 관찰 표 첨부 칸(127:9192) — 첫 파일 칩 + `외 N개`(970:26381), 없으면 `—`(127:9223).
// `외 N개` 에 hover·focus 하면 첨부 전체 팝오버(970:26527)가 그 아래에 열린다.
export function ObservationAttachmentCell({
  attachments,
  observationTitle,
  open,
  onOpenChange,
  onDownloadError,
}: ObservationAttachmentCellProps) {
  const popoverId = useId()
  const moreRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Escape 로 닫으며 트리거에 초점을 되돌릴 때, 그 focus 로 다시 열리지 않게 한다.
  const skipFocusOpenRef = useRef(false)
  const [placement, setPlacement] = useState<PopoverPlacement>('below')
  const [align, setAlign] = useState<PopoverAlign>('start')

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (document.activeElement !== triggerRef.current) {
        skipFocusOpenRef.current = true
        triggerRef.current?.focus()
      }
      onOpenChange(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open, onOpenChange])

  const [firstAttachment] = attachments
  if (!firstAttachment) return <EmptyMark>—</EmptyMark>

  const restCount = attachments.length - 1

  // 화면 밖으로 나가지 않게 뒤집는다 — 아래가 모자라면 트리거 위로,
  // 오른쪽이 모자라면 트리거 오른쪽 끝에 맞춘다.
  function openPopover() {
    if (open) return
    const rect = moreRef.current?.getBoundingClientRect()
    const height = estimatePopoverHeight(attachments.length)
    setPlacement(
      rect && rect.bottom + height > window.innerHeight && rect.top >= height
        ? 'above'
        : 'below',
    )
    setAlign(
      rect &&
        rect.left + estimatedPopoverWidth >
          document.documentElement.clientWidth &&
        rect.right >= estimatedPopoverWidth
        ? 'end'
        : 'start',
    )
    onOpenChange(true)
  }

  function handleFocus() {
    if (skipFocusOpenRef.current) {
      skipFocusOpenRef.current = false
      return
    }
    openPopover()
  }

  function handleMouseLeave() {
    // 초점이 `외 N개`·팝오버 안에 있으면 포인터가 나가도 닫지 않는다 — 키보드로 연 팝오버가
    // 지나가는 마우스에 닫히지 않게 한다(닫기는 blur·Escape 가 맡는다).
    if (moreRef.current?.contains(document.activeElement)) return
    onOpenChange(false)
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (moreRef.current?.contains(event.relatedTarget as Node | null)) return
    onOpenChange(false)
  }

  return (
    <Cell>
      <FirstChip
        fileName={firstAttachment.fileName}
        onDownload={() =>
          downloadStoredFile(firstAttachment).catch(onDownloadError)
        }
      />
      {restCount > 0 && (
        <More
          ref={moreRef}
          onMouseEnter={openPopover}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <MoreButton
            ref={triggerRef}
            type="button"
            aria-label={`${observationTitle} 첨부 ${attachments.length}개 모두 보기`}
            aria-expanded={open}
            aria-controls={open ? popoverId : undefined}
            onClick={openPopover}
          >
            외 {restCount}개
          </MoreButton>
          {open && (
            <PopoverLayer data-placement={placement} data-align={align}>
              <Popover
                id={popoverId}
                role="group"
                aria-label={`${observationTitle} 첨부`}
              >
                {attachments.map((attachment) => (
                  <AttachmentChip
                    key={attachment.fileKey}
                    fileName={attachment.fileName}
                    onDownload={() =>
                      downloadStoredFile(attachment).catch(onDownloadError)
                    }
                  />
                ))}
              </Popover>
            </PopoverLayer>
          )}
        </More>
      )}
    </Cell>
  )
}

const Cell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`

// 칸이 좁으면 파일명이 먼저 말줄임되고 `외 N개` 는 줄지 않는다.
const FirstChip = styled(AttachmentChip)`
  flex: 0 1 auto;
`

const EmptyMark = styled.span`
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const More = styled.div`
  position: relative;
  display: flex;
  flex: 0 0 auto;
`

const MoreButton = styled.button`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

// 트리거와 팝오버 사이 8px 은 margin 이 아니라 이 레이어의 padding 이다 —
// 포인터가 그 틈을 지나도 mouseleave 로 닫히지 않는다.
const PopoverLayer = styled.div`
  position: absolute;
  z-index: 3;
  top: 100%;
  left: 0;
  padding-top: 8px;

  &[data-placement='above'] {
    top: auto;
    bottom: 100%;
    padding-top: 0;
    padding-bottom: 8px;
  }

  &[data-align='end'] {
    right: 0;
    left: auto;
  }
`

const Popover = styled.div`
  display: flex;
  width: max-content;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.12);
`
