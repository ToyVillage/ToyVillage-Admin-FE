import styled from '@emotion/styled'
import { Skeleton, SkeletonCard, SkeletonStatus } from '@/shared/ui'

const QUESTION_OPTIONS = [3, 3, 1]

// Figma `업무일지 양식 상세 (스켈레톤)`(2238:20430) — 뒤로가기·`양식명` 라벨은 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function WorkLogFormDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard>
          <TitleLabel>
            양식명<Required aria-hidden="true"> *</Required>
          </TitleLabel>
          <Skeleton width={80} height={36} />
        </SkeletonCard>
        {QUESTION_OPTIONS.map((options, index) => (
          <SkeletonCard key={index} gap={24}>
            <QuestionRow>
              <Input>
                <Skeleton width={60} height={16} />
              </Input>
              <TypeBox>
                <Skeleton width={90} height={16} />
              </TypeBox>
            </QuestionRow>
            {Array.from({ length: options }, (_, optionIndex) => (
              <Option key={optionIndex}>
                <Skeleton width={20} height={20} />
                <Skeleton width={optionIndex === 1 ? 70 : 50} height={16} />
              </Option>
            ))}
          </SkeletonCard>
        ))}
      </Cards>
    </SkeletonStatus>
  )
}

// 실제 양식 상세의 `양식명 *` 라벨과 같은 글자.
const TitleLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 40px;
`

const QuestionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 40px;
`

const Input = styled.div`
  display: flex;
  height: 64px;
  align-items: center;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.background};
`

const TypeBox = styled(Input)``

const Option = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
`
