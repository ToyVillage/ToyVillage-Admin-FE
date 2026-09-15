import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import {
  formatTaxonGroupLine,
  lastSubClassification,
} from '../model/classification'
import { taxonGroupLabels } from '../model/labels'
import type { Species } from '../model/types'
import { LegalDesignationBadge } from './LegalDesignationBadge'

interface SpeciesProfileCardProps {
  species: Species
  /** 카드 우상단 케밥 메뉴. 메뉴 상태는 페이지가 소유한다. */
  action?: ReactNode
}

// 빈 값 표기(세부분류·법정지정분류). 개체관리 상세 화면 공통.
const emptyValue = '—'

// Figma `species basic info`(1191:14902) — 사진 260 + 제목·부제 + 정보 2열 3행.
export function SpeciesProfileCard({
  species,
  action,
}: SpeciesProfileCardProps) {
  // 행 순서대로 채우면 왼쪽 열이 국명·분류군·영문명, 오른쪽 열이 학명·법정지정분류·세부분류다.
  const details: { label: string; value: ReactNode }[] = [
    { label: '국명', value: species.koreanName },
    { label: '학명', value: species.scientificName },
    { label: '분류군', value: formatTaxonGroupLine(species) },
    {
      label: '법정지정분류',
      value:
        species.legalDesignations.length > 0 ? (
          <Badges>
            {species.legalDesignations.map((designation) => (
              <LegalDesignationBadge key={designation} label={designation} />
            ))}
          </Badges>
        ) : (
          emptyValue
        ),
    },
    { label: '영문명', value: species.englishName },
    {
      label: '세부분류',
      value: lastSubClassification(species.subClassification) ?? emptyValue,
    },
  ]

  return (
    <Card>
      <Photo src={species.photo.url} alt={`${species.koreanName} 사진`} />
      <Info>
        <Titles>
          <Title>{species.koreanName}</Title>
          <Subtitle>
            {taxonGroupLabels[species.taxonGroup]}
            {/* 점은 장식이다. 글자는 크기 0 으로 두어 복사·텍스트 비교에서만 구분자로 남긴다. */}
            <Dot aria-hidden="true"> · </Dot>
            {species.scientificName}
          </Subtitle>
        </Titles>
        <Details>
          {details.map((detail) => (
            <Detail key={detail.label}>
              <DetailLabel>{detail.label}</DetailLabel>
              <DetailValue>{detail.value}</DetailValue>
            </Detail>
          ))}
        </Details>
      </Info>
      {action && <ActionSlot>{action}</ActionSlot>}
    </Card>
  )
}

// 케밥 메뉴는 이 카드(positioned)의 오른쪽 끝에 맞춰 열린다. 그래서 액션 슬롯은
// 절대 배치하지 않고 정보 열과 같은 그리드 칸의 우상단에 겹쳐 둔다.
const Card = styled.section`
  position: relative;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  column-gap: 40px;
  row-gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
    padding: 24px;
  }
`

const Photo = styled.img`
  display: block;
  width: 260px;
  max-width: 100%;
  height: 260px;
  grid-column: 1;
  grid-row: 1;
  border-radius: 20px;
  object-fit: cover;
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  grid-column: 2;
  grid-row: 1;
  flex-direction: column;
  gap: 22px;

  @media (max-width: 980px) {
    grid-column: 1;
    grid-row: 2;
  }
`

const ActionSlot = styled.div`
  display: flex;
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  justify-self: end;

  @media (max-width: 980px) {
    grid-column: 1;
    grid-row: 2;
  }
`

// 우상단 케밥(44)과 겹치지 않게 오른쪽을 비운다.
const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 60px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
`

const Subtitle = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Dot = styled.span`
  width: 4px;
  height: 4px;
  flex: 0 0 4px;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.textFaint};
  font-size: 0;
`

const Details = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 24px;
  margin: 0;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Detail = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const DetailLabel = styled.dt`
  flex: 0 0 118px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const DetailValue = styled.dd`
  min-width: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.textValue};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
`

// 여러 개면 저장 순서대로 가로로 나열하고 넘치면 줄바꿈한다.
const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`
