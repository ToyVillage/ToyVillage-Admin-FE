import axios from 'axios'
import { assertSecureApiBaseUrl } from './apiBaseUrl'

// 인스턴스가 만들어지기 전에 검사한다. 진입점과 무관하게 검증되지 않은 주소를
// 가진 인스턴스가 존재할 수 없다.
const baseURL = import.meta.env.VITE_API_BASE_URL
assertSecureApiBaseUrl(baseURL)

// 공통 Axios 인스턴스. 모든 API 호출은 이 인스턴스를 경유한다(design-rules.md).
export const api = axios.create({
  baseURL,
  timeout: 10_000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 공통 에러 처리 자리(로깅/토큰 갱신 등)
    return Promise.reject(error)
  },
)
