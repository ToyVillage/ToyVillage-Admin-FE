import { useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { formatIsoDate } from '@/shared/lib'
import {
  getNotice,
  isNoticeNotFoundError,
  noticeCategoryLabel,
  type NoticeAttachmentFile,
} from '@/entities/notice'
import {
  AttachmentChip,
  BackLink,
  Toast,
  downloadStoredFile,
} from '@/shared/ui'
import { NoticeDetailSkeleton } from './ui/NoticeDetailSkeleton'

const downloadErrorMessage = '파일 다운로드에 실패했습니다. 다시 시도해 주세요.'

// `/notices/list/:id` — 읽기 전용 공지 상세(Figma `notification detail` yot 219:11825,
// 첨부 없음 221:12475). 수정은 목록 케밥의 `/notices/list/:id/edit` 에서 한다.
export function NoticeDetailPage() {
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(분류·검색어·정렬·페이지)으로 돌아간다.
  const listState = location.state as { listSearch?: string } | null
  const listPath = `/notices/list${listState?.listSearch ?? ''}`
  const { id = '' } = useParams()
  const noticeId = parseNoticeId(id)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const {
    data: notice,
    error,
    isError,
    isPending,
  } = useQuery({
    queryKey: ['notices', id],
    queryFn: () => {
      if (noticeId === null) {
        throw new Error('공지사항 ID가 올바르지 않습니다.')
      }

      return getNotice({ id: noticeId })
    },
    enabled: noticeId !== null,
  })

  const isNotFound =
    noticeId === null || (isError && isNoticeNotFoundError(error))

  if (isNotFound) {
    return (
      <StatePage>
        <StateCard>
          <StateTitle>공지사항을 찾을 수 없습니다.</StateTitle>
          <StateLink to={listPath}>공지사항 목록으로 돌아가기</StateLink>
        </StateCard>
      </StatePage>
    )
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <NoticeDetailSkeleton />
        </Content>
      </Page>
    )
  }

  if (isError || !notice) {
    return (
      <StatePage>
        <StateCard role="alert">
          <StateTitle>공지사항을 불러오지 못했습니다.</StateTitle>
          <StateDescription>다시 시도해 주세요.</StateDescription>
          <StateLink to={listPath}>공지사항 목록으로 돌아가기</StateLink>
        </StateCard>
      </StatePage>
    )
  }

  // 서버 첨부는 저장소 키가 있어야 내려받을 수 있다.
  const files = notice.attachmentFiles ?? []

  async function handleDownload(file: NoticeAttachmentFile) {
    try {
      await downloadStoredFile(file)
    } catch {
      setDownloadFailed(true)
    }
  }

  return (
    <Page>
      <Content>
        <BackLink to={listPath} />

        <MetaCard>
          <MetaItem>
            <MetaLabel>분류</MetaLabel>
            <Pill>{noticeCategoryLabel(notice.teams)}</Pill>
          </MetaItem>
          <MetaItem>
            <MetaLabel>날짜</MetaLabel>
            <MetaDate>{formatIsoDate(notice.date)}</MetaDate>
          </MetaItem>
        </MetaCard>

        <BodyCard>
          <Title>{notice.title}</Title>
          <Body>{notice.content}</Body>
        </BodyCard>

        <AttachmentCard aria-labelledby="notice-attachments-title">
          <AttachmentTitle id="notice-attachments-title">
            첨부자료
          </AttachmentTitle>
          {files.length > 0 ? (
            <AttachmentRow>
              {files.map((file) => (
                <AttachmentChip
                  key={`${file.fileKey}:${file.fileName}`}
                  fileName={file.fileName}
                  onDownload={() => void handleDownload(file)}
                />
              ))}
            </AttachmentRow>
          ) : (
            <EmptyAttachment>등록된 자료가 없습니다.</EmptyAttachment>
          )}
        </AttachmentCard>
      </Content>

      {downloadFailed && (
        <Toast
          variant="error"
          message={downloadErrorMessage}
          onDismiss={() => setDownloadFailed(false)}
        />
      )}
    </Page>
  )
}

function parseNoticeId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 66px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

// Figma: 뒤로가기 top 76, 메타 카드 top 172, 이후 카드 간격 32.
const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 76px;

  @media (max-width: 980px) {
    padding-top: 64px;
  }
`

const Card = styled.section`
  box-sizing: border-box;
  width: 100%;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const MetaCard = styled(Card)`
  display: flex;
  min-height: 140px;
  align-items: flex-start;
  margin-top: 60px;
  padding: 36px 40px 24px;

  @media (max-width: 980px) {
    flex-wrap: wrap;
    gap: 20px 40px;
  }
`

// 분류 칸 400(40 + 360), 날짜는 x=440 에서 시작한다.
const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;

  &:first-of-type {
    width: 400px;

    @media (max-width: 980px) {
      width: auto;
    }
  }
`

const MetaLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 25px;
  background: ${({ theme }) => theme.colors.primaryBg};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const MetaDate = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const BodyCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 32px;
  padding: 40px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;

  @media (max-width: 980px) {
    font-size: 32px;
  }
`

const Body = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`

const AttachmentCard = styled(Card)`
  display: flex;
  min-height: 140px;
  flex-direction: column;
  gap: 10px;
  margin-top: 32px;
  padding: 24px 40px;
`

const AttachmentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma 칩 x 좌표 40/260/480 — 칩 폭이 파일명에 따라 달라 간격 대신 여유를 둔 gap 으로 나열한다.
const AttachmentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 26px;
`

const EmptyAttachment = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  width: min(100%, 560px);
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const StateTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
`

const StateDescription = styled.p`
  margin: 12px 0 0;
`

const StateLink = styled(Link)`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  margin-top: 28px;
  padding: 0 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  text-decoration: none;
`
