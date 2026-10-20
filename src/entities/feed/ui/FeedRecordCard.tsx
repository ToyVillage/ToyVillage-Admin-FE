import styled from '@emotion/styled'
import { ProfilePhoto, ShortcutButton, Skeleton } from '@/shared/ui'
import { formatFedDate } from '../model/format'
import type { AnimalSpecies, FeedRecordDetail } from '../model/types'
import { AnimalSpeciesBadge } from './AnimalSpeciesBadge'

interface FeedRecordCardProps {
  /** 비어 있으면 조회 중이다. 라벨·버튼은 그대로 두고 서버 값 자리만 막대로 채운다. */
  feed?: FeedRecordDetail
  /** 개체 분류. 급여 API 에는 없고 목록에서 고른 분류 탭에서 온다. 없으면 배지를 그리지 않는다. */
  species?: AnimalSpecies
  /**
   * 개체 상세(관찰 및 특이사항 표) 경로. 종 id 를 아직 모르면 null 이고,
   * 그때는 링크 대신 비활성 배지를 그린다.
   */
  observationHref: string | null
}

// Figma `749:14672` (basic info). 개체 사진 + 개체명·분류 + 급여 기록 필드 7종.
// 조회 중에도 같은 카드를 그려 불러온 뒤 박스 크기·위치가 바뀌지 않게 한다.
export function FeedRecordCard({
  feed,
  species,
  observationHref,
}: FeedRecordCardProps) {
  return (
    <Card>
      {feed ? (
        // 개체 상세 카드와 같은 사진 컴포넌트를 쓴다. 못 불러오면 `사진 없음` 이 대신 온다.
        <Photo
          src={feed.animalPhotoUrl ?? ''}
          alt={`${feed.animalName} 사진`}
        />
      ) : (
        <PhotoSlot>
          <Skeleton width={180} height={180} radius={20} />
        </PhotoSlot>
      )}
      <Info>
        <Titles>
          {feed ? (
            <AnimalName>{feed.animalName}</AnimalName>
          ) : (
            <Skeleton width={90} height={28} />
          )}
          {species && <AnimalSpeciesBadge species={species} />}
        </Titles>
        {/* 특이사항은 길어질 수 있어 마지막 줄을 혼자 쓴다 — 두 열에 걸쳐
            남은 폭을 그대로 쓴다. */}
        <Fields>
          <Row>
            <Field
              label="급여날짜"
              value={feed && formatFedDate(feed.fedDate)}
              loadingWidth={120}
            />
            <Field label="먹이 종류" value={feed?.feedType} loadingWidth={40} />
          </Row>
          <Row>
            <Field label="급여시간" value={feed?.fedTime} loadingWidth={60} />
            <Field label="급여량" value={feed?.feedAmount} loadingWidth={40} />
          </Row>
          <Row>
            <Field label="급여자" value={feed?.feederName} loadingWidth={60} />
            <Field
              label="잔량"
              value={feed?.remainingAmount}
              loadingWidth={40}
            />
          </Row>
          <Row>
            <WideField label="특이사항" value={feed?.note} loadingWidth={320} />
          </Row>
        </Fields>
      </Info>

      {/* 개체 상세의 `먹이 급여 기록 확인하기` 와 같은 버튼. 종 id 를 모르면 비활성이다. */}
      <Actions>
        <ShortcutButton
          to={observationHref ?? undefined}
          disabled={observationHref === null}
        >
          관찰 및 특이사항 보러가기
        </ShortcutButton>
      </Actions>
    </Card>
  )
}

interface FieldProps {
  label: string
  /** 비어 있으면 조회 중이라 값 자리에 막대를 그린다. */
  value: string | undefined
  /** 조회 중 막대 폭 */
  loadingWidth: number
  className?: string
}

function Field({ label, value, loadingWidth, className }: FieldProps) {
  return (
    <FieldBox className={className}>
      <FieldLabel>{label}</FieldLabel>
      {value === undefined ? (
        // 보이지 않는 한 글자로 값 한 줄의 높이·baseline 을 그대로 두고 막대를 겹친다.
        <LoadingValue aria-hidden="true" style={{ width: loadingWidth }}>
          {'\u00a0'}
          <LoadingBar>
            <Skeleton width={loadingWidth} height={20} />
          </LoadingBar>
        </LoadingValue>
      ) : (
        <FieldValue>{value}</FieldValue>
      )}
    </FieldBox>
  )
}

// 사진 180 + 정보. 사진·정보는 위를 맞추고, 값이 길어지면 아래 여백만 늘어난다.
// 액션은 카드 우상단에 띄운다 — 열로 잡으면 아래 행의 긴 값이 버튼 폭만큼 일찍 끊긴다.
const Card = styled.section`
  position: relative;
  display: grid;
  width: 100%;
  margin-top: 33px;
  grid-template-areas: 'photo info';
  grid-template-columns: 180px minmax(0, 1fr);
  align-items: start;
  column-gap: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    grid-template-areas:
      'photo photo'
      'info info';
    grid-template-columns: minmax(0, 1fr);
    row-gap: 24px;
    column-gap: 24px;
    padding: 24px;
  }
`

const Actions = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 24px;

  /* 좁은 화면에서는 띄우지 않고 흐름에 둔다(사진·정보와 겹치지 않게). */
  @media (max-width: 980px) {
    position: static;
    justify-content: flex-end;
  }
`

const Photo = styled(ProfilePhoto)`
  grid-area: photo;
  /* 개체 상세 카드(IndividualProfileCard)의 사진은 카드 위에서 57px 떨어져 있다.
     여기도 같은 자리에 고정하고, 값이 길어지면 사진 아래 여백만 늘어난다. */
  margin-top: 17px;
  width: 180px;
  height: 180px;
  flex: 0 0 180px;
  border-radius: 20px;
  object-fit: cover;
`

// 조회 중 사진 자리. 실제 사진(Photo)과 같은 위치·크기다.
const PhotoSlot = styled.div`
  grid-area: photo;
  margin-top: 17px;
`

const Info = styled.div`
  grid-area: info;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
`

// 개체명 행만 우상단 버튼과 같은 높이라 버튼 폭을 비켜 간다.
const Titles = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 16px;
  padding-right: 320px;

  @media (max-width: 980px) {
    padding-right: 0;
  }
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

// 왼쪽 열 폭을 고정해 두 번째 열이 늘 같은 자리에서 시작하게 한다.
// (flex 로 반씩 나누면 카드 폭에 따라 두 번째 열이 밀린다.)
const Row = styled.div`
  display: grid;
  grid-template-columns: 348px minmax(0, 1fr);
  gap: 24px;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

// 값이 여러 줄이어도 라벨은 첫 줄에 맞춘다(가운데 정렬하면 라벨이 아래로 내려간다).
// 글자 크기가 서로 달라 baseline 으로 맞춘다.
const FieldBox = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: baseline;
  gap: 16px;
`

// 두 열을 모두 차지한다.
const WideField = styled(Field)`
  grid-column: 1 / -1;
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

const LoadingValue = styled(FieldValue)`
  position: relative;
  display: inline-block;
  max-width: 100%;
`

const LoadingBar = styled.span`
  position: absolute;
  top: 50%;
  left: 0;
  display: block;
  width: 100%;
  transform: translateY(-50%);
`
