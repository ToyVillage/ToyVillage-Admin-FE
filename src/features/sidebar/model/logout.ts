import { endSession } from '@/shared/api/session'

// 서버 로그아웃 API 는 아직 없다. 연동 시 세션 삭제 전에 호출한다.
// endSession 은 전체 이동(replace)이라 뒤로 가기로 이전 화면에 돌아가지 않고 캐시도 함께 비워진다.
export function logout(): void {
  endSession()
}
