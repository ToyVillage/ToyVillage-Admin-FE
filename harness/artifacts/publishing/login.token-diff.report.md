# Token Diff Report — login

> Figma Variables 미노출 → semantic token 후보와 direct CSS 구현값을 분리해 수집합니다.
> tokens.ts 는 수정되지 않았습니다(읽기 전용). solid color/font family의 new 항목만 개발자 확인 후 반영합니다.
> px·rgba·font size/weight·spacing·radius는 토큰에 저장하지 않고 사용하는 Emotion 스타일에 직접 작성합니다.

- matched: 기존 tokens.ts 값과 동일
- new: 기존에 없는 semantic token 후보 → 개발자가 이름 부여(color.* / font.body) 후 반영
- 신규 semantic token 후보 개수: **1**

## Semantic token candidates

### Solid colors → color.*
| 값 | 사용 | 상태 | 제안 tokens.ts 경로 |
|----|------|------|---------------------|
| `#F5F5F7` | 3 | ✅ matched | (기존) |
| `#848491` | 3 | ✅ matched | (기존) |
| `#FFFFFF` | 2 | ✅ matched | (기존) |
| `#000000` | 2 | ✅ matched | (기존) |
| `#C6C6CE` | 1 | ✅ matched | (기존) |

### Font families → font.*
| 값 | 사용 | 상태 | 제안 tokens.ts 경로 |
|----|------|------|---------------------|
| `Wanted Sans` | 7 | 🆕 new | font.<name> |

## Direct CSS implementation values

### Alpha/calculated colors
(없음)

### Font sizes
| 값 | 사용 |
|----|------|
| `22px` | 2 |
| `20px` | 2 |
| `40px` | 1 |
| `24px` | 1 |
| `28px` | 1 |

### Font weights
| 값 | 사용 |
|----|------|
| `500` | 4 |
| `600` | 2 |
| `700` | 1 |

### Spacing
| 값 | 사용 |
|----|------|
| `16px` | 2 |
| `8px` | 2 |
| `20px` | 1 |
| `18px` | 1 |
| `23px` | 1 |
| `190px` | 1 |
| `12px` | 1 |

### Radius
| 값 | 사용 |
|----|------|
| `8px` | 2 |
| `20px` | 1 |
| `12px` | 1 |


> 참고: 확정 시 `color.*`는 theme.ts에서 `colors.*`로 투영됨(color→colors 리네임).
