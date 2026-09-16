import styled from '@emotion/styled'
import { formatFedDate } from '../model/format'
import type { FeedRecordDetail } from '../model/types'
import { AnimalSpeciesBadge } from './AnimalSpeciesBadge'

interface FeedRecordCardProps {
  feed: FeedRecordDetail
}

// Figma `749:14672` (basic info). 개체 사진 + 개체명·분류 + 급여 기록 필드 5종.
export function FeedRecordCard({ feed }: FeedRecordCardProps) {
  return (
    <Card>
      <Photo
        $src={feed.animalPhotoUrl}
        role="img"
        aria-label={`${feed.animalName} 사진`}
      />
      <Info>
        <Titles>
          <AnimalName>{feed.animalName}</AnimalName>
          {/* 급여 API 가 분류를 주지 않으면 배지를 그리지 않는다. */}
          {feed.species && <AnimalSpeciesBadge species={feed.species} />}
        </Titles>
        <Fields>
          <Row>
            <Field label="급여날짜" value={formatFedDate(feed.fedDate)} />
            <Field label="급여시간" value={feed.fedTime} />
          </Row>
          <Row>
            <Field label="급여자" value={feed.feederName} />
            <Field label="먹이 종류" value={feed.feedType} />
          </Row>
          <Row>
            <Field label="급여량" value={feed.feedAmount} />
          </Row>
          <Row>
            <Field label="특이사항" value={feed.note} />
          </Row>
        </Fields>
      </Info>

      {/* 이동할 화면이 아직 없어 비활성으로 둔다(spec). */}
      <ObservationButton aria-disabled="true">
        관찰 및 특이사항 보러가기
        <Chevron aria-hidden="true">›</Chevron>
      </ObservationButton>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <FieldBox>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </FieldBox>
  )
}

const Card = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  margin-top: 33px;
  align-items: center;
  gap: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Photo = styled.div<{ $src?: string }>`
  width: 180px;
  height: 180px;
  flex: 0 0 180px;
  border-radius: 20px;
  background: ${({ theme, $src }) =>
    $src ? `url("${$src}") center / cover no-repeat` : theme.colors.avatar};
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
`

const Titles = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 16px;
`

const AnimalName = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 23px;
`

const Row = styled.div`
  display: flex;
  gap: 24px;
`

const FieldBox = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 16px;
`

const FieldLabel = styled.span`
  width: 118px;
  flex: 0 0 118px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const FieldValue = styled.span`
  min-width: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const ObservationButton = styled.span`
  position: absolute;
  top: 42px;
  right: 32px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  cursor: default;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const Chevron = styled.span`
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
`
