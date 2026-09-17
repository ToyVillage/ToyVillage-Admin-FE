import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ToastVariant } from '@/shared/ui'

export type PageToastKey =
  | 'create-success'
  | 'delete-success'
  | 'delete-error'
  | 'download-error'
  | 'feed-history-empty'
  | 'feed-history-error'

interface PageToastLocationState {
  toast?: PageToastKey
}

const toastByKey: Record<
  PageToastKey,
  { variant: ToastVariant; message: string }
> = {
  'create-success': {
    variant: 'success',
    message: '데이터 생성에 성공했습니다',
  },
  'delete-success': {
    variant: 'success',
    message: '데이터 삭제에 성공했습니다',
  },
  'delete-error': { variant: 'error', message: '데이터 삭제에 실패했습니다' },
  'download-error': { variant: 'error', message: '파일 다운로드에 실패했습니다' },
  'feed-history-empty': { variant: 'error', message: '급여 기록이 없습니다' },
  'feed-history-error': {
    variant: 'error',
    message: '급여 기록을 불러오지 못했습니다',
  },
}

/**
 * 개체관리 목록·상세의 토스트. 화면 안에서 발생한 결과(삭제)와 다른 화면에서 이동 state 로
 * 전달받은 결과(생성·삭제)를 함께 다루고, 닫을 때 state 를 비워 재방문 시 다시 뜨지 않게 한다.
 */
export function usePageToast() {
  const navigate = useNavigate()
  const location = useLocation()
  const [localToast, setLocalToast] = useState<PageToastKey | null>(null)

  const stateToast = (location.state as PageToastLocationState | null)?.toast
  const toastKey = localToast ?? stateToast
  const toast = toastKey ? toastByKey[toastKey] : undefined

  const dismissToast = useCallback(() => {
    setLocalToast(null)
    if (stateToast) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, navigate, stateToast])

  return { toast, showToast: setLocalToast, dismissToast }
}
