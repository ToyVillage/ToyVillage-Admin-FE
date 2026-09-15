import type {
  CreateIndividualInput,
  Individual,
  Photo,
  PhotoInput,
  UpdateIndividualInput,
} from '@/entities/individual'
import type { PhotoValue } from '@/shared/ui'
import type { IndividualFormValues } from './types'

/** 등록은 빈 폼(성별 미선택), 수정은 저장값으로 채운다. */
export function toIndividualFormValues(
  individual?: Individual,
): IndividualFormValues {
  if (!individual) {
    return { name: '', sex: null, birthYear: '', note: '', photo: null }
  }

  return {
    name: individual.name,
    sex: individual.sex,
    birthYear: String(individual.birthYear),
    note: individual.note ?? '',
    photo: { fileName: individual.photo.fileName, url: individual.photo.url },
  }
}

/** 이탈 확인 판정용. 사진은 새로 고른 파일이 있으면 달라진 것으로 본다. */
export function isSameIndividualFormValues(
  left: IndividualFormValues,
  right: IndividualFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.sex === right.sex &&
    left.birthYear === right.birthYear &&
    left.note === right.note &&
    left.photo?.fileName === right.photo?.fileName &&
    left.photo?.file === right.photo?.file
  )
}

/** 검증을 통과한 값만 넘긴다. 텍스트는 앞뒤 공백을 빼고 빈 기타정보는 생략한다. */
export function toUpdateIndividualInput(
  values: IndividualFormValues,
  savedPhoto?: Photo,
): UpdateIndividualInput {
  if (!values.sex) throw new Error('Individual sex is required')
  const note = values.note.trim()

  return {
    name: values.name.trim(),
    sex: values.sex,
    birthYear: Number(values.birthYear),
    ...(note ? { note } : {}),
    photo: toPhotoInput(values.photo, savedPhoto),
  }
}

export function toCreateIndividualInput(
  speciesId: string,
  values: IndividualFormValues,
): CreateIndividualInput {
  return { speciesId, ...toUpdateIndividualInput(values) }
}

function toPhotoInput(
  photo: PhotoValue | null,
  savedPhoto: Photo | undefined,
): PhotoInput {
  if (photo?.file) return { kind: 'new', file: photo.file }
  if (photo && savedPhoto) return { kind: 'existing', photo: savedPhoto }
  throw new Error('Individual photo is required')
}
