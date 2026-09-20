import styled from '@emotion/styled'
import { FieldSkeleton, Skeleton, SkeletonStatus } from '@/shared/ui'

// 섹션별 입력칸 수(Figma `단체예약 수정 (스켈레톤)` 2021:22902 — 기본·예약·담당·권한 4섹션).
const SECTION_FIELDS = [5, 6, 4]

export function ReservationEditSkeleton() {
  return (
    <SkeletonStatus>
      <Sections>
        {SECTION_FIELDS.map((fields, sectionIndex) => (
          <Section key={sectionIndex}>
            <SectionHeader>
              <Skeleton width={sectionIndex === 0 ? 120 : 70} height={20} />
              <Skeleton width={16} height={16} />
            </SectionHeader>
            <Grid>
              {Array.from({ length: fields }, (_, index) => (
                <FieldSkeleton
                  key={index}
                  label={index % 2 === 0 ? 90 : 60}
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
            <Skeleton width={70} height={20} />
            <Skeleton width={16} height={16} />
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
        <Skeleton width={120} height={56} radius={12} />
      </Footer>
    </SkeletonStatus>
  )
}

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
