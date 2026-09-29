import { useState } from 'react'
import styled from '@emotion/styled'

interface ProfilePhotoProps {
  src: string
  alt: string
  /** 크기·모서리·배치는 쓰는 쪽이 `styled(ProfilePhoto)` 로 정한다. 대체 표시에도 같이 붙는다. */
  className?: string
}

/**
 * 프로필 사진. 불러오지 못하면(파일 없음·CDN 오류) 깨진 이미지 대신 같은 자리에 `사진 없음` 을 그린다.
 * 실패 상태는 주소마다 따로 기억한다 — 사진을 바꾸면 새 주소로 다시 시도한다.
 */
export function ProfilePhoto({ src, alt, className }: ProfilePhotoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) {
    return (
      <Fallback role="img" aria-label={alt} className={className}>
        사진 없음
      </Fallback>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  )
}

const Fallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.avatarMuted};
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`
