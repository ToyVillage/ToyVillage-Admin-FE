import {
  legalDesignationPresets,
  type CreateSpeciesInput,
  type Photo,
  type PhotoInput,
  type Species,
} from '@/entities/species'
import type { PhotoValue } from '@/shared/ui'
import type { SpeciesFormValues } from './types'

/** 등록은 빈 폼(분류군 `포유류`), 수정은 저장값으로 채운다. */
export function toSpeciesFormValues(species?: Species): SpeciesFormValues {
  if (!species) {
    return {
      koreanName: '',
      englishName: '',
      scientificName: '',
      taxonGroup: 'MAMMAL',
      subClassification: '',
      legalDesignations: [],
      photo: null,
    }
  }

  return {
    koreanName: species.koreanName,
    englishName: species.englishName,
    scientificName: species.scientificName,
    taxonGroup: species.taxonGroup,
    subClassification: species.subClassification ?? '',
    legalDesignations: toDisplayOrder(species.legalDesignations),
    photo: { fileName: species.photo.fileName, url: species.photo.url },
  }
}

/** 이탈 확인 판정용. 사진은 새로 고른 파일이 있으면 달라진 것으로 본다. */
export function isSameSpeciesFormValues(
  left: SpeciesFormValues,
  right: SpeciesFormValues,
): boolean {
  return (
    left.koreanName === right.koreanName &&
    left.englishName === right.englishName &&
    left.scientificName === right.scientificName &&
    left.taxonGroup === right.taxonGroup &&
    left.subClassification === right.subClassification &&
    left.legalDesignations.length === right.legalDesignations.length &&
    left.legalDesignations.every(
      (name, index) => name === right.legalDesignations[index],
    ) &&
    left.photo?.fileName === right.photo?.fileName &&
    left.photo?.file === right.photo?.file
  )
}

/** 검증을 통과한 값만 넘긴다. 텍스트는 앞뒤 공백을 빼고 빈 세부 분류는 생략한다. */
export function toSpeciesInput(
  values: SpeciesFormValues,
  savedPhoto?: Photo,
): CreateSpeciesInput {
  const subClassification = values.subClassification.trim()

  return {
    koreanName: values.koreanName.trim(),
    englishName: values.englishName.trim(),
    scientificName: values.scientificName.trim(),
    taxonGroup: values.taxonGroup,
    ...(subClassification ? { subClassification } : {}),
    legalDesignations: values.legalDesignations,
    photo: toPhotoInput(values.photo, savedPhoto),
  }
}

function toPhotoInput(
  photo: PhotoValue | null,
  savedPhoto: Photo | undefined,
): PhotoInput {
  if (photo?.file) return { kind: 'new', file: photo.file }
  if (photo && savedPhoto) return { kind: 'existing', photo: savedPhoto }
  throw new Error('Species photo is required')
}

// 화면은 기본 선택지를 항상 먼저 보이고 직접 추가 항목을 저장 순서대로 뒤에 붙인다.
function toDisplayOrder(legalDesignations: string[]): string[] {
  const presets: readonly string[] = legalDesignationPresets
  return [
    ...presets.filter((name) => legalDesignations.includes(name)),
    ...legalDesignations.filter((name) => !presets.includes(name)),
  ]
}
