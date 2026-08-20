# Task 12 Report — Resilient GitHub Activity Statistics

## Outcome

고정 계정 `internalforces`의 최근 365일 GitHub 기여 캘린더와 최근 공개 이벤트를 빌드 시 수집하고, strict 정규화·6시간 TTL 캐시·부분 실패 stale fallback·무토큰 빈 상태를 거쳐 홈에 정적으로 렌더링했다. 토큰은 요청 헤더에서만 사용하며 경고, 캐시, 정적 HTML, 클라이언트 번들에 포함되지 않는다.

## Data and Security Contract

- GraphQL은 `https://api.github.com/graphql`에 `POST`하고 `user(login: "internalforces")`의 `ContributionsCollection`만 요청한다.
- 조회 범위는 UTC 기준 당일을 포함한 정확한 365개 날짜다. 예: 2026-01-01 기준 `2025-01-02T00:00:00.000Z`부터 `2026-01-01T23:59:59.999Z`까지다.
- REST는 `GET /users/internalforces/events/public?per_page=30`을 사용한다.
- 두 요청은 같은 `Bearer` 인증, `application/vnd.github+json`, `X-GitHub-Api-Version: 2026-03-10` 계약을 사용한다.
- 공식 계약은 GitHub 공식 문서만 대조했다.
  - [GraphQL 요청과 인증](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)
  - [REST public events와 30일 범위](https://docs.github.com/en/rest/activity/events?apiVersion=2026-03-10)
- HTTP non-2xx, rate limit, request reject, JSON parse 실패, GraphQL 200 응답의 `errors`, null user, malformed calendar, malformed allowlist event를 모두 해당 source 실패로 처리한다.
- REST allowlist는 `PushEvent`, `PullRequestEvent`, `IssuesEvent`, `CreateEvent`, `ReleaseEvent` 다섯 타입뿐이다. 미지원/비공개 이벤트는 제외하고 allowlist 타입이 깨졌다면 false empty cache를 쓰지 않고 실패 처리한다.
- 이벤트는 생성 시각 내림차순, ID 오름차순 tie-break로 정렬한 뒤 최신 duplicate를 보존하고 6개로 제한한다.
- 저장소는 `owner/repository` 경계로 검증한다. 외부 payload URL은 HTTPS `github.com`이면서 같은 저장소 경로일 때만 사용하고, 그렇지 않으면 검증된 저장소·PR·issue·commit·branch·tag 경로를 직접 구성한다.
- GitHub의 contribution `color`는 사용하지 않는다. count를 0–4 intensity와 다섯 개의 고정 palette 값으로 변환하며 UI도 trusted level class만 렌더링한다.

## Cache and Failure Policy

- `.cache/github-stats.json`은 기존 `.gitignore`의 `.cache/` 정책 아래 유지한다.
- parser는 top-level, week/day, event의 exact keys, 숫자 범위, ISO 날짜, trusted color-level pair, 저장소와 URL 대응을 검증한다. token 같은 추가 필드가 있으면 캐시를 거부한다.
- writer는 같은 디렉터리의 mode `0600` 임시 파일에 직렬화한 뒤 atomic rename하고 실패한 임시 파일을 정리한다.
- 6시간 이내이며 `stale: false`인 캐시는 네트워크 없이 즉시 사용한다.
- 오래되거나 명시적으로 stale인 캐시는 GraphQL과 REST를 독립적으로 갱신한다.
- 둘 다 성공하면 `stale: false`로 atomic write한다.
- 한쪽만 실패하고 캐시가 있으면 성공한 절반과 캐시의 실패한 절반을 합쳐 `stale: true`로 반환하며 부분 결과를 캐시에 덮어쓰지 않는다.
- 요청 실패 시 캐시가 없으면 `null`과 토큰/오류 원문이 없는 경고 한 번만 남긴다.
- 토큰이 없으면 캐시 read 이후 즉시 끝나며 네트워크를 절대 호출하지 않는다. 캐시도 없으면 경고 없이 `null`이다.

## Accessible UI

- 기존 홈 placeholder를 12열 8/4 GitHub panel로 교체하고 52rem 아래에서 단일 열로 접는다.
- 기여 캘린더는 합계, 월 레이블, 0–4 강도 범례, 날짜 셀별 `2026년 8월 20일, 기여 3회` accessible name을 제공한다.
- 동일 데이터를 caption, 날짜 row header, 기여 횟수 column으로 구성한 screen-reader table로 함께 제공한다.
- 모바일 캘린더는 문서 전체의 가로 overflow 없이 자체 키보드 스크롤 영역을 제공하며 최신 주차 쪽에서 시작한다.
- 최근 활동은 저장소, 한국어 행동, 한 번 고정한 build time 기준의 결정적 상대 날짜와 KST absolute title을 표시한다. stale 확인 문구만 cache `fetchedAt`을 사용한다. 전체 활동량을 주장하지 않고 REST가 제공하는 최근 30일 범위임을 밝힌다.
- stale 상태는 `마지막으로 확인된 활동`과 KST 확인 시각을, null 상태는 `GitHub 통계를 불러오지 못했습니다.`를 표시한다.
- seed 80의 Geist, light-only Quiet System 75% / Midnight Lab 25%, 한국어 UI, reduced-motion 전역 계약을 유지했다.

## TDD Evidence

1. 첫 RED: `tests/unit/github-stats.test.ts`가 `src/lib/github/fetch-github` 부재로 실패했다.
2. normalization/cache GREEN: GraphQL, five-event allowlist, URL fallback, request headers, year boundary, TTL, no-token, partial failure, GraphQL 200 errors, non-2xx, malformed JSON, exact cache schema와 atomic write가 통과했다.
3. 상대 날짜 RED: `formatRelativeDate is not a function`을 확인한 뒤 explicit reference-time formatter를 구현했다.
4. UI RED: 무토큰 빌드 후 `[data-github-activity]` 계약이 없어 Playwright가 실패했다. 실제 홈 slot과 null 상태를 구현해 GREEN으로 전환했다.
5. fixture axe RED: 365개 calendar span의 역할 없는 `aria-label`을 `aria-prohibited-attr`로 검출했다. 각 셀에 명시적 `role="img"`를 주고 total group과 SR table을 유지해 GREEN으로 전환했다.
6. stale flag/URL coupling RED: 최근 timestamp의 `stale: true` 캐시가 잘못 fresh 처리되고 다른 저장소 URL이 cache schema를 통과했다. stale 우선 갱신과 repository-path coupling으로 수정했다.
7. malformed allowlist RED: 깨진 `PushEvent` 배열이 빈 성공 결과로 승인됐다. 지원 타입의 malformed item을 source failure로 올려 cache fallback을 보존했다.

## Verification

Fresh final no-token run:

- `GITHUB_TOKEN= npm run verify`: exit 0.
  - Astro check: 0 errors, 0 warnings, 기존 Zod deprecation hint 1개.
  - Vitest: 16 files, 117 tests passed.
  - Static build: 12 pages built, Pagefind completed.
- `npx playwright test`: 26 passed, cache-fixture 전용 1 skipped.
  - null GitHub state desktop 1280×900 / mobile 390×844 axe violations 0.
- focused GitHub unit: 19 tests passed.
- populated ready fixture: desktop/mobile safe GitHub origins, SR table, per-day label, no document overflow, axe violations 0.
- populated stale fixture: desktop/mobile stale label/date, safe origins, no document overflow, axe violations 0.
- `git diff --check`: clean.
- `.cache/github-stats.json` absent 상태에서 무토큰 build 완료, build 이후에도 cache 파일 생성 없음.
- `dist/`에서 test token, `GITHUB_TOKEN`, `Authorization:`, `Bearer ` 문자열 검색 결과 없음.

## Visual Evidence

- ready desktop 1280×900: 8/4 calendar/activity panel, 53-week month flow, five Korean recent events, trusted intensity palette 확인.
- ready mobile 390×844: single-column stacking, 자체 calendar viewport, latest weeks initial view, page-level horizontal overflow 없음.
- stale mobile 390×844: 확인 시각 status, calendar/activity 유지, touch-width link and card layout 확인.

## Concerns

- 기존 `src/lib/content/schema.ts` Zod `.url()` deprecation hint와 Pagefind의 한국어 stemming 미지원 안내는 Task 12 범위 밖이라 변경하지 않았다.
- `.cache/`는 의도적으로 Git에 커밋하지 않는다. CI 간 stale fallback을 보존하는 외부 cache restore/save wiring은 후속 배포 workflow 범위에서 이 파일을 사용해야 한다.

## Fix Round 1 — Reviewer Findings

### Corrections

- GitHub의 [공식 Event type 계약](https://docs.github.com/en/rest/using-the-rest-api/github-event-types?apiVersion=2026-03-10)에 맞춰 allowlist 다섯 타입의 payload를 각자 검증한다. Push는 repository/push ID, full ref와 40자리 head/before SHA를, PullRequest와 Issues는 action enum과 핵심 resource를, Create는 ref type·full ref·default branch·description·pusher type을, Release는 `published`와 release resource를 요구한다. 미지원 타입은 계속 제외하지만 지원 타입이 malformed면 REST source 전체를 실패로 처리해 false empty 캐시를 쓰지 않는다.
- GraphQL과 REST 중 하나만 성공한 경우 cache `fetchedAt`은 마지막 전체 확인 시각으로 보존한다. 최근 이벤트 상대 시각은 그 값이 아니라 한 번 고정한 현재 build time을 기준으로 렌더링하므로, REST만 새로 받은 이벤트가 오래된 확인 시각 때문에 `방금 전`으로 보이지 않는다. 5분을 넘는 미래 timestamp는 clock skew를 음수 상대 시각으로 숨기지 않고 절대 날짜로 표시한다.
- 캐시 parser는 shape뿐 아니라 기여 합계와 day count 합, count-level-color 대응, 전역 날짜 uniqueness/연속 오름차순, 같은 Sunday week 소속, 연속 주차와 365일 범위를 검증한다. 이벤트는 ID uniqueness, `createdAt` 내림차순/ID tie-break, 정규화기가 생성할 수 있는 한국어 canonical label만 허용한다. 같은 검증을 GraphQL 정규화 결과에도 적용해 서로 불일치하는 API calendar를 source failure로 처리한다.
- 두 GitHub 요청에 독립적인 AbortController와 기본 10초(주입값 최대 30초) deadline을 적용했다. timeout, non-2xx, JSON parse 성공/실패 어느 경로에서도 timer를 `finally`에서 정리한다.
- 8/4 데스크톱 grid의 cross-axis를 `start`로 맞춰 짧은 기여 캘린더가 긴 최근 활동 카드 높이까지 늘어나지 않게 했다. 기존 seed 80 C+B palette, spacing, responsive stack은 그대로 유지했다.

### TDD and Browser Evidence

1. allowlist 타입별 필수 payload가 없어도 통과하는 다섯 RED를 확인한 뒤 strict contract로 GREEN 전환했다.
2. 미래 이벤트가 `방금 전`으로 표시되는 unit RED와 stale fixture browser RED를 확인했다. explicit build reference time 적용 뒤 현재 이벤트 상대 시각과 stale 확인 시각을 분리했다.
3. 합계 불일치 cache가 승인되는 semantic RED를 시작으로 duplicate/descending dates, incoherent weeks, duplicate/unsorted event IDs, noncanonical label을 거부하도록 했다. API contribution total 불일치도 별도 RED→GREEN으로 검증했다.
4. timeout 테스트는 처음 두 RequestInit에 signal이 없어 즉시 실패하는 RED였고, 이후 GraphQL/REST signal 모두 abort, stale fallback, 단일 sanitized warning, timer count 0을 확인했다.
5. 1280px fixture에서 두 카드 높이가 모두 `472.234375px`로 늘어나는 browser RED를 기록했다. `align-items: start` 후 calendar가 자연 높이를 유지하는 GREEN과 desktop/mobile axe violations 0을 확인했다.
6. REST success + GraphQL 503 회귀 테스트는 새 events, cached `fetchedAt`, current build-time `2시간 전`, no partial cache overwrite를 함께 확인한다.

### Fix Verification

- focused GitHub unit: 28 tests passed.
- `GITHUB_TOKEN= npm run verify`: Astro check 0 errors, Vitest 16 files / 126 tests, static 12 pages and Pagefind build 완료.
- ready fixture desktop 1280×900 / mobile 390×844: state, SR table, safe GitHub URLs, document overflow 없음, axe violations 0; calendar/activity natural heights와 C+B balance를 screenshot으로 확인했다.
- stale fixture desktop/mobile: current build 기준 activity time, cached `마지막으로 확인된 활동`, axe violations 0을 확인했다.
- cache 파일을 제거한 no-token full Playwright: 26 passed, fixture-only 1 skipped; null state desktop/mobile 계약 유지.
- `.cache/github-stats.json`은 no-token build 전후 존재하지 않았고, `dist/` token/header 문자열 scan은 일치 항목이 없었다.
- 기존 Zod deprecation hint 1개와 Pagefind 한국어 stemming 안내만 남으며 이번 범위와 무관하다.

## Fix Round 2 — Official Repository CreateEvent

- GitHub 공식 Event type 표의 repository `ref: null` 형태와 Events endpoint 공식 응답 예시의 `ref: "master"`, `full_ref: "refs/heads/master"`, `description: null` 형태를 모두 양성 계약으로 반영했다.
- repository ref가 문자열이면 `refs/heads/<ref>`와 일치해야 하며, null도 허용한다. branch/tag의 non-empty ref와 `full_ref` 일치, `master_branch`, `pusher_type`, common event shape, repository/URL 안전 검증은 유지한다.
- 실제 공식 응답 구조를 미러링한 `create-repository.json` fixture와 두 ref 형태의 한국어 label·안전한 repository URL 회귀 테스트를 추가했다. 수정 전 supported `CreateEvent` source failure RED, 수정 후 focused GREEN을 확인했다.
- Accessible UI 설명의 오래된 `fetchedAt` 상대 날짜 문구를 수정했다. 활동 상대 날짜는 build time, stale `마지막으로 확인된 활동` 문구는 cache `fetchedAt` 기준이다.
- focused GitHub unit 29 tests와 `GITHUB_TOKEN= npm run verify`의 16 files / 127 tests, 12-page no-token build가 통과했다. cache 파일은 빌드 전후 없었고 정적 산출물 token/header scan도 일치 항목이 없었다. null-state full Playwright는 26 passed / fixture-only 1 skipped로 기존 홈 접근성 상태를 유지했다.
