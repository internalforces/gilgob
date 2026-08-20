# Task 11 Report — Accessible Knowledge Graph

## Outcome

Task 11 범위의 지식 그래프를 구현했다. 페이지는 정적 공개 문서 집합에서 시작하며, 분야·글 유형·태그의 다중 facet 필터, 선택 상세, 모바일 ego graph, Cytoscape lazy lifecycle, 키보드용 실제 DOM 노드 목록, 완전한 incoming/outgoing 정적 fallback을 제공한다.

## Implementation

- `filterGraph()`는 문서를 먼저 필터링한다. facet 내부 값은 OR, facet 사이는 AND, 빈 facet은 제한 없음으로 처리한다.
- 남은 문서에 직접 연결된 category/tag taxonomy만 보존하고 양 끝점이 모두 남은 간선만 포함한다. 노드와 간선은 ID로 안정 정렬한다.
- `graphForDocuments()`로 `ContentIndex.graph`를 공개 문서 ID 집합에 먼저 제한한다. draft 문서와 draft에만 연결된 taxonomy/edge는 island props와 fallback 양쪽에서 제외된다.
- 모든 문서 URL은 `withBase(document.url)`로 검증·변환한 뒤 island와 정적 링크에 전달한다.
- Cytoscape는 `KnowledgeGraph` mount 뒤 dynamic import하며 `/graph` 외 페이지에서는 bundle reference가 없다. media query 해석이 끝난 뒤 최초 mount하여 720px 미만에서는 처음부터 ego graph를 만든다.
- graph rebuild/unmount 시 ResizeObserver를 disconnect하고 active layout과 element animation을 stop한 뒤 instance를 destroy한다.
- canvas는 보조 시각화로 숨기고, 모든 visible node에 실제 focusable `<button>` 목록을 제공한다. Enter/클릭은 같은 선택 상태와 adjacent details region을 갱신한다.
- 필터로 현재 선택 노드가 제거되면 첫 번째 남은 document로 선택을 정리하고, 결과가 없으면 명시적 빈 상태를 표시한다.
- `<details open aria-label="그래프 대신 목록 보기">` 안에 공개 문서별 제목 링크, 설명, outgoing 링크, incoming 링크를 정적 HTML로 모두 제공한다.
- seed80의 Geist, Quiet System 75% / Midnight Lab 25%, 한국어 UI, 12열 기반 8/4 graph layout을 유지했다.

## TDD Evidence

- 첫 unit RED: `src/lib/graph/filter.ts` 미존재로 `tests/unit/graph-filter.test.ts` 실패.
- 첫 browser RED: `/graph` route에 canvas가 없어 graph E2E 실패.
- accessibility RED: 선택 노드 대비 4.4:1과 중복 relation landmark를 axe가 검출. 남색 선택 텍스트와 heading/list 기반 관계 그룹으로 수정.
- lifecycle RED: desktop → mobile breakpoint 전환에서 wheel sensitivity 경고 2건과 Cytoscape `notify` null page error 1건 재현. 기본 wheel 설정 복원, synchronous deterministic layout, stop → destroy cleanup으로 수정.
- mobile initialization RED: canvas에 ego 초기화 증거가 없어 실패. media readiness gate와 `data-graph-initialized-mode="ego"` 계약으로 수정.

## Verification

Fresh final run:

- `npm test`: 15 files, 98 tests passed.
- `npm run check`: 0 errors, 0 warnings, 기존 `src/lib/content/schema.ts` Zod deprecation hint 1개.
- `npm run build`: 12 static pages built, Pagefind completed.
- `npx playwright test`: 25 tests passed, graph 6 cases 포함.
- graph axe: desktop 1440×1000 및 mobile 390×844 + reduced motion에서 violations 0.
- no-JS: 공개 문서 heading 4개, 각 문서의 `나가는 연결`/`들어오는 연결` 4쌍, base-aware normal links 확인.
- `git diff --check`: clean.

## Chrome Visual and Runtime Evidence

- Desktop 1440×1000: 8/4 workspace columns (`852px 426px`), canvas 3 layers, selected details와 3개 facet 표시, horizontal overflow 없음.
- Mobile 390×844: one-column workspace (`356px`), initial/active mode 모두 `ego`, canvas 3 layers, mobile menu 표시, horizontal overflow 없음.
- 최종 desktop → mobile breakpoint 전환 후 app-origin warnings/errors 0.
- 최신 screenshot inspection에서 graph legend, taxonomy shapes, focusable node list, details hierarchy와 모바일 stacking을 확인했다.

## Bundle and Static Output Evidence

- `dist/index.html`: KnowledgeGraph/Cytoscape reference 없음.
- `dist/graph/index.html`: KnowledgeGraph island reference 있음.
- emitted JS: KnowledgeGraph 10,608 bytes, async Cytoscape chunk 434,930 bytes (uncompressed build artifact).
- fallback relation links 12개 모두 `/astro-astro-personal-knowledge-base-digital/` base로 시작한다.

## Concerns

- Cytoscape chunk는 라이브러리 자체 때문에 uncompressed 약 435KB다. graph route에서만 비동기 로드되며 다른 페이지 비용은 없다.
- build/check의 Zod `.url()` deprecation hint는 기존 Task 2 코드에서 발생하며 Task 11 범위 밖이라 변경하지 않았다.
