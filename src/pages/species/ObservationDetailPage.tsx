import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getIndividual, individualQueryKeys } from '@/entities/individual'
import {
  deleteObservation,
  formatObservationDate,
  getObservation,
  observationQueryKeys,
} from '@/entities/observation'
import { isNotFoundError } from '@/entities/species'
import {
  AttachmentChip,
  BackLink,
  DeleteConfirmationDialog,
  downloadStoredFile,
  KebabMenu,
  Toast,
  useFocusFrame,
} from '@/shared/ui'
import { PageStatus } from './ui/PageStatus'

// `/species/:speciesId/individuals/:individualId/observations/:observationId` — 읽기 전용 관찰 상세
// (Figma `observation detail` 1323:15015). 수정은 `…/edit`, 삭제는 제목 행 케밥이 맡는다.
export function ObservationDetailPage() {
  const { speciesId = '', individualId = '', observationId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deletingRef = useRef(false)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const focusFrame = useFocusFrame()

  const observationQuery = useQuery({
    queryKey: observationQueryKeys.detail(observationId),
    queryFn: () =>
      getObservation({
        animalManageId: Number(individualId),
        animalObservationId: Number(observationId),
      }),
    enabled: Boolean(observationId),
  })
  // 경로 체인(종 → 개체 → 관찰) 검증용.
  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(individualId),
    queryFn: () => getIndividual({ animalManageId: Number(individualId) }),
    enabled: Boolean(individualId),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteObservation({
        animalManageId: Number(individualId),
        animalObservationId: Number(observationId),
      }),
  })

  const individualPath = `/species/${speciesId}/individuals/${individualId}`

  const focusMenuTrigger = useCallback(() => {
    focusFrame(() => menuTriggerRef.current)
  }, [focusFrame])

  function handleDelete() {
    if (deletingRef.current || deleteMutation.isPending) return

    deletingRef.current = true
    deleteMutation.mutate(undefined, {
      // 삭제된 id 를 다시 조회하지 않게 단건 캐시를 먼저 제거한다(TaskDetailPage 규칙).
      onSuccess: () => {
        deletingRef.current = false
        navigate(individualPath, { state: { toast: 'delete-success' } })
        queryClient.removeQueries({
          queryKey: observationQueryKeys.detail(observationId),
        })
        void queryClient.invalidateQueries({
          queryKey: observationQueryKeys.all,
        })
      },
      onError: () => {
        deletingRef.current = false
        setDeleteDialogOpen(false)
        setDeleteFailed(true)
        focusMenuTrigger()
      },
    })
  }

  if (observationQuery.isPending || individualQuery.isPending) {
    return (
      <PageStatus state="loading" message="관찰 기록을 불러오는 중입니다." />
    )
  }

  if (
    [observationQuery, individualQuery].some(
      (query) => query.isError && !isNotFoundError(query.error),
    )
  ) {
    return (
      <PageStatus
        state="error"
        message="관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  const observation = observationQuery.data
  const individual = individualQuery.data
  if (
    observationQuery.isError ||
    individualQuery.isError ||
    !observation ||
    !individual ||
    observation.individualId !== individualId ||
    individual.speciesId !== speciesId
  ) {
    return (
      <PageStatus
        state="not-found"
        message="관찰 기록을 찾을 수 없습니다."
        linkTo={individualPath}
        linkLabel="개체 상세로 돌아가기"
      />
    )
  }

  return (
    <Page>
      <Content>
        <BackLink to={individualPath} />

        <TitleRow>
          <Title>{observation.title}</Title>
          <KebabMenu
            placement="below-trigger"
            ariaLabel={`${observation.title} 관찰 기록 메뉴 열기`}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onTriggerRef={(node) => {
              menuTriggerRef.current = node
            }}
            items={[
              {
                label: '수정',
                onSelect: () =>
                  navigate(
                    `${individualPath}/observations/${observationId}/edit`,
                  ),
              },
              {
                label: '삭제',
                tone: 'danger',
                onSelect: () => setDeleteDialogOpen(true),
              },
            ]}
          />
        </TitleRow>

        <Meta>
          <VisuallyHidden as="dt">관찰 날짜</VisuallyHidden>
          <MetaValue>
            <time dateTime={observation.observedAt}>
              {formatObservationDate(observation.observedAt)}
            </time>
          </MetaValue>
          <VisuallyHidden as="dt">관찰자</VisuallyHidden>
          <MetaValue>{observation.observerName}</MetaValue>
        </Meta>

        <Cards>
          <SectionCard>
            <SectionLabel>관찰사항</SectionLabel>
            <ContentText>{observation.content}</ContentText>
          </SectionCard>

          <SectionCard>
            <SectionLabel>첨부</SectionLabel>
            {observation.attachments.length > 0 ? (
              <ChipList>
                {observation.attachments.map((attachment) => (
                  <AttachmentChip
                    key={attachment.fileKey}
                    fileName={attachment.fileName}
                    onDownload={() =>
                      downloadStoredFile(attachment).then(
                        () => setDownloadFailed(false),
                        () => setDownloadFailed(true),
                      )
                    }
                  />
                ))}
              </ChipList>
            ) : (
              <EmptyMark>—</EmptyMark>
            )}
          </SectionCard>
        </Cards>
      </Content>

      {deleteDialogOpen && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            setDeleteDialogOpen(false)
            focusMenuTrigger()
          }}
          onConfirm={handleDelete}
        />
      )}

      {downloadFailed && (
        <Toast
          variant="error"
          message="파일 다운로드에 실패했습니다"
          onDismiss={() => setDownloadFailed(false)}
        />
      )}

      {deleteFailed && (
        <Toast
          variant="error"
          message="데이터 삭제에 실패했습니다"
          onDismiss={() => setDeleteFailed(false)}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

// Figma 뒤로가기 @y75 → 제목 @y144(33px) → 날짜·관찰자 @y204(12px) → 카드 @y260(27px).
const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

// 케밥 메뉴는 이 행의 오른쪽 끝(= 본문 오른쪽 끝)에 맞춰 열린다.
// 케밥(44×52)은 제목 윗변보다 4px 아래에 두고, 행 높이는 제목(48)을 따른다.
const TitleRow = styled.div`
  position: relative;
  display: flex;
  align-self: stretch;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-top: 33px;

  > :last-child {
    margin: 4px 0 -8px;
  }
`

// 제목은 자르지 않고 줄바꿈한다(상세는 전체 제목을 볼 수 있는 유일한 화면).
const Title = styled.h1`
  min-width: 0;
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

const Meta = styled.dl`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  margin: 12px 0 0;
`

const MetaValue = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`

const Cards = styled.div`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  gap: 16px;
  margin-top: 27px;
`

// Figma `관찰사항`(1323:15038)·`첨부`(1323:15043) 카드 — FRAME 이라 페이지 로컬로 둔다.
const SectionCard = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const SectionLabel = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

// 입력한 줄바꿈을 보존하고 긴 단어는 카드 폭 안에서 끊는다(task-report 상세 내용 카드 규칙).
const ContentText = styled.p`
  align-self: stretch;
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`

// 칩이 여러 개면 가로로 나열하고 넘치면 다음 줄로 넘긴다(AttachmentList 배치, 간격 16px).
const ChipList = styled.div`
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  gap: 16px;
`

const EmptyMark = styled.span`
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
