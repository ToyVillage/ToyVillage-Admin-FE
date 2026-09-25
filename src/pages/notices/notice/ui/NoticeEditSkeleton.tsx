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

const CATEGORY_WIDTHS = [64, 48, 72, 56, 60]

// Figma `공지사항 수정 (스켈레톤)`(2238:21809) — 뒤로가기·폼 라벨·`전체` 탭·업로드 드롭존·
// `저장하기` 는 실제 UI 이고 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function NoticeEditSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard>
          <FieldSkeleton label="제목" value={180} box />
        </SkeletonCard>
        <SkeletonCard>
          <FormFieldLabel>분류</FormFieldLabel>
          <Pills>
            <SelectedPill>전체</SelectedPill>
            {CATEGORY_WIDTHS.map((width, index) => (
              <Pill key={index}>
                <Skeleton width={width} height={16} />
              </Pill>
            ))}
          </Pills>
        </SkeletonCard>
        <SkeletonCard>
          <FieldSkeleton
            label="상세 업무 내용"
            value={900}
            box
            boxHeight={160}
            required
          />
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

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 64px;
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

// 서버 목록이 없어도 늘 있는 `전체` 칩은 실제 글자로 둔다.
const SelectedPill = styled(Pill)`
  color: ${({ theme }) => theme.colors.text};
  font-size: 16px;
  font-weight: 500;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`

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
