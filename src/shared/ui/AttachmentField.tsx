import { useLayoutEffect, useState } from 'react'
import styled from '@emotion/styled'
import { AttachmentChip } from './AttachmentChip'
import { FileDropZone } from './FileDropZone'
import { RemoveIconButton } from './RemoveIconButton'
import { downloadFile, downloadStoredFile } from './fileAttachment'

const maxFileSize = 50 * 1024 * 1024

const downloadErrorMessage = '파일 다운로드에 실패했습니다. 다시 시도해 주세요.'

interface AttachedFile {
  id: string
  name: string
  file?: File
  /** 기존 첨부의 저장소 키. 수정 시 그대로 재전송한다. */
  fileKey?: string
}

export interface AttachmentItem {
  name: string
  file?: File
  fileKey?: string
}

export interface AttachmentAddResult {
  added: number
  rejected: number
}

interface AttachmentFieldProps {
  /**
   * `task` 는 업무 폼의 `add file` 카드(yot 145:12267)다 — 첨부가 없어도 `첨부자료` 라벨이
   * 보이고, 라벨이 20px 이며 드롭존 배경이 gray/10 이다. 공지·자료 화면은 `default` 다.
   * `observation` 은 관찰 수정의 `첨부` 카드(yot 1284:15032)다 — 라벨 `첨부` 32px,
   * 카드 padding 28/32, 칩은 `AttachmentChip`, 카드↔드롭존 16px, 안내 18px 이다.
   * `notice` 는 공지 수정(yot 1:6711)이다 — 첨부가 없으면 카드 없이 드롭존만 20px 아래에 두고,
   * 드롭존은 gray/20 배경·gray/80 점선, 안내 18px 이다.
   * `notice-create` 는 공지 생성(yot 1:6919)이다 — 빈 카드에도 `첨부자료`(22px gray/100)를 보이고,
   * 카드↔드롭존 32px, 드롭존은 `notice` 와 같다.
   */
  variant?: 'default' | 'task' | 'observation' | 'notice' | 'notice-create'
  initialFileNames?: string[]
  /**
   * 이름과 저장소 키를 함께 가진 기존 첨부. 수정 화면에서 쓴다.
   * `initialFileNames` 와 함께 쓰지 않는다.
   */
  initialFiles?: { fileName: string; fileKey: string }[]
  onFilesChange?: (hasFiles: boolean) => void
  onFileNamesChange?: (fileNames: string[]) => void
  onFileObjectsChange?: (files: File[]) => void
  /** 현재 첨부 목록을 순서대로 알린다. 업로드는 호출부가 한다. */
  onFileItemsChange?: (items: AttachmentItem[]) => void
  /** 첨부 시도 결과. 토스트가 필요한 화면만 사용한다. */
  onAddResult?: (result: AttachmentAddResult) => void
  /**
   * 기존 첨부(`initialFiles`)의 `fileKey` 가 파일 서버에 있는 키면 true 다. 다운로드가
   * 원본을 받아 온다. 관찰 화면은 아직 mock 키라 false 로 두고, API 연동 후 켠다.
   */
  storedFiles?: boolean
}

export function AttachmentField({
  variant = 'default',
  initialFileNames = [],
  initialFiles,
  onFilesChange,
  onFileNamesChange,
  onFileObjectsChange,
  onFileItemsChange,
  onAddResult,
  storedFiles = false,
}: AttachmentFieldProps) {
  const [files, setFiles] = useState<AttachedFile[]>(() =>
    initialFiles
      ? initialFiles.map(({ fileName, fileKey }, index) => ({
          id: `existing:${index}:${fileName}`,
          name: fileName,
          fileKey,
        }))
      : initialFileNames.map((name, index) => ({
          id: `existing:${index}:${name}`,
          name,
        })),
  )
  const [errorMessage, setErrorMessage] = useState('')

  // 부모 상태를 그리기 전에 맞춘다. 제거 직후 바로 제출해도 이전 첨부 목록이 가지 않게 한다.
  useLayoutEffect(() => {
    onFilesChange?.(files.length > 0)
    onFileNamesChange?.(files.map(({ name }) => name))
    onFileObjectsChange?.(files.flatMap(({ file }) => (file ? [file] : [])))
    onFileItemsChange?.(
      files.map(({ name, file, fileKey }) => ({ name, file, fileKey })),
    )
  }, [
    files,
    onFileItemsChange,
    onFileNamesChange,
    onFileObjectsChange,
    onFilesChange,
  ])

  const isObservation = variant === 'observation'
  const isNotice = variant === 'notice' || variant === 'notice-create'
  // `task`·`observation`·`notice-create` 는 첨부가 없어도 라벨을 보인다.
  const showsTitle =
    files.length > 0 || (variant !== 'default' && variant !== 'notice')
  // `notice` 는 첨부가 없으면 빈 카드를 그리지 않는다.
  const showsCard = variant !== 'notice' || files.length > 0

  function addFiles(incomingFiles: File[]) {
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

    onAddResult?.({
      added: nextFiles.length,
      rejected: incomingFiles.length - nextFiles.length,
    })
  }

  function handleRemove(id: string) {
    setFiles((currentFiles) => currentFiles.filter((file) => file.id !== id))
  }

  // 새로 고른 파일은 원본이 손에 있고, 저장된 첨부는 파일 서버에서 받아 온다.
  function handleDownload({ name, file, fileKey }: AttachedFile) {
    if (file || !storedFiles || !fileKey) {
      downloadFile(name, file)
      return
    }

    // 실패는 첨부 카드의 오류 자리에 알린다. 크기·중복 오류와 같은 자리다.
    downloadStoredFile({ fileName: name, fileKey })
      .then(() =>
        // 다시 받아졌으면 지난 실패 안내만 걷는다. 크기·중복 안내는 그대로 둔다.
        setErrorMessage((message) =>
          message === downloadErrorMessage ? '' : message,
        ),
      )
      .catch((error: unknown) => {
        console.error(error)
        setErrorMessage(downloadErrorMessage)
      })
  }

  return (
    <AttachmentSection
      role="group"
      aria-label="첨부파일"
      data-variant={variant}
      data-card={showsCard}
    >
      {showsCard && (
        <AttachmentCard data-testid="notice-attachment-card">
          {showsTitle && (
            <>
              <AttachmentTitle>
                {isObservation ? '첨부' : '첨부자료'}
              </AttachmentTitle>
              <FileList>
                {files.map((attachedFile) => {
                  if (isObservation) {
                    return (
                      <AttachmentChip
                        key={attachedFile.id}
                        fileName={attachedFile.name}
                        onDownload={() => handleDownload(attachedFile)}
                        onRemove={() => handleRemove(attachedFile.id)}
                      />
                    )
                  }

                  const kind = fileKind(attachedFile.name)

                  return (
                    <FileChip key={attachedFile.id}>
                      <FileBadge data-kind={kind}>
                        {kind.toUpperCase()}
                      </FileBadge>
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
      )}

      <DropZone
        ariaLabel="파일 업로드"
        inputLabel="첨부파일 선택"
        inputId="notice-attachments"
        multiple
        appearance={variant === 'default' ? 'default' : 'strong'}
        textSize={isObservation || isNotice ? 18 : 16}
        onFiles={addFiles}
      />
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

  &[data-variant='task'],
  &[data-variant='observation'] {
    margin-top: 0;
  }

  &[data-variant='notice'] {
    margin-top: 20px;
  }
`

const AttachmentCard = styled.div`
  min-height: 140px;
  padding: 24px 40px 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  [data-variant='observation'] & {
    min-height: 0;
    padding: 28px 32px;
  }

  @media (max-width: 980px) {
    padding: 24px;

    [data-variant='observation'] & {
      padding: 24px;
    }
  }
`

const AttachmentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;

  [data-variant='notice'] &,
  [data-variant='notice-create'] & {
    color: ${({ theme }) => theme.colors.textStrong};
    font-size: 22px;
    line-height: normal;
  }

  [data-variant='task'] & {
    font-size: 20px;
    line-height: 1.3;
  }

  [data-variant='observation'] & {
    color: ${({ theme }) => theme.colors.textStrong};
    font-size: 32px;
    line-height: 1.2;
  }
`

const FileList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;

  [data-variant='task'] & {
    margin-top: 10px;
  }

  [data-variant='observation'] & {
    margin-top: 12px;
  }

  &:empty {
    display: none;
  }
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

// 공용 드롭존의 카드와의 간격. 업무·공지는 32px, 관찰 수정은 Figma 16px 이다.
const DropZone = styled(FileDropZone)`
  margin-top: 32px;

  [data-variant='observation'] & {
    margin-top: 16px;
  }

  [data-variant='notice'] &,
  [data-variant='notice-create'] & {
    border-color: ${({ theme }) => theme.colors.textValue};
  }

  [data-variant='notice'] & {
    margin-top: 20px;
  }

  [data-variant='notice'][data-card='false'] & {
    margin-top: 0;
  }
`

const ErrorMessage = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 16px;
  text-align: center;
`
