import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface TruncatedTextProps {
  value: string
  /** 색·크기는 쓰는 쪽이 `styled(TruncatedText)` 로 정한다. */
  className?: string
}

/**
 * 열 폭보다 긴 값을 한 줄로 말줄임하고, hover 하면 전체 값을 말풍선으로 띄운다.
 *
 * 표 셀은 `overflow: hidden` 이라 말풍선이 잘린다. body 로 portal 해서 화면
 * 좌표로 띄우고, 실제로 잘린 값일 때만 연다.
 */
export function TruncatedText({ value, className }: TruncatedTextProps) {
  const tooltipId = useId()
  const textRef = useRef<HTMLSpanElement>(null)
  const [origin, setOrigin] = useState<{ top: number; left: number } | null>(
    null,
  )

  function open() {
    const element = textRef.current
    // 잘리지 않은 값은 말풍선을 띄우지 않는다.
    if (!element || element.scrollWidth <= element.clientWidth) return

    const rect = element.getBoundingClientRect()
    setOrigin({ top: rect.bottom + 8, left: rect.left })
  }

  return (
    <>
      <Text
        ref={textRef}
        className={className}
        aria-describedby={origin ? tooltipId : undefined}
        onMouseEnter={open}
        onMouseLeave={() => setOrigin(null)}
      >
        {value}
      </Text>
      {origin &&
        createPortal(
          <Bubble id={tooltipId} role="tooltip" style={origin}>
            {value}
          </Bubble>,
          document.body,
        )}
    </>
  )
}

const Text = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

// 표 위로 떠야 하므로 화면 좌표로 고정한다.
const Bubble = styled.span`
  position: fixed;
  z-index: 40;
  max-width: min(520px, calc(100vw - 32px));
  padding: 10px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  overflow-wrap: anywhere;
  pointer-events: none;
`
