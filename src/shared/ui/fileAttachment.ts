import fileJpgIcon from './assets/file-jpg.svg'
import filePngIcon from './assets/file-png.svg'
import filePdfIcon from './assets/file-pdf.svg'
import fileEtcIcon from './assets/file-etc.svg'

// Figma `teenyicons:*-solid` 파일 유형 아이콘. 확장자로 고르고 모르는 형식은 etc 로 둔다.
const fileTypeIcons = {
  jpg: fileJpgIcon,
  png: filePngIcon,
  pdf: filePdfIcon,
  etc: fileEtcIcon,
} as const

export function fileTypeIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'jpg' || extension === 'jpeg') return fileTypeIcons.jpg
  if (extension === 'png') return fileTypeIcons.png
  if (extension === 'pdf') return fileTypeIcons.pdf
  return fileTypeIcons.etc
}

// mock 경계: 새로 고른 파일은 원본을, 실제 파일 소스가 없는 기존 첨부는
// 파일명을 담은 임시 Blob 을 내려받는다(AttachmentList 규칙).
export function downloadFile(fileName: string, file?: Blob) {
  const source = file ?? new Blob([`${fileName}\n`], { type: 'text/plain' })
  const url = URL.createObjectURL(source)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
