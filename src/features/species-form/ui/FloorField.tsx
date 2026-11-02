import {
  speciesFloorLabels,
  speciesFloors,
  type SpeciesFloor,
} from '@/entities/species'
import { FormFieldCard, PillRadioGroup } from '@/shared/ui'

interface FloorFieldProps {
  value: SpeciesFloor
  onChange: (value: SpeciesFloor) => void
}

const floorOptions = speciesFloors.map((floor) => ({
  value: String(floor),
  label: speciesFloorLabels[floor],
}))

// Figma `field / 층`(3133:26236). 분류군과 같은 pill 이고 기본값이 있어 오류 줄이 없다.
export function FloorField({ value, onChange }: FloorFieldProps) {
  function handleChange(nextValue: string) {
    const floor = speciesFloors.find(
      (candidate) => String(candidate) === nextValue,
    )
    if (floor !== undefined) onChange(floor)
  }

  return (
    <FormFieldCard>
      <PillRadioGroup
        legend="층"
        required
        name="species-floor"
        options={floorOptions}
        value={String(value)}
        onChange={handleChange}
      />
    </FormFieldCard>
  )
}
