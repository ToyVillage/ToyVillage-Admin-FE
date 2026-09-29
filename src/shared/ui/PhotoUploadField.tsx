import { useId, useState } from 'react'
import styled from '@emotion/styled'
import { AttachmentChip } from './AttachmentChip'
import { downloadFile } from './fileAttachment'
import { FileDropZone } from './FileDropZone'
import { FormFieldCard } from './FormFieldCard'

const defaultMaxFileSize = 50 * 1024 * 1024

export interface PhotoValue {
  /** 칩에 보이는 파일명 */
  fileName: string
  /** 이번에 새로 고른 파일 */
  file?: File
  /** 수정 복원 시 저장된 사진 url */
  url?: string
}

interface PhotoUploadFieldProps {
  label: string
  required?: boolean
  hint?: string
  value: PhotoValue | null
  onChange: (value: PhotoValue | null) => void
  /** 필수 오류 줄 문구(카드 아래, 드롭존 위). */
  error?: string
  maxFileSize?: number
}

// Figma `field / 사진`(127:9358) + `upload file`(1:10511). 대표 사진 1장만 두고
// 새 업로드로 교체하거나 칩의 ✕ 로 지운다. 거부 문구는 드롭존 아래에 인라인으로 보인다.
export function PhotoUploadField({
  label,
  required,
  hint,
  value,
  onChange,
  error,
  maxFileSize = defaultMaxFileSize,
}: PhotoUploadFieldProps) {
  const fieldId = useId()
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`
  const [rejection, setRejection] = useState('')
  const maxSizeLabel = `${Math.round(maxFileSize / (1024 * 1024))}MB`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  function handleFiles(files: File[]) {
    if (files.length === 0) return

    const [file] = files
    // 여러 조건에 걸리면 개수 → 형식 → 용량 순서의 첫 문구만 보인다.
    if (files.length > 1) {
      setRejection('대표 사진은 1장만 등록할 수 있습니다.')
    } else if (!file.type.startsWith('image/')) {
      setRejection('이미지 파일만 등록할 수 있습니다.')
    } else if (file.size > maxFileSize) {
      setRejection(
        `${file.name}은 ${maxSizeLabel}를 초과해 첨부할 수 없습니다.`,
      )
    } else {
      setRejection('')
      onChange({ fileName: file.name, file })
    }
  }

  return (
    <Field>
      <FormFieldCard
        label={label}
        required={required}
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
      >
        {value && (
          <PhotoChip
            order="action-first"
            fileName={value.fileName}
            onDownload={() => downloadFile(value.fileName, value.file)}
            removeTone="muted"
            onRemove={() => {
              setRejection('')
              onChange(null)
            }}
          />
        )}
      </FormFieldCard>
      <div>
        <FileDropZone
          ariaLabel={`${label} 업로드`}
          inputLabel={`${label} 파일 선택`}
          accept="image/*"
          describedBy={describedBy}
          appearance="strong"
          textSize={18}
          maxSizeLabel={maxSizeLabel}
          onFiles={handleFiles}
        />
        {rejection && <Rejection role="alert">{rejection}</Rejection>}
      </div>
    </Field>
  )
}

// 사진 카드(오류 줄 포함)와 드롭존은 폼 카드 간격(16px)으로 떨어진다.
const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`

// Figma `uploaded file`(1057:14773) — 공용 첨부 칩을 유형 아이콘 → 다운로드 → 파일명 순서로 쓴다.
// 카드 안에서 내용 폭만 차지한다.
const PhotoChip = styled(AttachmentChip)`
  align-self: flex-start;
`

const Rejection = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 16px;
  text-align: center;
`
