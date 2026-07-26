<!-- Figma 노드 → repo 컴포넌트 매핑 초안. AI가 채우고 개발자가 게이트에서 검토(과분리 방지). -->

# Component Map — <feature>

## 경계 규칙 (design-rules.md §7 요약)
- Figma `COMPONENT` → 컴포넌트 경계 후보
- Figma `INSTANCE` → 기존 컴포넌트 재사용 위치
- variant → props/state
- `FRAME`/`GROUP`/`TEXT`/`LINE`/`IMAGE-SVG` → 경계 아님(레이아웃/요소)
- 기존 repo 컴포넌트 있으면 재사용. 승인 없이 새 shared 컴포넌트/기존 API 변경 금지.

## 레이어 선택 가이드
- 특정 페이지 전용 → `pages`
- 재사용 도메인 단위(공지 행 등) → `features`/`entities`
- 도메인 무관 범용 UI(버튼·아이콘 등) → `shared`
> import 방향은 eslint.config.js가 강제하지만, "어느 레이어에 두느냐"는 위 의미 기준으로 정한다.

## 매핑
| Figma 노드 | type | → 코드 | 레이어 | 재사용? | props |
|-----------|------|--------|--------|---------|-------|
| #1541:1470 | FRAME | NoticeHeader | pages/features | new? | title, subtitle |
| #1541:1535 | FRAME | CreateButton | shared/ui | 기존 Button 재사용? | label, onClick |
| #1541:1491 (row) | FRAME | NoticeRow | features/entities | new | category, title, date, onClick |
| "ic:outline-plus" | IMAGE-SVG | 아이콘 에셋 | shared/ui/icons | download_figma_images | — |
| … | | | | | |

## 새 컴포넌트 후보 (과분리 점검)
개발자가 "이건 컴포넌트로 안 빼도 됨"을 표시할 수 있음:
- [ ] NoticeRow — 필요
- [ ] … 
