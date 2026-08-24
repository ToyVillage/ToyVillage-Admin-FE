import styled from '@emotion/styled'

interface AttachmentListProps {
  fileNames: string[]
  label?: string
}

// 조회 전용 첨부 목록(Figma 3350:3988: 삭제 아이콘 hidden, 업로드 드롭존 없음).
// 편집이 필요한 화면은 AttachmentField 를 쓴다.
export function AttachmentList({
  fileNames,
  label = '첨부자료',
}: AttachmentListProps) {
  return (
    <Card role="group" aria-label={label}>
      <Title>{label}</Title>
      {fileNames.length > 0 ? (
        <FileList>
          {fileNames.map((fileName) => {
            const kind = fileKind(fileName)

            return (
              <FileChip key={fileName}>
                <FileBadge data-kind={kind}>{kind.toUpperCase()}</FileBadge>
                <FileName>{fileName}</FileName>
                <DownloadButton
                  type="button"
                  aria-label={`${fileName} 다운로드`}
                  onClick={() => downloadFile(fileName)}
                >
                  <DownloadIcon viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
                  </DownloadIcon>
                </DownloadButton>
              </FileChip>
            )
          })}
        </FileList>
      ) : (
        <EmptyText>첨부된 자료가 없습니다.</EmptyText>
      )}
    </Card>
  )
}

// mock 경계: 실제 파일 소스가 없어 파일명을 담은 임시 Blob 을 내려받는다.
function downloadFile(fileName: string) {
  const url = URL.createObjectURL(
    new Blob([`${fileName}\n`], { type: 'text/plain' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function fileKind(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'png') return 'png'
  if (extension === 'jpg' || extension === 'jpeg') return 'jpg'
  return 'file'
}

const Card = styled.section`
  display: flex;
  min-height: 140px;
  flex-direction: column;
  gap: 8px;
  padding: 24px 40px 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const FileList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const FileChip = styled.div`
  display: inline-flex;
  height: 56px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.textFaint};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`

const FileBadge = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.textGuide};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 8px;
  font-weight: 700;
  line-height: 1;

  &[data-kind='pdf'] {
    background: ${({ theme }) => theme.colors.primary};
  }

  &[data-kind='png'] {
    background: ${({ theme }) => theme.colors.filePng};
  }

  &[data-kind='jpg'] {
    background: ${({ theme }) => theme.colors.fileJpg};
  }
`

const FileName = styled.span`
  overflow: hidden;
  max-width: 230px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DownloadButton = styled.button`
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const DownloadIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
`

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 16px;
  font-weight: 500;
`
