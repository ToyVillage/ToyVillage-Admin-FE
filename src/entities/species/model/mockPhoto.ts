import capybaraPhotoUrl from './assets/capybara.jpg'
import type { Photo, PhotoInput } from './types'

// 종·개체 mock 이 함께 쓰는 공용 사진 에셋(Figma `1191:14903` · `129:9534` 같은 이미지).
// 파일 본문은 저장하지 않으므로 새로 올린 사진도 이 에셋으로 표시한다. 실제 API 연동(/api) 시 제거한다.
export const mockPhotoUrl = capybaraPhotoUrl

export function toMockPhoto(input: PhotoInput, fileKey: string): Photo {
  if (input.kind === 'existing') return input.photo
  return { fileName: input.file.name, fileKey, url: mockPhotoUrl }
}

export function isPhoto(value: unknown): value is Photo {
  if (!value || typeof value !== 'object') return false

  const photo = value as Record<string, unknown>
  return (
    typeof photo.fileName === 'string' &&
    typeof photo.fileKey === 'string' &&
    typeof photo.url === 'string'
  )
}
