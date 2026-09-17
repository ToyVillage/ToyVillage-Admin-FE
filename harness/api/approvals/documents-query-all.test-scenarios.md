# Test Scenarios — DOCUMENTS_QUERY_ALL (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /documents`. 응답은 Contract의 status/body만 사용한다. 조회는 페이지 진입 시 발생하므로 goto 전에 route를 건다. **서버 사이드 페이지네이션**: `page`(0부터)·`size=10`으로 해당 페이지만 요청하고, 페이지 이동·탭 변경 시 `page`/`types` 파라미터로 재요청한다.

## 조회 성공

- S1. 진입 시 `GET /documents?page=0&size=10...` 요청 → 200 `{ documents, totalPageSize }` → 목록에 행 표시(title, type→fileType 라벨, createdAt→표시 날짜 매핑 확인). '전체' 탭에서는 `types` 를 보내지 않는다.
- S2. 200 `{ documents: [], totalPageSize: 0 }` → "등록된 자료가 없습니다." 안내(Figma 빈 상태 문구).
- S5. `totalPageSize: 2` → "다음 페이지" 클릭 시 `page=1`로 재요청하고 다음 페이지 자료 표시.
- S6. 페이지 번호는 `totalPageSize` 만큼만 그린다(`totalPageSize: 2` 이면 3페이지 버튼 없음).

## 필터

- S7. 파일 유형 탭(jpg/jpeg) 선택 → `types=JPG` 로 재요청(`types[]=` 아님)하고 `page` 는 0으로 리셋된다. 응답의 자료가 목록에 표시된다.

## 경계

- S8. URL `?page=5` 로 진입했는데 응답 `totalPageSize: 1` → 빈 페이지에 고착되지 않고 마지막 페이지(1)로 복귀한다.

## 오류

디자인에 로딩/오류 전용 화면이 없으므로, 오류 시 목록은 별도 오류 UI 없이 빈 상태로 폴백한다.

- S3. 500 서버 오류 → 오류 화면 없이 빈 상태("등록된 자료가 없습니다.").
- S4. 401 만료된 토큰 → 오류 화면 없이 빈 상태.

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
