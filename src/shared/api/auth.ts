import { api } from '@/shared/api/axios'

export function configureApiAuthentication(): void {
  api.interceptors.request.use((config) => {
    const accessToken =
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwidHlwZSI6ImFjY2VzcyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NTY3MzQxOCwiZXhwIjoxNzg1Njc3MDE4fQ.luj9Ng12JxZuoUrKlYq5GeyOBBccafwT8_hz7k6kBUHLZ4VdoQI_NL-Ki-2yxZpoyoix44eRvVps5pGsMNv-yA'

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })
}
