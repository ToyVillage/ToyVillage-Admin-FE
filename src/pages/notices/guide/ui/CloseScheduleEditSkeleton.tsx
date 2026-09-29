import styled from '@emotion/styled'
import { FieldSkeleton, SkeletonCard, SkeletonStatus } from '@/shared/ui'

// Figma `휴관일 수정 (스켈레톤)`(2238:21879) — 폼 라벨·`저장하기` 는 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 `CloseScheduleFormPage` 가 그린다.
export function CloseScheduleEditSkeleton() {
  return (
    <SkeletonStatus>
      <Dates>
        <SkeletonCard>
          <FieldSkeleton label="시작일" value={140} box />
        </SkeletonCard>
        <SkeletonCard>
          <FieldSkeleton label="종료일" value={140} box />
        </SkeletonCard>
      </Dates>
      <Reason>
        <SkeletonCard>
          <FieldSkeleton label="제목" value={200} box required />
        </SkeletonCard>
      </Reason>
      <Footer>
        <SaveButton type="button" disabled>
          저장하기
        </SaveButton>
      </Footer>
    </SkeletonStatus>
  )
}

// 실제 폼의 `저장하기` 와 같은 모양. 조회 중에는 누를 수 없다.
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

const Dates = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 420px));
  gap: 20px;
`

const Reason = styled.div`
  margin-top: 24px;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
