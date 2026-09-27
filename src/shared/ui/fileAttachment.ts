import { fetchStoredFile } from '../api/fileStorage'
import fileJpgIcon from './assets/file-jpg.svg'
import filePngIcon from './assets/file-png.svg'
import filePdfIcon from './assets/file-pdf.svg'
import fileEtcIcon from './assets/file-etc.svg'

export interface StoredFile {
  fileName: string
  fileKey: string
}

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

export type AttachmentPreviewKind = 'image' | 'pdf'

// 미리보기 모달로 열 수 있는 형식. 그 밖의 형식은 null 이고 바로 내려받는다.
export function previewKind(fileName: string): AttachmentPreviewKind | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image'
  if (extension === 'pdf') return 'pdf'
  return null
}

// mock 경계: 새로 고른 파일은 원본을, 실제 파일 소스가 없는 기존 첨부는
// 파일명을 담은 임시 Blob 을 내려받는다. 서버에 저장된 첨부는 downloadStoredFile 을 쓴다.
export function downloadFile(fileName: string, file?: Blob) {
  const source = file ?? new Blob([`${fileName}\n`], { type: 'text/plain' })
  const url = URL.createObjectURL(source)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // 클릭 직후 해제하면 Safari 가 다운로드를 시작하기 전에 Blob 을 잃는다. 넉넉히 늦춘다.
  window.setTimeout(() => URL.revokeObjectURL(url), 40_000)
}

// 서버에 저장된 첨부는 파일 서버에서 원본을 받아 원래 파일명으로 내려받는다.
// 받지 못하면 예외를 그대로 던져 호출부가 알린다.
export async function downloadStoredFile({ fileName, fileKey }: StoredFile) {
  const file = await fetchStoredFile(fileKey)
  downloadFile(fileName, file)
}
