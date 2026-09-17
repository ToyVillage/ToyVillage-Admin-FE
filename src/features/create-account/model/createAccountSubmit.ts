import type { CreateAccountSubmit } from './types'

export const createAccountSubmitEvent = 'toyvillage:create-account-submit'

const mockDelay = 400

// 퍼블리싱 단계 mock. 실제 API 연동에서 교체한다.
// 테스트가 호출을 관찰할 수 있게 이벤트를 보내고, 리스너가 preventDefault 하면 실패로 처리한다.
export const submitCreateAccount: CreateAccountSubmit = async (input) => {
  const event = new CustomEvent(createAccountSubmitEvent, {
    detail: input,
    cancelable: true,
  })
  const accepted = window.dispatchEvent(event)

  await new Promise((resolve) => window.setTimeout(resolve, mockDelay))

  if (!accepted) throw new Error('계정 생성 mock 실패')
}
