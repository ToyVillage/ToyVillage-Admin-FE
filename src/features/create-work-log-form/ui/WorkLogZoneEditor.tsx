import { useState } from 'react'
import styled from '@emotion/styled'
import type { WorkLogFormZone } from '@/entities/work-log'
import { ActionButton, SelectMenu } from '@/shared/ui'
import chipRemoveIcon from './assets/zone-chip-remove.svg'
import { buildAutoZoneLabels } from '../model/draft'

interface WorkLogZoneEditorProps {
  zones: WorkLogFormZone[]
  onAdd: (labels: string[]) => void
  onRemove: (zone: WorkLogFormZone) => void
  onClearAll: () => void
}

// Figma 1:5438 — 접두는 `A` / `B` / `없음` 세 가지다. `없음` 은 숫자만 만든다.
const prefixOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: '', label: '없음' },
]

// Figma 1:4561 "worklog zone make" — 생성·수정이 함께 쓰는 2단계 본문.
export function WorkLogZoneEditor({
  zones,
  onAdd,
  onRemove,
  onClearAll,
}: WorkLogZoneEditorProps) {
  const [prefix, setPrefix] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [manualLabel, setManualLabel] = useState('')

  function handleAutoCreate() {
    const labels = buildAutoZoneLabels(prefix, start, end)
    if (labels.length === 0) return
    onAdd(labels)
  }

  function handleManualAdd() {
    const label = manualLabel.trim()
    if (!label) return
    onAdd([label])
    setManualLabel('')
  }

  return (
    <Card>
      <HeaderBand>
        <HeaderTitle>구역 번호 설정</HeaderTitle>
      </HeaderBand>

      <Body>
        <Block>
          <BlockLabel>
            자동 생성<Required aria-hidden="true"> *</Required>
          </BlockLabel>
          <AutoRow>
            <SelectMenu
              value={prefix}
              options={prefixOptions}
              onChange={setPrefix}
              ariaLabel="구역 접두"
              width={262}
              height={66}
              variant="field"
              optionAlign="center"
              openBorder
            />
            <NumberInput
              value={start}
              inputMode="numeric"
              placeholder="1"
              aria-label="시작 번호"
              onChange={(event) => setStart(event.target.value)}
            />
            <RangeMark aria-hidden="true">~</RangeMark>
            <NumberInput
              value={end}
              inputMode="numeric"
              placeholder="24"
              aria-label="끝 번호"
              onChange={(event) => setEnd(event.target.value)}
            />
            <ActionButton height={66} onClick={handleAutoCreate}>
              생성
            </ActionButton>
          </AutoRow>
        </Block>

        <Block>
          <BlockLabel as="span">직접 추가</BlockLabel>
          <ManualRow>
            <ManualInput
              value={manualLabel}
              placeholder="예) B4, 기타"
              aria-label="구역 직접 추가"
              onChange={(event) => setManualLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                handleManualAdd()
              }}
            />
            <ActionButton height={66} onClick={handleManualAdd}>
              추가
            </ActionButton>
          </ManualRow>
        </Block>

        <Block>
          <ZoneHeader>
            <BlockLabel as="span">설정된 구역</BlockLabel>
            <ZoneCount>({zones.length})</ZoneCount>
            {zones.length > 0 && (
              <ClearAllButton type="button" onClick={onClearAll}>
                전체 삭제
              </ClearAllButton>
            )}
          </ZoneHeader>
          <Chips>
            {zones.map((zone) => (
              <Chip key={zone.id}>
                <ChipLabel>{zone.label}</ChipLabel>
                <ChipRemoveButton
                  type="button"
                  aria-label={`${zone.label} 구역 삭제`}
                  onClick={() => onRemove(zone)}
                >
                  <ChipRemoveIcon src={chipRemoveIcon} alt="" aria-hidden="true" />
                </ChipRemoveButton>
              </Chip>
            ))}
          </Chips>
        </Block>
      </Body>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  width: 100%;
  min-height: 746px;
  flex-direction: column;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`

const HeaderBand = styled.div`
  display: flex;
  height: 80px;
  align-items: center;
  padding: 0 40px;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const HeaderTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px 40px 40px;
`

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const BlockLabel = styled.label`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const AutoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
`

const NumberInput = styled.input`
  width: 112px;
  height: 66px;
  flex: 0 0 112px;
  padding: 0 24px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  text-align: center;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const RangeMark = styled.span`
  width: 66px;
  flex: 0 0 66px;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 500;
  text-align: center;
`

const ManualRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
`

const ManualInput = styled.input`
  min-width: 0;
  height: 66px;
  flex: 1;
  padding: 0 24px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const ZoneHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ZoneCount = styled.span`
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`

const ClearAllButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  text-decoration: underline;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Chips = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  min-height: 58px;
`

const Chip = styled.span`
  display: inline-flex;
  height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 28px;
  border-radius: 80px;
  background: ${({ theme }) => theme.colors.background};
`

const ChipRemoveButton = styled.button`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const ChipRemoveIcon = styled.img`
  width: 20px;
  height: 20px;
`

const ChipLabel = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
`
