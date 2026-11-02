import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  feedQueryKeys,
  feedUnitLabels,
  formatAmountNumber,
  formatAnimalLabel,
  formatFedAt,
  formatFedDate,
  updateFloorFeed,
  type FeedRecordDetail,
} from '@/entities/feed'
import { FormFieldCard, scrollToFirstFieldError } from '@/shared/ui'
import type { FeedFormErrors, FeedFormValues } from '../model/types'
import {
  parseFeedAmount,
  parseRemainingAmount,
  sanitizeFeedAmountInput,
  validateFeedForm,
} from '../model/validation'

const feedTypeErrorId = 'feed-type-error'
const feedAmountErrorId = 'feed-amount-error'
const remainingAmountErrorId = 'remaining-amount-error'

interface FeedFormProps {
  feed: FeedRecordDetail
  /** 저장 성공 — 페이지가 이탈 보호를 해제하고 들어온 화면으로 이동한다. */
  onCompleted: () => void
  onDirtyChange: (isDirty: boolean) => void
}

// Figma `feeding correction`(4층 2429:24034 / 5층 3130:25801). 층의 앱 입력 칸만 고친다.
// 4층: 먹이 종류·급여량·잔량·특이사항 / 5층: 먹이 종류·급여량.
// 대상 개체·급여 시각·급여자는 읽기 전용이다. 필수 오류는 카드 아래 인라인 줄로 보인다.
export function FeedForm({ feed, onCompleted, onDirtyChange }: FeedFormProps) {
  const queryClient = useQueryClient()
  const submittingRef = useRef(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const isFloorFour = feed.floor === '4'
  // 단위는 기록의 원래 단위로 입력칸 뒤에 고정한다(`200 g/ml`).
  const unitLabel = feedUnitLabels[feed.unit]
  // 급여량은 숫자만 편집한다.
  const initialFeedAmount = formatAmountNumber(feed.feedAmount)
  // 잔량이 없는 기록(잔량 도입 전)은 빈 칸으로 시작해 저장 전에 입력받는다.
  const initialRemainingAmount =
    feed.remainingAmount === null
      ? ''
      : formatAmountNumber(feed.remainingAmount)
  const [feedType, setFeedType] = useState(feed.feedType)
  const [feedAmount, setFeedAmount] = useState(initialFeedAmount)
  const [remainingAmount, setRemainingAmount] = useState(initialRemainingAmount)
  const [note, setNote] = useState(feed.note)
  const [errors, setErrors] = useState<FeedFormErrors>({})

  const mutation = useMutation({ mutationFn: updateFloorFeed })

  // 원래 값으로 되돌리면 바뀌지 않은 것으로 본다.
  useEffect(() => {
    onDirtyChange(
      feedType !== feed.feedType ||
        feedAmount !== initialFeedAmount ||
        remainingAmount !== initialRemainingAmount ||
        note !== feed.note,
    )
  }, [
    feed,
    feedAmount,
    feedType,
    initialFeedAmount,
    initialRemainingAmount,
    note,
    onDirtyChange,
    remainingAmount,
  ])

  // Figma 특이사항 입력 160px 를 최소 높이로 두고, 내용이 늘면 박스가 함께 늘어난다.
  useEffect(() => {
    const element = noteRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [note])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || mutation.isPending) return

    const values: FeedFormValues = {
      feedType,
      feedAmount,
      remainingAmount,
      note,
    }
    const nextErrors = validateFeedForm(values, {
      requireRemainingAmount: isFloorFour,
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstFieldError()
      return
    }

    submittingRef.current = true
    mutation.mutate(
      {
        // 급여 시각·단위는 화면에서 바꿀 수 없어 상세 응답 원본을 그대로 보낸다.
        feed,
        feedType: feedType.trim(),
        // 고치지 않았으면 표시용으로 반올림한 값 대신 상세 응답의 원래 숫자를 보낸다.
        feedAmount:
          feedAmount === initialFeedAmount
            ? feed.feedAmount
            : (parseFeedAmount(feedAmount) ?? 0),
        remainingAmount:
          remainingAmount === initialRemainingAmount &&
          feed.remainingAmount != null
            ? feed.remainingAmount
            : (parseRemainingAmount(remainingAmount) ?? 0),
        significant: note.trim(),
      },
      {
        // 곧바로 목록으로 이동하고 갱신은 기다리지 않는다. 갱신을 기다리는 동안 폼이 남아 있으면
        // 버튼이 다시 눌리는 것처럼 보이고, 그 사이 다른 화면으로 떠나도 목록으로 끌려온다.
        // 목록(staleTime 0)은 진입 시 다시 조회하고, 상세는 무효화로 다음 진입 때 다시 부른다.
        onSuccess: () => {
          onCompleted()
          void queryClient.invalidateQueries({ queryKey: feedQueryKeys.lists })
          void queryClient.invalidateQueries({ queryKey: ['feeds', 'history'] })
          void queryClient.invalidateQueries({
            queryKey: feedQueryKeys.detail(feed.floor, feed.id),
          })
        },
        onError: () => {
          submittingRef.current = false
        },
      },
    )
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Fields>
        <FormFieldCard label="대상 개체" labelSize={32} htmlFor="feed-target">
          <ReadOnlyInput
            id="feed-target"
            readOnly
            value={formatAnimalLabel(feed.animalType, feed.animalName)}
          />
        </FormFieldCard>

        <FormFieldCard
          label={isFloorFour ? '급여일시' : '급여일'}
          labelSize={32}
          htmlFor="feed-fed-at"
        >
          <ReadOnlyInput
            id="feed-fed-at"
            readOnly
            value={
              isFloorFour
                ? formatFedAt(feed.fedDate, feed.fedTime)
                : formatFedDate(feed.fedDate)
            }
          />
        </FormFieldCard>

        <FormFieldCard label="급여자" labelSize={32} htmlFor="feed-feeder">
          <ReadOnlyInput id="feed-feeder" readOnly value={feed.feederName} />
        </FormFieldCard>

        <FormFieldCard
          label="먹이 종류"
          labelSize={32}
          htmlFor="feed-type"
          error={errors.feedType}
          errorId={feedTypeErrorId}
        >
          <TextInput
            id="feed-type"
            aria-required="true"
            maxLength={50}
            aria-describedby={errors.feedType ? feedTypeErrorId : undefined}
            value={feedType}
            autoComplete="off"
            onChange={(event) => setFeedType(event.target.value)}
          />
        </FormFieldCard>

        <FormFieldCard
          label="급여량"
          labelSize={32}
          htmlFor="feed-amount"
          error={errors.feedAmount}
          errorId={feedAmountErrorId}
        >
          <UnitAmountInput
            id="feed-amount"
            unit={unitLabel}
            value={feedAmount}
            errorId={errors.feedAmount ? feedAmountErrorId : undefined}
            onChange={setFeedAmount}
          />
        </FormFieldCard>

        {isFloorFour && (
          <>
            <FormFieldCard
              label="잔량"
              labelSize={32}
              htmlFor="remaining-amount"
              error={errors.remainingAmount}
              errorId={remainingAmountErrorId}
            >
              <UnitAmountInput
                id="remaining-amount"
                unit={unitLabel}
                value={remainingAmount}
                errorId={
                  errors.remainingAmount ? remainingAmountErrorId : undefined
                }
                onChange={setRemainingAmount}
              />
            </FormFieldCard>

            <FormFieldCard label="특이사항" labelSize={32} htmlFor="feed-note">
              <NoteInput
                ref={noteRef}
                id="feed-note"
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </FormFieldCard>
          </>
        )}
      </Fields>

      <Footer>
        {mutation.isError && (
          <SubmitStatus role="status">
            저장하지 못했습니다. 다시 시도해 주세요.
          </SubmitStatus>
        )}
        <Actions>
          <SubmitButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중' : '저장하기'}
          </SubmitButton>
        </Actions>
      </Footer>
    </Form>
  )
}

interface UnitAmountInputProps {
  id: string
  /** 고정 단위 표기(`g/ml`·`kg/l`) */
  unit: string
  value: string
  /** 오류가 있을 때만 넘긴다. */
  errorId?: string
  onChange: (value: string) => void
}

// 급여량·잔량 칸. 숫자만 편집한다(`200 g/ml` → `200`). 단위는 지울 수 없는 고정 글자다.
function UnitAmountInput({
  id,
  unit,
  value,
  errorId,
  onChange,
}: UnitAmountInputProps) {
  const unitId = `${id}-unit`

  return (
    <AmountBox htmlFor={id}>
      {/* 입력 폭을 글자만큼 맞춰 단위가 숫자 바로 뒤에 붙게 한다(Figma `200 g/ml`). */}
      <AmountSizer>
        <AmountMirror aria-hidden="true">{value || ' '}</AmountMirror>
        <AmountInput
          id={id}
          aria-required="true"
          inputMode="decimal"
          // 기본 폭(20글자)을 없애 폭이 복제 글자를 따라가게 한다.
          size={1}
          maxLength={10}
          aria-describedby={errorId ? `${unitId} ${errorId}` : unitId}
          value={value}
          autoComplete="off"
          onChange={(event) =>
            onChange(sanitizeFeedAmountInput(event.target.value))
          }
        />
      </AmountSizer>
      <AmountUnit id={unitId}>{unit}</AmountUnit>
    </AmountBox>
  )
}

// Figma 폼 하단(1470.8) → `저장하기`(1510.8) 40px.
const Form = styled.form`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 40px;
`

// Figma `form`(2429:24038) 카드 간 간격 16px.
const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TextInput = styled.input`
  width: 100%;
  height: 66px;
  padding: 0 24px;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 24px;
  font-weight: 500;
`

// 급여량·잔량 칸. 겉모양은 TextInput 과 같고, 칸 어디를 눌러도 입력에 초점이 간다.
const AmountBox = styled.label`
  display: flex;
  width: 100%;
  height: 66px;
  align-items: center;
  padding: 0 24px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: text;
  font-size: 24px;
  font-weight: 500;
`

// 보이지 않는 복제 글자가 폭을 정하고, 입력은 그 위에 겹친다.
// 입력을 흐름에서 빼야 입력 자체의 기본 폭이 끼어들지 않는다(한 글자일 때 단위 앞이 벌어진다).
const AmountSizer = styled.span`
  position: relative;
  display: inline-block;
  min-width: 1ch;
`

const AmountMirror = styled.span`
  visibility: hidden;
  white-space: pre;
`

const AmountInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
`

// Figma `200 g/ml` — 숫자와 단위 사이 한 칸.
const AmountUnit = styled.span`
  flex: 0 0 auto;
  margin-left: 0.25em;
`

// 대상 개체·급여일시·급여자 값은 Figma 에서 textGuide 다(편집 가능한 값은 textStrong).
const ReadOnlyInput = styled(TextInput)`
  color: ${({ theme }) => theme.colors.textGuide};
`

const NoteInput = styled.textarea`
  display: block;
  width: 100%;
  min-height: 160px;
  padding: 20px 24px;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  resize: none;
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SubmitStatus = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 20px;
  font-weight: 500;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

// Figma `저장하기`(2429:24077) 123×61, 본문 우측 끝 정렬.
const SubmitButton = styled.button`
  min-height: 61px;
  padding: 16px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
