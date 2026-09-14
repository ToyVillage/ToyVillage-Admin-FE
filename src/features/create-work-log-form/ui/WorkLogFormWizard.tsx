import { useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useNavigate } from 'react-router-dom'
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
import {
  appendZones,
  hasDraftErrors,
  validateDraft,
} from '../model/draft'
import { WorkLogFormStepOne } from './WorkLogFormStepOne'
import { WorkLogZoneEditor } from './WorkLogZoneEditor'

interface WorkLogFormWizardProps {
  initialDraft: WorkLogFormDraft
  // 2단계 주요 액션 문구. 생성은 `생성하기`, 수정은 `저장하기`.
  submitLabel: string
  // 수정 화면만 1단계에도 저장 버튼을 둔다(Figma 1:4241).
  showStepOneSubmit: boolean
  pending: boolean
  listPath: string
  // 뒤로가기에서 나가기 확인 모달을 띄울지 판정한다.
  isLeaveConfirmNeeded: (draft: WorkLogFormDraft) => boolean
  onSubmit: (draft: WorkLogFormDraft) => void
}

const emptyErrors: WorkLogFormDraftErrors = { questions: {} }
const zoneRequiredMessage = '구역 번호를 설정해주세요'

// Figma 353:13063 "업무일지관리 · 양식" — 생성·수정이 공유하는 2단계 위저드.
export function WorkLogFormWizard({
  initialDraft,
  submitLabel,
  showStepOneSubmit,
  pending,
  listPath,
  isLeaveConfirmNeeded,
  onSubmit,
}: WorkLogFormWizardProps) {
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState(emptyErrors)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [zoneRequiredOpen, setZoneRequiredOpen] = useState(false)
  const [zoneToRemove, setZoneToRemove] = useState<WorkLogFormZone | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

  function handleDraftChange(next: WorkLogFormDraft) {
    setDraft(next)
    // 고치는 즉시 해당 자리의 에러 표시를 해제한다(spec 1단계 검증).
    if (hasDraftErrors(errors)) setErrors(pruneErrors(errors, validateDraft(next)))
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
    setStep(2)
    window.scrollTo({ top: 0 })
  }

  function handleSubmit() {
    if (!runStepOneValidation()) {
      // 2단계에서 저장하다 1단계 값이 걸리면 에러가 보이는 자리로 되돌린다.
      setStep(1)
      return
    }
    if (draft.zones.length === 0) {
      setZoneRequiredOpen(true)
      return
    }
    onSubmit(draft)
  }

  function handleBack(event: { preventDefault: () => void }) {
    event.preventDefault()

    if (step === 2) {
      setStep(1)
      window.scrollTo({ top: 0 })
      return
    }

    if (isLeaveConfirmNeeded(draft)) {
      setLeaveOpen(true)
      return
    }

    navigate(listPath)
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
        <BackLink to={listPath} onClick={handleBack} />

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
            setStep(2)
          }}
        />
      )}
      {leaveOpen && (
        <LeaveConfirmationDialog
          onCancel={() => setLeaveOpen(false)}
          onConfirm={() => navigate(listPath)}
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
  return { name: shown.name && current.name ? current.name : undefined, questions }
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
