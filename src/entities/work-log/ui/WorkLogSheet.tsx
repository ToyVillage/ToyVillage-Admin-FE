import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { AttachmentChip, downloadStoredFile } from '@/shared/ui'
import type {
  WorkLogSheetColumn,
  WorkLogSheetFile,
  WorkLogSheetRow,
  WorkLogSheetValue,
} from '../model/types'

interface WorkLogSheetProps {
  columns: WorkLogSheetColumn[]
  rows: WorkLogSheetRow[]
  /** 첨부를 파일 서버에서 받지 못했을 때 호출한다. 알림은 화면이 띄운다. */
  onDownloadError?: (file: WorkLogSheetFile) => void
}

// 열 최소 폭(Figma 1:5694): 질문 200px, 장문형 320px, `설정된 구역` 160px.
// 질문명이 길면 헤더가 잘리지 않도록 이 값보다 넓어진다.
const MIN_COLUMN_WIDTH = 200
const MIN_WIDE_COLUMN_WIDTH = 320
const ZONE_COLUMN_WIDTH = 160
const CELL_PADDING = 48

// 셀에서 열어 둔 전체 값 팝오버. 셀은 한 줄만 보여주므로 잘린 값을 여기서 다 읽는다.
interface OpenValue {
  key: string
  label: string
  values: string[]
  chips: boolean
  anchor: HTMLElement
}

// Figma 516:13990(worklog sheet) / 541:14171(유형별). 첫 열은 `설정된 구역`,
// 그 뒤로 양식의 질문이 한 열씩 놓이고 셀 표기는 질문 유형에 따라 달라진다.
export function WorkLogSheet({
  columns,
  rows,
  onDownloadError,
}: WorkLogSheetProps) {
  const [openValue, setOpenValue] = useState<OpenValue | null>(null)
  const { labelRef, widths } = useColumnWidths(columns)
  const close = useCallback(() => setOpenValue(null), [])

  // 같은 셀을 다시 누르면 닫는다(토글).
  const toggle = useCallback(
    (next: OpenValue) =>
      setOpenValue((current) => (current?.key === next.key ? null : next)),
    [],
  )

  const columnStyle = (index: number) => ({
    flex: `0 0 ${widths[index] ?? MIN_COLUMN_WIDTH}px`,
  })

  return (
    <Scroll data-testid="work-log-sheet">
      <Sheet>
        <HeaderRow data-testid="work-log-sheet-header">
          <ZoneHeadCell>설정된 구역</ZoneHeadCell>
          {columns.map((column, index) => (
            <HeadCell key={column.id} style={columnStyle(index)}>
              <HeadLabel ref={labelRef(index)}>{column.label}</HeadLabel>
            </HeadCell>
          ))}
        </HeaderRow>
        {rows.map((row, rowIndex) => (
          <Row key={`${row.zone}-${rowIndex}`} data-testid="work-log-sheet-row">
            <ZoneCell>{row.zone}</ZoneCell>
            {columns.map((column, index) => (
              <Cell key={column.id} style={columnStyle(index)}>
                <CellValue
                  cellKey={`${rowIndex}-${column.id}`}
                  column={column}
                  value={row.values[column.id]}
                  onToggle={toggle}
                  onDownloadError={onDownloadError}
                />
              </Cell>
            ))}
          </Row>
        ))}
      </Sheet>
      {openValue && <ValuePopover value={openValue} onClose={close} />}
    </Scroll>
  )
}

// 헤더는 절대 잘리지 않는다. 질문명 폭을 재서 열 폭을 그 이상으로 잡고,
// 본문 셀은 같은 폭을 그대로 쓴다.
function useColumnWidths(columns: WorkLogSheetColumn[]) {
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = useState<number[]>([])

  const labelRef = useCallback(
    (index: number) => (element: HTMLSpanElement | null) => {
      labels.current[index] = element
    },
    [],
  )

  useLayoutEffect(() => {
    let cancelled = false

    const measure = () => {
      if (cancelled) return

      setWidths(
        columns.map((column, index) => {
          const minimum =
            column.type === 'LONG_TEXT'
              ? MIN_WIDE_COLUMN_WIDTH
              : MIN_COLUMN_WIDTH
          const label = labels.current[index]
          const text = label
            ? Math.ceil(label.getBoundingClientRect().width)
            : 0

          return Math.max(minimum, text + CELL_PADDING)
        }),
      )
    }

    measure()
    // 웹폰트가 늦게 뜨면 글자 폭이 달라진다. 폰트가 준비된 뒤 한 번 더 잰다.
    document.fonts?.ready.then(measure).catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [columns])

  return { labelRef, widths }
}

interface CellValueProps {
  cellKey: string
  column: WorkLogSheetColumn
  value: WorkLogSheetValue | undefined
  onToggle: (value: OpenValue) => void
  onDownloadError?: (file: WorkLogSheetFile) => void
}

function CellValue({
  cellKey,
  column,
  value,
  onToggle,
  onDownloadError,
}: CellValueProps) {
  if (value == null) return null

  // 파일 답변은 첨부 칩으로 그린다(유형 아이콘 + 파일명 + 다운로드).
  if (column.type === 'FILE') {
    if (!isSheetFile(value)) return null
    const file = value

    return (
      <FileChip
        fileName={file.fileName}
        onDownload={() => {
          downloadStoredFile(file).catch((error: unknown) => {
            // 화면에는 토스트만 뜬다. 설정 누락 같은 원인은 콘솔에 남긴다.
            console.error(error)
            onDownloadError?.(file)
          })
        }}
      />
    )
  }

  const chips = column.type === 'CHECKBOX'
  const values = chips
    ? Array.isArray(value)
      ? value
      : [String(value)]
    : [Array.isArray(value) ? value.join(', ') : String(value)]
  const text = values.join(', ')

  // 셀은 한 줄만 보여준다. hover 는 브라우저 툴팁, 클릭은 전체 값 팝오버.
  return (
    <CellButton
      type="button"
      title={text}
      aria-label={`${column.label} 전체 보기`}
      onClick={(event) =>
        onToggle({
          key: cellKey,
          label: column.label,
          values,
          chips,
          anchor: event.currentTarget,
        })
      }
    >
      {chips ? (
        <ChipList items={values} />
      ) : column.type === 'LONG_TEXT' ? (
        <LongText>{text}</LongText>
      ) : (
        <Text>{text}</Text>
      )}
    </CellButton>
  )
}

function isSheetFile(value: WorkLogSheetValue): value is WorkLogSheetFile {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const CHIP_GAP = 8
// `+N` 배지 자리. 배지가 들어갈 폭을 미리 빼 두지 않으면 배지가 다시 넘친다.
const CHIP_COUNTER_WIDTH = 52

// chip 은 반쯤 잘리면 읽을 수 없다. 들어가는 개수만 두고 나머지는 `+N` 으로 접는다.
function ChipList({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const widthsRef = useRef<number[]>([])
  const [visible, setVisible] = useState(items.length)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    // 접기 전 첫 렌더에서 각 chip 의 폭을 한 번만 잰다. 접은 뒤에 다시 재면
    // 숨긴 chip 의 폭이 0 이라 계산이 무너진다.
    if (widthsRef.current.length !== items.length) {
      widthsRef.current = [
        ...container.querySelectorAll<HTMLElement>('[data-chip]'),
      ].map((chip) => chip.offsetWidth)
    }

    const fit = () => {
      const widths = widthsRef.current
      const available = container.clientWidth
      let used = 0
      let count = 0

      for (const [index, width] of widths.entries()) {
        const next = used + width + (index === 0 ? 0 : CHIP_GAP)
        const isLast = index === widths.length - 1
        const limit = isLast ? available : available - CHIP_COUNTER_WIDTH
        if (next > limit) break
        used = next
        count += 1
      }

      // 아무것도 안 들어가도 첫 chip 은 남겨 무엇이 선택됐는지는 보이게 한다.
      setVisible(Math.max(1, count))
    }

    fit()

    const observer = new ResizeObserver(fit)
    observer.observe(container)
    return () => observer.disconnect()
  }, [items])

  const hidden = items.length - visible

  return (
    <Chips ref={ref}>
      {items.map((item, index) => (
        <Chip key={`${item}-${index}`} data-chip $hidden={index >= visible}>
          {item}
        </Chip>
      ))}
      {hidden > 0 && <ChipCounter data-chip-counter>+{hidden}</ChipCounter>}
    </Chips>
  )
}

interface PopoverPosition {
  left: number
  top?: number
  bottom?: number
}

// 화면 가장자리 여백과 셀-팝오버 간격.
const POPOVER_MARGIN = 16
const POPOVER_OFFSET = 8

// 팝오버 크기는 내용이 정한다. 위치만 실제 크기를 재서 화면 밖으로 나가지 않게 맞춘다.
function popoverPosition(
  anchor: HTMLElement,
  popover: HTMLElement,
): PopoverPosition {
  const rect = anchor.getBoundingClientRect()
  const { width, height } = popover.getBoundingClientRect()

  const left = Math.min(
    Math.max(rect.left, POPOVER_MARGIN),
    Math.max(window.innerWidth - width - POPOVER_MARGIN, POPOVER_MARGIN),
  )
  // 아래 공간이 모자라면 셀 위쪽으로 띄운다.
  const below = window.innerHeight - rect.bottom
  const placeAbove = below < height + POPOVER_OFFSET && rect.top > below

  return placeAbove
    ? { left, bottom: window.innerHeight - rect.top + POPOVER_OFFSET }
    : { left, top: rect.bottom + POPOVER_OFFSET }
}

function ValuePopover({
  value,
  onClose,
}: {
  value: OpenValue
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // 크기를 재려면 먼저 그려야 한다. 첫 프레임에는 화면 밖에 두고 곧바로 자리를 잡는다.
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  useLayoutEffect(() => {
    // 스크롤·리사이즈로 기준 셀이 움직이면 닫지 않고 따라간다.
    const follow = () => {
      if (!ref.current) return
      setPosition(popoverPosition(value.anchor, ref.current))
    }
    follow()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target)) return
      // 같은 셀을 다시 누른 경우는 셀의 onClick 이 토글로 닫는다.
      if (value.anchor.contains(target)) return
      onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', follow, true)
    window.addEventListener('resize', follow)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', follow, true)
      window.removeEventListener('resize', follow)
    }
  }, [value, onClose])

  return createPortal(
    <Popover
      ref={ref}
      role="dialog"
      aria-label={`${value.label} 전체 값`}
      data-testid="work-log-sheet-popover"
      style={position ?? { left: 0, top: 0, visibility: 'hidden' }}
    >
      <PopoverLabel>{value.label}</PopoverLabel>
      {value.chips ? (
        <PopoverChips>
          {value.values.map((item, index) => (
            <Chip key={`${item}-${index}`} $hidden={false}>
              {item}
            </Chip>
          ))}
        </PopoverChips>
      ) : (
        <PopoverText>{value.values.join(', ')}</PopoverText>
      )}
    </Popover>,
    document.body,
  )
}

// 셀 안의 값이 옆 칸을 침범하지 않게 한다(flex 자식 기본 min-width: auto 차단).
const cellClip = `
  min-width: 0;
  overflow: hidden;
`

// 가로 스크롤 컨테이너가 시트 테두리도 맡는다. Sheet 에 overflow: hidden 을 주면
// `설정된 구역` 열의 sticky 가 이 컨테이너 대신 Sheet 기준이 돼 동작하지 않는다.
const Scroll = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  overflow-x: auto;
`

const Sheet = styled.div`
  width: max-content;
  min-width: 100%;
`

// 구분선은 셀이 아니라 행이 그린다. 열 폭 합이 시트보다 좁아도 선이 끝까지 이어진다.
const HeaderRow = styled.div`
  display: flex;
  min-height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  background: ${({ theme }) => theme.colors.background};
`

const Row = styled.div`
  display: flex;
  min-height: 64px;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

const cellFrame = `
  display: flex;
  align-items: center;
  padding: 0 24px;
`

const ZoneHeadCell = styled.div`
  ${cellFrame}
  ${cellClip}
  flex: 0 0 ${ZONE_COLUMN_WIDTH}px;
  position: sticky;
  left: 0;
  z-index: 1;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 600;
`

// 헤더는 절대 두 줄이 되지 않는다. 열 폭을 질문명 폭 이상으로 잡으므로 잘리지도 않는다.
const HeadCell = styled.div`
  ${cellFrame}
  ${cellClip}
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 20px;
  font-weight: 500;
`

const HeadLabel = styled.span`
  white-space: nowrap;
`

const ZoneCell = styled.div`
  ${cellFrame}
  ${cellClip}
  flex: 0 0 ${ZONE_COLUMN_WIDTH}px;
  position: sticky;
  left: 0;
  z-index: 1;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`

const Cell = styled.div`
  ${cellFrame}
  ${cellClip}
  border-right: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};

  &:last-of-type {
    border-right: 0;
  }
`

// 셀 전체가 클릭 영역이다. 배경·테두리 없이 셀 안을 그대로 채운다.
const CellButton = styled.button`
  ${cellClip}
  display: flex;
  width: 100%;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: -2px;
  }
`

const FileChip = styled(AttachmentChip)`
  flex: 0 1 auto;
  min-width: 0;
`

// 값은 유형과 무관하게 한 줄로 말줄임한다. 단답형도 열 폭보다 길 수 있어서,
// 줄바꿈을 허용하면 행 높이가 답변 길이만큼 늘어난다.
const ellipsisLine = `
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Text = styled.span`
  ${ellipsisLine}
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 22px;
  font-weight: 500;
`

// 장문형은 열 폭을 넘으면 한 줄로 말줄임한다(spec). 행 높이는 늘지 않는다.
const LongText = styled.span`
  ${ellipsisLine}
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 20px;
  font-weight: 500;
`

const Chips = styled.div`
  ${cellClip}
  display: flex;
  align-items: center;
  gap: ${CHIP_GAP}px;
`

const Chip = styled.span<{ $hidden: boolean }>`
  display: ${({ $hidden }) => ($hidden ? 'none' : 'inline-flex')};
  flex: 0 0 auto;
  align-items: center;
  padding: 3px 12px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const ChipCounter = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

// 셀은 한 줄만 보여주므로 전체 값은 이 팝오버에서 읽는다. 셀의 overflow: hidden 에
// 잘리지 않도록 body 로 portal 해 fixed 로 띄운다.
// 크기는 내용이 정한다. 화면을 넘지 않도록 최대치만 걸어 둔다.
const Popover = styled.div`
  position: fixed;
  z-index: 20;
  display: flex;
  width: max-content;
  max-width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
`

const PopoverLabel = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const PopoverText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textBody};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`

const PopoverChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`
