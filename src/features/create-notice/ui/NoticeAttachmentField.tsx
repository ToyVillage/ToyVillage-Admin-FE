import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { RemoveIconButton } from './RemoveIconButton'

const maxFileSize = 50 * 1024 * 1024

interface AttachedFile {
  id: string
  name: string
  file?: File
}

interface NoticeAttachmentFieldProps {
  initialFileNames?: string[]
  onFilesChange?: (hasFiles: boolean) => void
  onFileNamesChange?: (fileNames: string[]) => void
  onFileObjectsChange?: (files: File[]) => void
}

export function NoticeAttachmentField({
  initialFileNames = [],
  onFilesChange,
  onFileNamesChange,
  onFileObjectsChange,
}: NoticeAttachmentFieldProps) {
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
    onFileObjectsChange?.(files.flatMap(({ file }) => (file ? [file] : [])))
  }, [files, onFileNamesChange, onFileObjectsChange, onFilesChange])

  function addFiles(fileList: FileList | File[]) {
    const incomingFiles = Array.from(fileList)
    const oversizedFile = incomingFiles.find((file) => file.size > maxFileSize)
    const attachableFiles = incomingFiles.filter(
      (file) => file.size <= maxFileSize,
    )

    // 이미 첨부된 파일 + 이번 선택 배치 내 중복(같은 name·size·lastModified)을 제외한다.
    // 이름만 같고 내용이 다른 파일은 서로 다른 파일로 취급해 함께 첨부한다.
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
      setErrorMessage(
        `${oversizedFile.name}은 50MB를 초과해 첨부할 수 없습니다.`,
      )
    } else if (duplicateFile) {
      setErrorMessage(`${duplicateFile.name}은 이미 첨부된 파일입니다.`)
    } else {
      setErrorMessage('')
    }

    if (nextFiles.length > 0) {
      setFiles((currentFiles) => [...currentFiles, ...nextFiles])
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    <AttachmentSection role="group" aria-label="첨부파일">
      <AttachmentCard data-testid="notice-attachment-card">
        {files.length > 0 && (
          <>
            <AttachmentTitle>첨부자료</AttachmentTitle>
            <FileList>
              {files.map((attachedFile) => {
                const kind = fileKind(attachedFile.name)

                return (
                  <FileChip key={attachedFile.id}>
                    <FileBadge data-kind={kind}>{kind.toUpperCase()}</FileBadge>
                    <FileName>{attachedFile.name}</FileName>
                    <IconButton
                      type="button"
                      aria-label={`${attachedFile.name} 다운로드`}
                      onClick={() => handleDownload(attachedFile)}
                    >
                      <DownloadIcon viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
                      </DownloadIcon>
                    </IconButton>
                    <RemoveIconButton
                      type="button"
                      data-hover-reveal="true"
                      aria-label={`${attachedFile.name} 삭제`}
                      onClick={() => handleRemove(attachedFile.id)}
                    />
                  </FileChip>
                )
              })}
            </FileList>
          </>
        )}
      </AttachmentCard>

      <FileInput
        ref={inputRef}
        id="notice-attachments"
        type="file"
        aria-label="첨부파일 선택"
        tabIndex={-1}
        multiple
        onChange={handleFileChange}
      />
      <DropZone
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
    </AttachmentSection>
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

const AttachmentSection = styled.section`
  margin-top: 32px;
`

const AttachmentCard = styled.div`
  min-height: 140px;
  padding: 24px 40px 16px;
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
  margin-top: 8px;
`

const FileChip = styled.div`
  position: relative;
  display: inline-flex;
  height: 60px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};

  &:hover > [data-hover-reveal='true'],
  &:focus-within > [data-hover-reveal='true'] {
    position: static;
    width: 20px;
    height: 20px;
    overflow: visible;
    clip: auto;
    clip-path: none;
    pointer-events: auto;
    opacity: 1;
  }
`

const FileBadge = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.textGuide};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 8px;
  font-weight: 700;
  line-height: 1;

  &[data-kind='pdf'] {
    background: ${({ theme }) => theme.colors.primary};
  }

  &[data-kind='png'] {
    background: ${({ theme }) => theme.colors.filePng};
  }

  &[data-kind='jpg'] {
    background: ${({ theme }) => theme.colors.fileJpg};
  }
`

const FileName = styled.span`
  overflow: hidden;
  max-width: 230px;
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
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const DownloadIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
  margin-top: 32px;
  border: 2px dashed ${({ theme }) => theme.colors.textGuide};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.tableHeader};
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font: inherit;

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
`

const ErrorMessage = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 16px;
  text-align: center;
`
