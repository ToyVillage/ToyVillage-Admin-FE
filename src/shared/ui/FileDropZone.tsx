import { useId, useRef, useState, type Ref } from 'react'
import styled from '@emotion/styled'

interface FileDropZoneProps {
  /** 드롭존 버튼의 접근 가능한 이름(예: `파일 업로드`, `사진 업로드`). */
  ariaLabel: string
  /** 숨긴 file input 의 접근 가능한 이름(예: `첨부파일 선택`). */
  inputLabel: string
  inputId?: string
  accept?: string
  multiple?: boolean
  /** 클릭 선택·드롭으로 고른 파일. 검증(용량·형식·개수)은 호출부가 한다. */
  onFiles: (files: File[]) => void
  buttonRef?: Ref<HTMLButtonElement>
  /** 드롭존 버튼의 `aria-describedby`. */
  describedBy?: string
  /** `default` = gray/5 배경(공지·자료), `strong` = gray/10(#DDDDE3) 배경(업무·개체관리 폼). */
  appearance?: 'default' | 'strong'
  /** 안내 문구 크기. 개체관리 Figma 는 18px 이다. */
  textSize?: 16 | 18
  maxSizeLabel?: string
  className?: string
}

// Figma 공용 `upload file`(1:10511). 클릭·드래그 앤 드롭·키보드(버튼)로 파일을 고른다.
// 점선 테두리는 업무 폼 구현(`colors.textGuide`)을 따른다.
export function FileDropZone({
  ariaLabel,
  inputLabel,
  inputId,
  accept,
  multiple = false,
  onFiles,
  buttonRef,
  describedBy,
  appearance = 'default',
  textSize = 16,
  maxSizeLabel = '50MB',
  className,
}: FileDropZoneProps) {
  const fallbackInputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) onFiles(Array.from(event.target.files))
    event.target.value = ''
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    onFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <>
      <FileInput
        ref={inputRef}
        id={inputId ?? fallbackInputId}
        type="file"
        aria-label={inputLabel}
        tabIndex={-1}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      <DropZone
        ref={buttonRef}
        className={className}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        data-appearance={appearance}
        data-dragging={isDragging}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <UploadIcon viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 34H12a8 8 0 0 1-1.2-15.9A13 13 0 0 1 36 21a6.5 6.5 0 0 1-.5 13H33" />
          <path d="m18 26 6-6 6 6M24 20v18" />
        </UploadIcon>
        <DropZoneText data-size={textSize}>
          파일을 끌어서 놓거나 클릭하여 업로드
          <br />
          (최대 {maxSizeLabel})
        </DropZoneText>
      </DropZone>
    </>
  )
}

const FileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`

const DropZone = styled.button`
  display: flex;
  width: 100%;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 2px dashed ${({ theme }) => theme.colors.textGuide};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.tableHeader};
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font: inherit;

  &[data-appearance='strong'] {
    background: ${({ theme }) => theme.colors.tableHeaderStrong};
  }

  &[data-dragging='true'] {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryBg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }

  @media (max-width: 980px) {
    min-height: 180px;
  }
`

const UploadIcon = styled.svg`
  width: 48px;
  height: 48px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
`

const DropZoneText = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;

  &[data-size='18'] {
    font-size: 18px;
  }
`
