import styled from '@emotion/styled'
import { FieldSkeleton, Skeleton, SkeletonStatus } from '@/shared/ui'

// 섹션 제목과 입력 라벨(실제 `ReservationForm` 과 같은 문구).
const SECTIONS: { title: string; labels: string[] }[] = [
  {
    title: '상담일 관련',
    labels: [
      '단체명',
      '지역',
      '상담일을 선택해주세요',
      '예약인 이름',
      '대표자 연락처를 입력해주세요',
    ],
  },
  {
    title: '방문일 관련',
    labels: [
      '총 인원',
      '인솔자 인원',
      '입장료를 입력해주세요',
      '방문일을 선택해주세요',
      '방문 시간을 선택해주세요',
    ],
  },
  {
    title: '사전답사 관련',
    labels: [
      '사전답사 인원',
      '사전답사일을 선택해주세요',
      '사전답사 시간을 선택해주세요',
    ],
  },
]

// Figma `단체예약 수정 (스켈레톤)`(2238:21994) — 섹션 제목·입력 라벨·`저장하기` 는 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function ReservationEditSkeleton() {
  return (
    <SkeletonStatus>
      <Sections>
        {SECTIONS.map((section) => (
          <Section key={section.title}>
            <SectionHeader>
              <SectionTitle>{section.title}</SectionTitle>
            </SectionHeader>
            <Grid>
              {section.labels.map((label, index) => (
                <FieldSkeleton
                  key={label}
                  label={label}
                  value={index % 3 === 0 ? 120 : 80}
                  box
                  boxHeight={48}
                />
              ))}
            </Grid>
          </Section>
        ))}
        <Section>
          <SectionHeader>
            <SectionTitle>페이지 권한</SectionTitle>
          </SectionHeader>
          <Body>
            <SearchBox>
              <Skeleton width={120} height={16} />
            </SearchBox>
            <Center>
              <Skeleton width={180} height={16} />
            </Center>
          </Body>
        </Section>
      </Sections>
      <Footer>
        <SaveButton type="button" disabled>
          저장하기
        </SaveButton>
      </Footer>
    </SkeletonStatus>
  )
}

// 실제 폼의 섹션 제목·`저장하기` 와 같은 글자·모양.
const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`

const SaveButton = styled.button`
  height: 56px;
  padding: 0 32px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  font-weight: 600;
`

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 32px;
`

const Section = styled.div`
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const SectionHeader = styled.div`
  display: flex;
  height: 72px;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px 40px;
  padding: 32px 40px 40px;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 32px 40px 48px;
`

const SearchBox = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  padding: 0 24px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const Center = styled.div`
  display: flex;
  justify-content: center;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
