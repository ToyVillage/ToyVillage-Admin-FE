import { useEffect, useRef, useState, type Ref } from 'react'
import styled from '@emotion/styled'
import filePdfIcon from './assets/file-pdf.svg'
import filePngIcon from './assets/file-png.svg'
import fileJpgIcon from './assets/file-jpg.svg'
import fileEtcIcon from './assets/file-etc.svg'
import downloadIcon from './assets/download.svg'

const maxFileSize = 50 * 1024 * 1024

const fileTypeIcon: Record<string, string> = {
  pdf: filePdfIcon,
  png: filePngIcon,
  jpg: fileJpgIcon,
  file: fileEtcIcon,
}

interface AttachedFile {
  id: string
  name: string
  file?: File
}

interface ResourceUploadFieldProps {
  initialFileNames?: string[]
  uploadButtonRef?: Ref<HTMLButtonElement>
  onFilesChange?: (hasFiles: boolean) => void
  onFileNamesChange?: (fileNames: string[]) => void
}

// Figma "upload file" — 점선 드롭존(드래그/클릭, 최대 50MB, 다중 파일).
// 파일이 없으면 아무것도 없다가, 올리면 드롭존 위에 "첨부자료" 칩 목록을 보여준다.
// 수정 모드에서는 initialFileNames 로 기존 첨부(파일 객체 없음)를 복원한다.
export function ResourceUploadField({
  initialFileNames = [],
  uploadButtonRef,
  onFilesChange,
  onFileNamesChange,
}: ResourceUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<AttachedFile[]>(() =>
    initialFileNames.map((name, index) => ({
      id: `existing:${index}:${name}`,
      name,
    })),
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    onFilesChange?.(files.length > 0)
    onFileNamesChange?.(files.map(({ name }) => name))
  }, [files, onFileNamesChange, onFilesChange])

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList)
    const oversizedFile = incomingFiles.find((file) => file.size > maxFileSize)
    const attachableFiles = incomingFiles.filter(
      (file) => file.size <= maxFileSize,
    )

    // 이미 업로드된 파일 + 이번 선택 배치 내 중복(같은 name·size·lastModified)을 제외한다.
    const knownIds = new Set(files.map(({ id }) => id))
    const nextFiles: AttachedFile[] = []
    let duplicateFile: File | undefined
    for (const file of attachableFiles) {
      const id = fileId(file)
      if (knownIds.has(id)) {
        duplicateFile ??= file
        continue
      }
      knownIds.add(id)
      nextFiles.push({ file, id, name: file.name })
    }

    if (oversizedFile) {
      setErrorMessage(`${oversizedFile.name}은 50MB를 초과해 업로드할 수 없습니다.`)
    } else if (duplicateFile) {
      setErrorMessage(`${duplicateFile.name}은 이미 업로드된 파일입니다.`)
    } else {
      setErrorMessage('')
    }

    if (nextFiles.length > 0) {
      setFiles((currentFiles) => [...currentFiles, ...nextFiles])
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function handleDownload(attachedFile: AttachedFile) {
    const source =
      attachedFile.file ??
      new Blob([`${attachedFile.name}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(source)
    const link = document.createElement('a')
    link.href = url
    link.download = attachedFile.name
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleRemove(id: string) {
    setFiles((currentFiles) => currentFiles.filter((file) => file.id !== id))
  }

  return (
    <Section role="group" aria-label="자료 파일">
      {files.length > 0 && (
        <AttachmentCard>
          <AttachmentTitle>첨부자료</AttachmentTitle>
          <FileList>
            {files.map((attachedFile) => {
              const kind = fileKind(attachedFile.name)

              return (
                <FileChip key={attachedFile.id}>
                  <FileTypeIcon src={fileTypeIcon[kind]} alt="" />
                  <FileName>{attachedFile.name}</FileName>
                  <IconButton
                    type="button"
                    aria-label={`${attachedFile.name} 다운로드`}
                    onClick={() => handleDownload(attachedFile)}
                  >
                    <ActionIcon src={downloadIcon} alt="" />
                  </IconButton>
                  <RemoveButton
                    type="button"
                    data-remove="true"
                    aria-label={`${attachedFile.name} 삭제`}
                    onClick={() => handleRemove(attachedFile.id)}
                  >
                    <RemoveXIcon viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.11124 15.8891C8.0175 15.7953 7.96484 15.6681 7.96484 15.5356C7.96484 15.403 8.0175 15.2758 8.11124 15.1821L11.2932 12.0001L8.11124 8.81806C8.02016 8.72376 7.96976 8.59746 7.9709 8.46636C7.97204 8.33526 8.02462 8.20985 8.11733 8.11715C8.21003 8.02445 8.33544 7.97186 8.46654 7.97072C8.59763 7.96958 8.72394 8.01998 8.81824 8.11106L12.0002 11.2931L15.1822 8.11106C15.2765 8.01998 15.4028 7.96958 15.5339 7.97072C15.665 7.97186 15.7904 8.02445 15.8831 8.11715C15.9759 8.20985 16.0284 8.33526 16.0296 8.46636C16.0307 8.59746 15.9803 8.72376 15.8892 8.81806L12.7072 12.0001L15.8892 15.1821C15.9803 15.2764 16.0307 15.4027 16.0296 15.5338C16.0284 15.6649 15.9759 15.7903 15.8831 15.883C15.7904 15.9757 15.665 16.0283 15.5339 16.0294C15.4028 16.0305 15.2765 15.9801 15.1822 15.8891L12.0002 12.7071L8.81824 15.8891C8.72447 15.9828 8.59732 16.0355 8.46474 16.0355C8.33216 16.0355 8.205 15.9828 8.11124 15.8891Z" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22ZM12 21C16.9705 21 21 16.9705 21 12C21 7.0295 16.9705 3 12 3C7.0295 3 3 7.0295 3 12C3 16.9705 7.0295 21 12 21Z"
                      />
                    </RemoveXIcon>
                  </RemoveButton>
                </FileChip>
              )
            })}
          </FileList>
        </AttachmentCard>
      )}

      <FileInput
        ref={inputRef}
        id="resource-files"
        type="file"
        aria-label="자료 파일 선택"
        tabIndex={-1}
        multiple
        onChange={handleChange}
      />
      <DropZone
        ref={uploadButtonRef}
        type="button"
        aria-label="파일 업로드"
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
        <DropZoneText>
          파일을 끌어서 놓거나 클릭하여 업로드
          <br />
          (최대 50MB)
        </DropZoneText>
      </DropZone>
      {errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
    </Section>
  )
}

function fileId(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function fileKind(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'png') return 'png'
  if (extension === 'jpg' || extension === 'jpeg') return 'jpg'
  return 'file'
}

const Section = styled.section`
  margin-top: 20px;
`

const AttachmentCard = styled.div`
  margin-bottom: 20px;
  padding: 24px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const AttachmentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const FileList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
`

const FileChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid ${({ theme }) => theme.colors.textFaint};
  background: ${({ theme }) => theme.colors.surface};

  & > [data-remove] {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
  }

  &:hover > [data-remove],
  &:focus-within > [data-remove] {
    position: static;
    width: 24px;
    height: 24px;
    overflow: visible;
    clip: auto;
    clip-path: none;
  }
`

const FileTypeIcon = styled.img`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
`

const FileName = styled.span`
  overflow: hidden;
  max-width: 230px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const IconButton = styled.button`
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

// X 아이콘은 단색이라 인라인 SVG(currentColor)로 그려 hover 시 색(→danger)을 바꾼다.
const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const RemoveXIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: currentColor;
`

const ActionIcon = styled.img`
  width: 24px;
  height: 24px;
`

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

  /* 드래그 중 자식(아이콘·텍스트) 위로 이동 시 부모 onDragLeave 가 튀어 깜빡이는 것 방지 */
  & > * {
    pointer-events: none;
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
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
`

const ErrorMessage = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 16px;
`
