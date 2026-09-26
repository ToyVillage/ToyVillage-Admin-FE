import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { fetchStoredFile } from '../api/fileStorage'
import chevronIcon from './assets/chevron-left-rounded.svg'
import closeIcon from './assets/close-line.svg'
import downloadIcon from './assets/download-large.svg'
import {
  downloadFile,
  downloadStoredFile,
  previewKind,
  type StoredFile,
} from './fileAttachment'
import { fadeIn, motionDuration, motionEasing, popIn } from './motion'

interface AttachmentPreviewDialogProps {
  file: StoredFile
  onClose: () => void
  /** 모달의 다운로드가 파일 서버에서 받지 못했을 때 호출한다. 알림은 화면이 띄운다. */
  onDownloadError: (file: StoredFile) => void
}

interface PreviewSource {
  blob: Blob
  pdf: PDFDocumentProxy | null
}

// Figma `첨부 미리보기 모달` — 이미지(yot 2435:24604) · PDF(2435:24629).
// 원본은 다운로드와 같은 파일 서버에서 받는다. PDF 는 pdf.js 로 한 쪽씩 그린다.
export function AttachmentPreviewDialog({
  file,
  onClose,
  onDownloadError,
}: AttachmentPreviewDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [page, setPage] = useState(1)
  const kind = previewKind(file.fileName)
  const { data, isPending, isError } = useQuery({
    queryKey: ['attachment-preview', file.fileKey, kind],
    // 받는 도중 모달을 닫으면 signal 이 끊겨 요청과 PDF 해석을 멈춘다.
    queryFn: ({ signal }) =>
      loadPreviewSource(file.fileKey, kind === 'pdf', signal),
    // 모달을 닫으면 원본(최대 50MB)을 캐시에 남기지 않는다.
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  })

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

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [])

  const pageCount = data?.pdf?.numPages ?? 0

  function handleDownload() {
    // 이미 받은 원본이 있으면 다시 받지 않는다.
    if (data) {
      downloadFile(file.fileName, data.blob)
      return
    }

    downloadStoredFile(file).catch((error: unknown) => {
      console.error(error)
      onDownloadError(file)
    })
  }

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
          <Title id={titleId}>{file.fileName}</Title>
          <IconButton type="button" aria-label="다운로드" onClick={handleDownload}>
            <img src={downloadIcon} alt="" aria-hidden="true" />
          </IconButton>
          <IconButton
            ref={closeRef}
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <img src={closeIcon} alt="" aria-hidden="true" />
          </IconButton>
        </Header>

        <Viewer>
          {isPending || isError || !data ? (
            // 같은 라이브 영역의 문구만 바꿔야 스크린 리더가 실패로 바뀐 것을 읽는다.
            <StatusText role="status">
              {isPending
                ? '미리보기를 불러오는 중입니다.'
                : '미리보기를 불러오지 못했습니다.'}
            </StatusText>
          ) : data.pdf ? (
            <PdfPage pdf={data.pdf} page={page} />
          ) : (
            <ImagePreview blob={data.blob} alt={file.fileName} />
          )}
        </Viewer>

        {kind === 'pdf' && pageCount > 0 && (
          <PageNav>
            <IconButton
              type="button"
              aria-label="이전 페이지"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <img src={chevronIcon} alt="" aria-hidden="true" />
            </IconButton>
            <PageText aria-live="polite">
              {page} / {pageCount}
            </PageText>
            <IconButton
              type="button"
              aria-label="다음 페이지"
              data-direction="next"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              <img src={chevronIcon} alt="" aria-hidden="true" />
            </IconButton>
          </PageNav>
        )}
      </Dialog>
    </Overlay>,
    document.body,
  )
}

// Blob URL 은 이 요소가 있는 동안만 둔다. 렌더 중에 만들면 StrictMode 재실행에서 해제된 주소가 남는다.
function ImagePreview({ blob, alt }: { blob: Blob; alt: string }) {
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const image = imageRef.current
    if (!image) return

    const url = URL.createObjectURL(blob)
    image.src = url
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return <PreviewImage ref={imageRef} alt={alt} />
}

// 뷰어 높이(600)에 맞춰 한 쪽을 그린다. 쪽을 넘기면 진행 중인 렌더를 취소한다.
function PdfPage({ pdf, page }: { pdf: PDFDocumentProxy; page: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 실패한 쪽 번호. 다른 쪽으로 넘기면 그 쪽은 다시 그려 본다.
  const [failedPage, setFailedPage] = useState<number | null>(null)

  useEffect(() => {
    const pending = pendingPdfDestroys.get(pdf)
    if (pending !== undefined) {
      window.clearTimeout(pending)
      pendingPdfDestroys.delete(pdf)
    }

    return () => {
      // StrictMode 는 곧바로 다시 붙이므로 한 틱 미뤘다가 정말 떠났을 때만 워커 자원을 푼다.
      const timer = window.setTimeout(() => {
        pendingPdfDestroys.delete(pdf)
        void pdf.loadingTask.destroy()
      })
      pendingPdfDestroys.set(pdf, timer)
    }
  }, [pdf])

  useEffect(() => {
    let cancelled = false
    let renderTask: RenderTask | null = null

    pdf
      .getPage(page)
      .then((pdfPage) => {
        const canvas = canvasRef.current
        if (cancelled || !canvas) return

        const scale = pdfPageHeight / pdfPage.getViewport({ scale: 1 }).height
        const viewport = pdfPage.getViewport({
          scale: scale * window.devicePixelRatio,
        })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        renderTask = pdfPage.render({ canvas, viewport })
        return renderTask.promise
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error(error)
        setFailedPage(page)
      })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, page])

  if (failedPage === page) {
    return <StatusText role="status">미리보기를 불러오지 못했습니다.</StatusText>
  }

  return <PdfCanvas ref={canvasRef} aria-label={`${page}쪽`} role="img" />
}

const pdfPageHeight = 600
const pendingPdfDestroys = new Map<PDFDocumentProxy, number>()

async function loadPreviewSource(
  fileKey: string,
  isPdf: boolean,
  signal: AbortSignal,
): Promise<PreviewSource> {
  const blob = await fetchStoredFile(fileKey, signal)
  if (!isPdf) return { blob, pdf: null }

  // pdf.js 는 크므로 PDF 미리보기를 열 때만 불러온다.
  const pdfjs = await import('pdfjs-dist')
  signal.throwIfAborted()
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
  })
  // 해석 중에 닫히면 PdfPage 가 붙지 않아 정리할 곳이 없으므로 여기서 워커 자원을 푼다.
  const destroy = () => void loadingTask.destroy()
  signal.addEventListener('abort', destroy, { once: true })

  try {
    const pdf = await loadingTask.promise
    signal.throwIfAborted()
    return { blob, pdf }
  } finally {
    // 넘겨준 뒤의 정리는 PdfPage 가 맡는다.
    signal.removeEventListener('abort', destroy)
  }
}

function trapTab(dialog: HTMLElement | null, event: KeyboardEvent) {
  if (!dialog) return

  const focusables = [
    ...dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
  ]
  if (focusables.length === 0) return

  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
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

const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 1200px);
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
  animation: ${popIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Header = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
`

const Title = styled.h2`
  overflow: hidden;
  min-width: 0;
  flex: 1 1 auto;
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 500;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const IconButton = styled.button`
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

  &[data-direction='next'] img {
    transform: rotate(180deg);
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const Viewer = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
  height: min(640px, calc(100vh - 260px));
  min-height: 240px;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
`

const PreviewImage = styled.img`
  display: block;
  max-width: min(100%, 1080px);
  max-height: 100%;
  border-radius: 8px;
  object-fit: contain;
`

const PdfCanvas = styled.canvas`
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  background: ${({ theme }) => theme.colors.surface};
`

const StatusText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
`

const PageNav = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const PageText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: normal;
`
