import {
  taxonGroupLabels,
  taxonGroups,
  type TaxonGroup,
} from '@/entities/species'
import { PillRadioGroup } from '@/shared/ui'

interface TaxonGroupFieldProps {
  value: TaxonGroup
  onChange: (value: TaxonGroup) => void
}

const taxonGroupOptions = taxonGroups.map((taxonGroup) => ({
  value: taxonGroup,
  label: taxonGroupLabels[taxonGroup],
}))

// Figma `field / 분류`(127:9342) 분류군 pill. 기본값이 있어 오류 줄이 없다.
export function TaxonGroupField({ value, onChange }: TaxonGroupFieldProps) {
  function handleChange(nextValue: string) {
    const taxonGroup = taxonGroups.find((candidate) => candidate === nextValue)
    if (taxonGroup) onChange(taxonGroup)
  }

  return (
    <PillRadioGroup
      legend="분류군"
      required
      name="species-taxon-group"
      options={taxonGroupOptions}
      value={value}
      onChange={handleChange}
    />
  )
}
