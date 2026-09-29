import { assertSecureApiBaseUrl } from './apiBaseUrl'

// 업로드한 파일은 API 서버가 아니라 파일 서버(CDN)에 있다. `fileKey` 를 이 주소 뒤에 붙여 받는다
// (Notion `FILE_CREATE`). 다운로드할 때만 검사해 설정이 빠져도 앱 전체가 멈추지 않게 한다.
export function storedFileUrl(fileKey: string): string {
  const baseUrl = import.meta.env.VITE_FILE_BASE_URL
  assertSecureApiBaseUrl(baseUrl, 'VITE_FILE_BASE_URL')

  return `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(fileKey)}`
}

// 공통 `api` 인스턴스를 쓰지 않는다. 인증 인터셉터가 Bearer 토큰을 CDN 에 실어 보내고
// CDN 의 403 을 세션 만료로 보고 로그아웃시키기 때문이다(code-rules 4 예외).
export async function fetchStoredFile(
  fileKey: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(storedFileUrl(fileKey), { signal })

  if (!response.ok) {
    throw new Error(`파일을 받지 못했습니다(HTTP ${response.status}).`)
  }

  return response.blob()
}
