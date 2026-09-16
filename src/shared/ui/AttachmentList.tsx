import styled from '@emotion/styled'
import { downloadStoredFile, type StoredFile } from './fileAttachment'

interface AttachmentListProps {
  files: StoredFile[]
  label?: string
  /** 파일 서버에서 받지 못했을 때 호출한다. 알림은 화면이 띄운다. */
  onDownloadError: (file: StoredFile) => void
}

// 조회 전용 첨부 목록(Figma 3350:3988: 삭제 아이콘 hidden, 업로드 드롭존 없음).
// 편집이 필요한 화면은 AttachmentField 를 쓴다.
export function AttachmentList({
  files,
  label = '첨부자료',
  onDownloadError,
}: AttachmentListProps) {
  function handleDownload(file: StoredFile) {
    downloadStoredFile(file).catch((error: unknown) => {
      // 화면에는 토스트만 뜬다. 설정 누락(VITE_FILE_BASE_URL) 같은 원인은 콘솔에 남긴다.
      console.error(error)
      onDownloadError(file)
    })
  }

  return (
    <Card role="group" aria-label={label}>
      <Title>{label}</Title>
      {files.length > 0 ? (
        <FileList>
          {files.map((file) => {
            const kind = fileKind(file.fileName)

            return (
              <FileChip key={file.fileKey}>
                <FileBadge data-kind={kind}>{kind.toUpperCase()}</FileBadge>
                <FileName>{file.fileName}</FileName>
                <DownloadButton
                  type="button"
                  aria-label={`${file.fileName} 다운로드`}
                  onClick={() => handleDownload(file)}
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

// Figma 는 gray/60 이지만 개발자 결정(2026-09-13)으로 검정을 쓴다. 업무 상세·업무보고 상세 공통.
const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
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
