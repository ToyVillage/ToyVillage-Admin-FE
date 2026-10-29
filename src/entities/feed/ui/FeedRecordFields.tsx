import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Skeleton } from '@/shared/ui'
import {
  formatAnimalLabel,
  formatFedAt,
  formatFedDate,
  formatFeedQuantity,
  formatNote,
} from '../model/format'
import type { FeedFloor, FeedRecordDetail } from '../model/types'

interface FeedRecordFieldsProps {
  floor: FeedFloor
  /** 아직 받지 못했으면 비워 둔다 — 같은 카드를 그리고 값 자리만 막대로 채운다. */
  feed?: FeedRecordDetail
  /** `대상 개체` 카드 오른쪽 버튼(`급여 이력 보기`). */
  targetAction?: ReactNode
}

// Figma `feeding record detail`(4층 3129:25402 / 5층 3130:25980). 앱 입력 칸만 카드로 보인다.
export function FeedRecordFields({
  floor,
  feed,
  targetAction,
}: FeedRecordFieldsProps) {
  const fields: { label: string; value?: string }[] = [
    {
      label: '대상 개체',
      value: feed && formatAnimalLabel(feed.animalType, feed.animalName),
    },
    floor === '4'
      ? {
          label: '급여일시',
          value: feed && formatFedAt(feed.fedDate, feed.fedTime),
        }
      : { label: '급여일', value: feed && formatFedDate(feed.fedDate) },
    { label: '급여자', value: feed?.feederName },
    { label: '먹이 종류', value: feed?.feedType },
    {
      label: '급여량',
      value: feed && formatFeedQuantity(feed.feedAmount, feed.unit),
    },
    ...(floor === '4'
      ? [
          {
            label: '잔량',
            value: feed && formatFeedQuantity(feed.remainingAmount, feed.unit),
          },
          { label: '특이사항', value: feed && formatNote(feed.note) },
        ]
      : []),
  ]

  return (
    <Fields>
      {fields.map(({ label, value }, index) => (
        <Card key={label}>
          <Text>
            <Label>{label}</Label>
            {value === undefined ? (
              <Skeleton width={180} height={29} />
            ) : (
              <Value>{value}</Value>
            )}
          </Text>
          {index === 0 && targetAction}
        </Card>
      ))}
    </Fields>
  )
}

const Fields = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
`

const Card = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Text = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.dt`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const Value = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`
