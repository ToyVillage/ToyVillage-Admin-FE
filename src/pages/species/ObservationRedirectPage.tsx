import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { getIndividual, individualQueryKeys } from '@/entities/individual'
import { isNotFoundError } from '@/entities/species'
import { PageStatus } from './ui/PageStatus'

// `/individuals/:individualId/observations/:observationId` — 종 ID 를 모르는 곳(대시보드)에서 여는 관찰 경로.
// 개체를 조회해 종 ID 를 얻은 뒤 관찰 상세로 replace 이동한다. 관찰·경로 체인 검증은 상세 화면이 맡는다.
export function ObservationRedirectPage() {
  const { individualId = '', observationId = '' } = useParams()
  const validIds = isPositiveId(individualId) && isPositiveId(observationId)

  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(individualId),
    queryFn: () => getIndividual({ animalManageId: Number(individualId) }),
    enabled: validIds,
  })

  if (
    !validIds ||
    (individualQuery.isError && isNotFoundError(individualQuery.error))
  ) {
    return (
      <PageStatus
        state="not-found"
        message="관찰 기록을 찾을 수 없습니다."
        linkTo="/species"
        linkLabel="종 목록으로 돌아가기"
      />
    )
  }

  if (individualQuery.isError) {
    return (
      <PageStatus
        state="error"
        message="관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  if (individualQuery.isPending) {
    return (
      <PageStatus state="loading" message="관찰 기록을 불러오는 중입니다." />
    )
  }

  return (
    <Navigate
      replace
      to={`/species/${individualQuery.data.speciesId}/individuals/${individualId}/observations/${observationId}`}
    />
  )
}

function isPositiveId(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}
