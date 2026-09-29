import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// 목록 화면의 조회 조건(탭·정렬·검색어·페이지)을 URL 이 소유하게 한다.
// 지역 상태로 두면 상세에 다녀올 때 화면이 다시 마운트되면서 조건이 풀린다.
//
// 기본값과 같은 값은 URL 에 쓰지 않는다 — 아무 조건도 고르지 않은 목록의 주소가
// `/tasks` 처럼 깨끗하게 유지된다.
export function useListSearchParams<K extends string>(
  defaults: Readonly<Record<K, string>>,
) {
  const [searchParams, setSearchParams] = useSearchParams()

  const keys = useMemo(() => Object.keys(defaults) as K[], [defaults])

  const values = useMemo(() => {
    const entries = keys.map((key) => [key, searchParams.get(key) ?? defaults[key]])
    return Object.fromEntries(entries) as Record<K, string>
  }, [keys, searchParams, defaults])

  // 바뀐 값만 넘기면 나머지는 그대로 둔다.
  const update = useCallback(
    (next: Partial<Record<K, string>>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          for (const key of keys) {
            const value = next[key]
            if (value === undefined) continue
            if (value === defaults[key]) params.delete(key)
            else params.set(key, value)
          }
          return params
        },
        // 조건 변경마다 기록을 쌓으면 뒤로가기를 여러 번 눌러야 목록을 벗어난다.
        { replace: true },
      )
    },
    [defaults, keys, setSearchParams],
  )

  return { values, update }
}
