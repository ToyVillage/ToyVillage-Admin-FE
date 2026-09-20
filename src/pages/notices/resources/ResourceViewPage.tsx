import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fileTypeLabel,
  getDocument,
  type ResourceFile,
} from '@/entities/resource'
import {
  AttachmentChip,
  BackLink,
  Toast,
  downloadStoredFile,
} from '@/shared/ui'

const downloadErrorMessage = '파일 다운로드에 실패했습니다. 다시 시도해 주세요.'

// `/notices/resources/:id` — 읽기 전용 자료 상세(Figma `resource detail` yot 246:12305).
// 수정은 목록 케밥의 `/notices/resources/:id/edit` 에서 한다.
export function ResourceViewPage() {
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(파일 유형·검색어·페이지)으로 돌아간다.
  const listState = location.state as { listSearch?: string } | null
  const listPath = `/notices/resources${listState?.listSearch ?? ''}`
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [downloadFailed, setDownloadFailed] = useState(false)

  const { data: resource, isError } = useQuery({
    queryKey: ['resources', id],
    queryFn: () => getDocument({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
    // 삭제된 자료로 다시 들어와도 stale 값이 보이지 않게 떠날 때 캐시를 버린다.
    gcTime: 0,
  })

  // 잘못된 id·404·조회 실패. 별도 '찾을 수 없음' 화면은 디자인에 없어 목록으로 되돌린다.
  useEffect(() => {
    if (!isError) return
    navigate(listPath, { replace: true })
  }, [isError, listPath, navigate])

  // 서버 첨부는 저장소 키가 있어야 내려받을 수 있다.
  const files = resource?.attachmentFiles ?? []

  async function handleDownload(file: ResourceFile) {
    try {
      await downloadStoredFile(file)
    } catch {
      setDownloadFailed(true)
    }
  }

  // 조회 전에는 같은 자리에 빈 카드를 두어 값이 와도 레이아웃이 튀지 않게 한다.
  return (
    <Page>
      <Content>
        <BackLink to={listPath} />

        <MetaCard>
          <MetaItem>
            <MetaLabel>분류</MetaLabel>
            {resource && <Pill>{fileTypeLabel[resource.fileType]}</Pill>}
          </MetaItem>
          <MetaItem>
            <MetaLabel>날짜</MetaLabel>
            <MetaDate>{resource?.date ?? ''}</MetaDate>
          </MetaItem>
        </MetaCard>

        <TitleCard>
          <Title>{resource?.title ?? ''}</Title>
        </TitleCard>

        <AttachmentCard aria-labelledby="resource-attachments-title">
          <AttachmentTitle id="resource-attachments-title">
            첨부자료
          </AttachmentTitle>
          {files.length > 0 && (
            <AttachmentRow>
              {files.map((file) => (
                <AttachmentChip
                  key={`${file.fileKey}:${file.fileName}`}
                  fileName={file.fileName}
                  onDownload={() => void handleDownload(file)}
                />
              ))}
            </AttachmentRow>
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

const TitleCard = styled(Card)`
  display: flex;
  min-height: 128px;
  flex-direction: column;
  margin-top: 32px;
  padding: 40px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;

  @media (max-width: 980px) {
    font-size: 32px;
  }
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
