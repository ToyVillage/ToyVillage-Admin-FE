# Test Scenarios — DOCUMENTS_CREATE (Mock)

승인 후 Playwright `page.route()` 기반 mock으로 작성/실행한다. 모든 응답은 Contract의 status/body만 사용한다. 대상: `POST /documents`. 생성 흐름은 **파일을 첨부하는 즉시** `POST /file`(FILE_CREATE)로 업로드해 `fileKey`를 확보해 두고, **생성하기** 클릭 시 그 key를 `POST /documents`의 `files`로 보내므로, 두 엔드포인트를 함께 mock한다.

## 등록 성공

- S1. 파일 첨부 시 `POST /file`이 `{ fileKey }` 반환(업로드) → 제목/분류 입력 후 생성하기 → 그 key가 `POST /documents`의 `files`로 전달됨 → `201 { "message": "자료 등록 성공" }` → 성공 처리(목록 복귀), `['resources']` 재조회.

## 입력/요청 오류 (400)

- S2. `title` 비어 있음 → 서버 `400 { message: "자료 제목은 비어있을 수 없습니다.", status:400, ... }` → 생성 실패 다이얼로그, 화면 이동 없음.
- S3. `type` 미선택 → `400 { message: "자료 종류는 선택되어야합니다." ... }` → 실패 다이얼로그.
- S4. `files` 없음 → `400 { message: "파일이 하나 이상 등록되어야합니다." ... }` → 실패 다이얼로그.
  - 참고: 프론트 자체 검증(제목/파일)도 있으므로, 서버 400 경로 검증은 프론트 검증을 통과한 요청에 대해 route로 400을 주입해 확인한다.

## 인증 오류 (401)

- S5. `401 { message: "만료된 토큰입니다.", status:401, ... }` → 실패 다이얼로그(성공 이동 없음).

## 리소스 없음 (404)

- S6. 잘못된 file key → `404 { message: "존재하지 않는 파일입니다.", status:404, ... }` → 실패 다이얼로그.

## 서버 오류 (500)

- S7. `500 { message: "예상하지 못한 에러가 발생했습니다.", status:500, ... }` → 실패 다이얼로그.

## 부가 동작

- S8. 로딩: 제출 중 버튼 라벨 "생성 중" + disabled.
- S9. 중복 제출 방지: 연속 제출 시 `POST /documents` 요청 1회만 발생(`submittingRef`).
- S10. 캐시 갱신: 성공 후 `['resources']` 목록이 재조회된다.

## 정리

- Mock 테스트는 서버 상태를 만들지 않으므로 별도 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 **미실행**.
