# Token Diff Report — login

> Figma Variables 미노출 → semantic token 후보와 direct CSS 구현값을 분리해 수집합니다.
> tokens.ts 는 수정되지 않았습니다(읽기 전용). solid color/font family의 new 항목만 개발자 확인 후 반영합니다.
> px·rgba·font size/weight·spacing·radius는 토큰에 저장하지 않고 사용하는 Emotion 스타일에 직접 작성합니다.

- matched: 기존 tokens.ts 값과 동일
- new: 기존에 없는 semantic token 후보 → 개발자가 이름 부여(color.* / font.body) 후 반영
- 신규 semantic token 후보 개수: **4**

## Semantic token candidates

### Solid colors → color.*
| 값 | 사용 | 상태 | 제안 tokens.ts 경로 |
|----|------|------|---------------------|
| `#FF3131` | 7 | ✅ matched | (기존) |
| `#848491` | 6 | ✅ matched | (기존) |
| `#F5F5F7` | 6 | ✅ matched | (기존) |
| `#C6C6CE` | 5 | ✅ matched | (기존) |
| `#2B6034` | 1 | ✅ matched | (기존) |
| `#377B43` | 1 | ✅ matched | (기존) |
| `#3A7D44` | 1 | ✅ matched | (기존) |
| `#234F2B` | 1 | 🆕 new | color.<name> |
| `#38B14A` | 1 | 🆕 new | color.<name> |
| `#458F4F` | 1 | 🆕 new | color.<name> |
| `#A9ECDD` | 1 | 🆕 new | color.<name> |
| `#36363F` | 1 | ✅ matched | (기존) |

### Font families → font.*
(없음)

## Direct CSS implementation values

### Alpha/calculated colors
| 값 | 사용 |
|----|------|
| `rgba(115,84,55,0.55)` | 1 |
| `rgba(169,236,221,0.34)` | 1 |
| `rgba(255,255,255,0.7)` | 1 |
| `rgba(20,26,23,0.1)` | 1 |
| `rgba(255,49,49,0.25)` | 1 |

### Font sizes
(없음)

### Font weights
(없음)

### Spacing
(없음)

### Radius
(없음)


> 참고: 확정 시 `color.*`는 theme.ts에서 `colors.*`로 투영됨(color→colors 리네임).
