import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  FieldSkeleton,
  FileDropZone,
  FormFieldLabel,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

const TYPE_WIDTHS = [30, 60, 30, 30]

// Figma `자료실 수정 (스켈레톤)`(2238:21937) — 폼 라벨·업로드 드롭존·`저장하기` 는 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function ResourceEditSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard>
          <FieldSkeleton label="제목" value={60} box required />
        </SkeletonCard>
        <SkeletonCard>
          <FormFieldLabel>분류</FormFieldLabel>
          <Pills>
            {TYPE_WIDTHS.map((width, index) => (
              <Pill key={index}>
                <Skeleton width={width} height={16} />
              </Pill>
            ))}
          </Pills>
        </SkeletonCard>
        <SkeletonCard>
          <FormFieldLabel>첨부자료</FormFieldLabel>
          <AttachmentChipsSkeleton />
        </SkeletonCard>
        <FileDropZone
          ariaLabel="파일 업로드"
          inputLabel="첨부파일 선택"
          multiple
          onFiles={() => {}}
        />
      </Cards>
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

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const Pill = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  padding: 0 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
