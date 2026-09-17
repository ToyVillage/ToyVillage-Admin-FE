import { useMutation } from '@tanstack/react-query'
import { logoutApp } from '@/entities/auth'
import { endSession } from '@/shared/api/session'

// 서버에서 refresh token 을 무효화한 뒤 세션을 끝낸다. 사용자가 로그아웃을 요청했으므로
// 서버 실패(403/500/네트워크)에도 로그인 상태로 남기지 않는다.
// endSession 은 전체 이동(replace)이라 뒤로 가기로 이전 화면에 돌아가지 않고 캐시도 함께 비워진다.
export function useLogout(): () => void {
  const { mutate, isPending } = useMutation({
    mutationFn: logoutApp,
    onSettled: endSession,
  })

  return () => {
    if (isPending) return

    mutate()
  }
}
