# API Test Scenarios — excel-export

공통: 시간은 `2026-10-20T12:00:00`으로 고정한다. 모든 요청은 `page.route()`로 막고 실제 서버를 호출하지 않는다. 성공 응답은 임의 바이트 본문이다.

## Mock S1

- 목적: 항목 하나와 기간을 보내고 파일을 받는다
- Mock request: `GET /excel?types=TASK&mode=SHEET&startDate=2026-09-20&endDate=2026-10-20`
- Mock response: 200, 파일 본문
- 사용자 동작: `업무관리` 선택(기본 `최근 1개월`, `엑셀 파일 (.xlsx)`) → `엑셀 다운로드`
- 기대 결과: 요청 1회. 파일 이름 `업무관리_2026-09-20_2026-10-20.xlsx`, 내용은 응답 본문과 같다. 성공 토스트 `엑셀 파일을 내려받았습니다`가 보인다.

## Mock S2

- 목적: 여러 항목은 화면 순서대로 보내고 통합 이름으로 받는다
- Mock request: `types=ANIMAL&types=FIFTH_FLOOR_FEED_LOG`
- Mock response: 200, 파일 본문
- 사용자 동작: `5층 먹이 급여`, `동물 리스트` 순서로 선택 → `엑셀 다운로드`
- 기대 결과: `types`가 위 순서다. 파일 이름 `통합_2026-09-20_2026-10-20.xlsx`.

## Mock S3

- 목적: 전체 선택과 전체 기간
- Mock request: 10개 항목의 `types` 10개(`DOCUMENT` 없음), `startDate`·`endDate` 없음
- Mock response: 200, 파일 본문
- 사용자 동작: `전체 선택` → `전체 기간` → `엑셀 다운로드`
- 기대 결과: 날짜 파라미터가 없다. 파일 이름 `통합.xlsx`.

## Mock S4

- 목적: 압축 파일 선택
- Mock request: `types=NOTICE&mode=ZIP&startDate=2026-09-20&endDate=2026-10-20`
- Mock response: 200, 파일 본문
- 사용자 동작: `공지사항` 선택 → `압축 파일 (.zip)` → `엑셀 다운로드`
- 기대 결과: `mode=ZIP`. 파일 이름 `공지사항_2026-09-20_2026-10-20.zip`.

## Mock S5

- 목적: 기간 미적용 항목만 고르면 파일 이름에 날짜가 없다
- Mock request: `types=TEAM_MEMBER&mode=SHEET&startDate=2026-09-20&endDate=2026-10-20`
- Mock response: 200, 파일 본문
- 사용자 동작: `직원 계정 관리` 선택 → `엑셀 다운로드` → `동물 리스트`도 선택 → `엑셀 다운로드`
- 기대 결과: 첫 파일 이름 `직원 계정 관리.xlsx`, 두 번째 `types=ANIMAL&types=TEAM_MEMBER`와 파일 이름 `통합.xlsx`.

## Mock S6

- 목적: 요청 중 중복 요청 방지
- Mock request: S1과 같음
- Mock response: 200, 응답을 늦춘다
- 사용자 동작: `업무관리` 선택 → `엑셀 다운로드` 두 번 클릭
- 기대 결과: 응답 전 버튼 비활성, 라벨 `엑셀 다운로드` 유지. 요청 1회. 응답 뒤 다시 활성.

## Mock S7

- 목적: 최대 건수 초과
- Mock request: S1과 같음
- Mock response: 413, `message: 엑셀 내보내기 최대 건수를 초과했습니다.`
- 사용자 동작: `업무관리` 선택 → `엑셀 다운로드`
- 기대 결과: 오류 토스트에 서버 문구가 보인다. 파일을 내려받지 않고 선택·기간이 그대로다.

## Mock S8

- 목적: 첨부파일 용량 초과
- Mock request: S1과 같음
- Mock response: 413, `message: 엑셀 내보내기 첨부파일 총용량을 초과했습니다.`
- 사용자 동작: `업무관리` 선택 → `엑셀 다운로드`
- 기대 결과: 오류 토스트에 서버 문구가 보인다.

## Mock S9

- 목적: 서버 오류 후 재시도
- Mock request: S1과 같음
- Mock response: 첫 요청 500(`message: 내부 서버 오류가 발생했습니다.`), 두 번째 요청 200
- 사용자 동작: `업무관리` 선택 → `엑셀 다운로드` → 다시 `엑셀 다운로드`
- 기대 결과: 첫 번째는 토스트 `엑셀 파일 생성에 실패했습니다` 두 번째는 파일을 받는다.

## Mock S10

- 목적: 네트워크 실패
- Mock request: S1과 같음
- Mock response: 연결 실패(abort)
- 사용자 동작: `업무관리` 선택 → `엑셀 다운로드`
- 기대 결과: 토스트 `엑셀 파일 생성에 실패했습니다` 버튼이 다시 활성이다.

## Staging R1

- 실행 여부: disabled
- 실제 request: 없음
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 없음
- 기대 status와 결과: 없음
- 생성 데이터 식별자: 없음
- 정리 절차: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 필드 없음(`message`만 읽는다)
- loading/error/success 상태가 숨겨지지 않음
- 403은 공통 인터셉터 동작이라 시나리오에서 뺀다(`app-feed-log-update-admin` 선례)
