import { useCallback } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getIndividual, individualQueryKeys } from '@/entities/individual'
import { getObservation, observationQueryKeys } from '@/entities/observation'
import {
  getSpecies,
  isNotFoundError,
  speciesQueryKeys,
} from '@/entities/species'
import { ObservationForm } from '@/features/observation-form'
import { BackLink, LeaveConfirmationDialog } from '@/shared/ui'
import { PageStatus } from './ui/PageStatus'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

// `/species/:speciesId/individuals/:individualId/observations/:observationId/edit` — 관찰 수정
// (Figma `observation edit` 1282:15007). 관찰 상세 제목 행 케밥·개체 상세 관찰 표 행 케밥 `수정` 에서 들어온다.
export function EditObservationPage() {
  const { speciesId = '', individualId = '', observationId = '' } = useParams()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()

  const observationQuery = useQuery({
    queryKey: observationQueryKeys.detail(observationId),
    queryFn: () =>
      getObservation({
        animalManageId: Number(individualId),
        animalObservationId: Number(observationId),
      }),
    enabled: Boolean(observationId),
  })
  // 경로 체인 검증과 부제(`{종 국명} · {개체명}`)에 쓴다.
  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(individualId),
    queryFn: () => getIndividual({ animalManageId: Number(individualId) }),
    enabled: Boolean(individualId),
  })
  const speciesQuery = useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getSpecies({ animalKindId: Number(speciesId) }),
    enabled: Boolean(speciesId),
  })

  const individualPath = `/species/${speciesId}/individuals/${individualId}`
  const detailPath = `${individualPath}/observations/${observationId}`

  // 저장 결과는 상세 화면에서 확인한다(spec 결정 사항 — 수정 성공 토스트 없음).
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(detailPath)
  }, [allowNavigation, detailPath, navigate])

  if (
    observationQuery.isPending ||
    individualQuery.isPending ||
    speciesQuery.isPending
  ) {
    return (
      <PageStatus state="loading" message="관찰 기록을 불러오는 중입니다." />
    )
  }

  if (
    [observationQuery, individualQuery, speciesQuery].some(
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
  const species = speciesQuery.data
  if (
    observationQuery.isError ||
    individualQuery.isError ||
    speciesQuery.isError ||
    !observation ||
    !individual ||
    !species ||
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
        <BackLink to={detailPath} />
        <Header>
          <Title>관찰 및 특이사항</Title>
          <Subtitle>
            {species.koreanName} · {individual.name}의 정보를 수정합니다
          </Subtitle>
        </Header>
        <ObservationForm
          observation={observation}
          onCompleted={handleCompleted}
          onDirtyChange={setIsDirty}
        />
      </Content>
      {blocker.state === 'blocked' && (
        <LeaveConfirmationDialog
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
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

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

// Figma 뒤로가기 하단(111) → 제목 33px, 제목 → 부제 8px, 부제 하단(229) → 폼 31px.
const Header = styled.header`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  gap: 8px;
  margin: 33px 0 31px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;

  @media (max-width: 980px) {
    font-size: 32px;
    line-height: 40px;
  }
`

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 29px;

  @media (max-width: 980px) {
    font-size: 20px;
    line-height: 24px;
  }
`
