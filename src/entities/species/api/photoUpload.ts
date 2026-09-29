import { uploadFile } from '@/entities/file'
import type { PhotoInput } from '../model/types'

/** 새 사진은 `POST /file` 로 올려 받은 키를, 유지한 사진은 저장된 키를 돌려준다. 종·개체 폼이 함께 쓴다. */
export async function resolvePhotoFileKey(photo: PhotoInput): Promise<string> {
  if (photo.kind === 'existing') return photo.photo.fileKey

  const { fileKey } = await uploadFile({ files: photo.file })
  return fileKey
}
