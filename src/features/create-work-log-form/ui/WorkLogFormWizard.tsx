import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import type {
  WorkLogFormDraft,
  WorkLogFormDraftErrors,
  WorkLogFormZone,
} from '@/entities/work-log'
import { WorkLogFormWizardSteps } from '@/entities/work-log'
import {
  ActionButton,
  BackLink,
  DeleteConfirmationDialog,
  LeaveConfirmationDialog,
  ValidationDialog,
} from '@/shared/ui'
import { appendZones, hasDraftErrors, validateDraft } from '../model/draft'
import { WorkLogFormStepOne } from './WorkLogFormStepOne'
import { WorkLogZoneEditor } from './WorkLogZoneEditor'

interface WorkLogFormWizardProps {
  initialDraft: WorkLogFormDraft
  // 1단계 경로. 2단계는 여기에 `/zones` 가 붙는다.
  basePath: string
  // 2단계 주요 액션 문구. 생성은 `생성하기`, 수정은 `저장하기`.
  submitLabel: string
  // 수정 화면만 1단계에도 저장 버튼을 둔다(Figma 1:4241).
  showStepOneSubmit: boolean
  pending: boolean
  // 초안을 아직 불러오는 중인지(수정 화면). 불러오는 동안에는 단계 가드를 걸지 않는다.
  loading?: boolean
  listPath: string
  // 뒤로가기에서 나가기 확인 모달을 띄울지 판정한다.
  isLeaveConfirmNeeded: (draft: WorkLogFormDraft) => boolean
  onSubmit: (draft: WorkLogFormDraft) => void
}

const emptyErrors: WorkLogFormDraftErrors = { questions: {} }
const zoneRequiredMessage = '구역 번호를 설정해주세요'
const zonesSegment = '/zones'

// Figma 353:13063 "업무일지관리 · 양식" — 생성·수정이 공유하는 2단계 위저드.
// 단계는 URL 로 구분해 브라우저 앞/뒤로가기가 그대로 통하게 한다.
export function WorkLogFormWizard({
  initialDraft,
  basePath,
  submitLabel,
  showStepOneSubmit,
  pending,
  loading = false,
  listPath,
  isLeaveConfirmNeeded,
  onSubmit,
}: WorkLogFormWizardProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const contentRef = useRef<HTMLDivElement>(null)
  const allowNavigationRef = useRef(false)
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState(emptyErrors)
  const [zoneRequiredOpen, setZoneRequiredOpen] = useState(false)
  const [zoneToRemove, setZoneToRemove] = useState<WorkLogFormZone | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  const zonesPath = `${basePath}${zonesSegment}`
  const step = pathname === zonesPath ? 2 : 1
  const needsLeaveConfirm = isLeaveConfirmNeeded(draft)

  // 위저드 안에서의 단계 이동은 막지 않는다. 화면 밖으로 나갈 때만 확인한다.
  const blocker = useBlocker(
    useCallback(
      ({ nextLocation }) => {
        if (allowNavigationRef.current || !needsLeaveConfirm) return false
        return (
          nextLocation.pathname !== basePath &&
          nextLocation.pathname !== zonesPath
        )
      },
      [basePath, needsLeaveConfirm, zonesPath],
    ),
  )

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!needsLeaveConfirm || allowNavigationRef.current) return
        event.preventDefault()
        event.returnValue = ''
      },
      [needsLeaveConfirm],
    ),
  )

  // 저장이 실패해 화면에 남았으면 이탈 확인을 다시 켠다.
  useEffect(() => {
    if (!pending) allowNavigationRef.current = false
  }, [pending])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  // `/zones` 로 바로 들어오거나 새로고침하면 1단계 값이 없는 채로 2단계가 열린다.
  // 그 상태로는 저장할 수 없으므로 1단계로 되돌린다.
  const stepOneReady = !hasDraftErrors(validateDraft(draft))
  useEffect(() => {
    if (loading || step !== 2 || stepOneReady) return
    navigate(basePath, { replace: true })
    // stepOneReady 는 진입 시점 판정에만 쓴다. 2단계에서는 1단계 값을 고칠 수 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, step])

  function handleDraftChange(next: WorkLogFormDraft) {
    setDraft(next)
    // 고치는 즉시 해당 자리의 에러 표시를 해제한다(spec 1단계 검증).
    if (hasDraftErrors(errors)) {
      setErrors(pruneErrors(errors, validateDraft(next)))
    }
  }

  function runStepOneValidation(): boolean {
    const next = validateDraft(draft)
    setErrors(next)
    if (!hasDraftErrors(next)) return true

    const firstInvalid = contentRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    )
    firstInvalid?.focus()
    firstInvalid?.scrollIntoView({ block: 'center' })
    return false
  }

  function handleNext() {
    if (!runStepOneValidation()) return
    navigate(zonesPath)
  }

  function handleSubmit() {
    if (!runStepOneValidation()) {
      // 2단계에서 저장하다 1단계 값이 걸리면 에러가 보이는 자리로 되돌린다.
      if (step === 2) navigate(basePath)
      return
    }
    if (draft.zones.length === 0) {
      setZoneRequiredOpen(true)
      return
    }
    allowNavigationRef.current = true
    onSubmit(draft)
  }

  function removeZone(zone: WorkLogFormZone) {
    setDraft((prev) => ({
      ...prev,
      zones: prev.zones.filter((item) => item.id !== zone.id),
    }))
  }

  return (
    <Page>
      <Steps>
        <WorkLogFormWizardSteps current={step} />
      </Steps>
      <Content ref={contentRef}>
        <BackLink to={step === 2 ? basePath : listPath} />

        <Body>
          {step === 1 ? (
            <WorkLogFormStepOne
              draft={draft}
              errors={errors}
              onChange={handleDraftChange}
            />
          ) : (
            <WorkLogZoneEditor
              zones={draft.zones}
              onAdd={(labels) =>
                setDraft((prev) => ({
                  ...prev,
                  zones: appendZones(prev.zones, labels),
                }))
              }
              onRemove={(zone) =>
                zone.persisted ? setZoneToRemove(zone) : removeZone(zone)
              }
              onClearAll={() => setClearAllOpen(true)}
            />
          )}
        </Body>

        <Actions>
          {step === 1 && (
            <ActionButton disabled={pending} onClick={handleNext}>
              다음
            </ActionButton>
          )}
          {(step === 2 || showStepOneSubmit) && (
            <ActionButton disabled={pending} onClick={handleSubmit}>
              {submitLabel}
            </ActionButton>
          )}
        </Actions>
      </Content>

      {zoneRequiredOpen && (
        <ValidationDialog
          message={zoneRequiredMessage}
          onConfirm={() => {
            setZoneRequiredOpen(false)
            if (step === 1) navigate(zonesPath)
          }}
        />
      )}
      {blocker.state === 'blocked' && (
        <LeaveConfirmationDialog
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
        />
      )}
      {zoneToRemove && (
        <DeleteConfirmationDialog
          pending={false}
          onCancel={() => setZoneToRemove(null)}
          onConfirm={() => {
            removeZone(zoneToRemove)
            setZoneToRemove(null)
          }}
        />
      )}
      {clearAllOpen && (
        <DeleteConfirmationDialog
          pending={false}
          onCancel={() => setClearAllOpen(false)}
          onConfirm={() => {
            setDraft((prev) => ({ ...prev, zones: [] }))
            setClearAllOpen(false)
          }}
        />
      )}
    </Page>
  )
}

// 이전에 표시한 에러 중 아직도 유효한 것만 남긴다. 새 에러를 먼저 띄우지는 않는다.
function pruneErrors(
  shown: WorkLogFormDraftErrors,
  current: WorkLogFormDraftErrors,
): WorkLogFormDraftErrors {
  const questions: Record<string, string> = {}
  for (const id of Object.keys(shown.questions)) {
    if (current.questions[id]) questions[id] = current.questions[id]
  }
  return {
    name: shown.name && current.name ? current.name : undefined,
    emptyQuestions:
      shown.emptyQuestions && current.emptyQuestions
        ? current.emptyQuestions
        : undefined,
    questions,
  }
}

const Page = styled.main`
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  font-family: ${({ theme }) => theme.font.body};
`

// Figma: 스텝 인디케이터 y=60, 뒤로가기 y=190. 페이지 padding 32 를 뺀 값으로 맞춘다.
const Steps = styled.div`
  margin-top: calc(60px - 32px);
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: calc(190px - 60px - 103px);
`

const Body = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-top: 20px;
`

const Actions = styled.div`
  display: flex;
  align-self: flex-end;
  align-items: center;
  gap: 24px;
  margin-top: 80px;
`
