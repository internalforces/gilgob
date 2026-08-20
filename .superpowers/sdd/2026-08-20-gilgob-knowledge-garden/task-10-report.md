# Task 10 구현 보고서: 연결된 스킬 트리

## 상태

완료. strict recursive YAML 계약, 공개 Knowledge 링크 검증, 명시 상태 기반 전체·분야별 진척 집계와 접근 가능한 정적 우선 스킬 트리를 구현했다. Task 11 이후 범위는 변경하지 않았다.

## 구현 내용

- Task 8 fix에서 만든 `src/lib/skills/schema.ts`를 재사용하고 `SkillProgress`, `SkillTreeData` 타입을 확장했다.
- `content/data/skills.yaml`에 컴퓨터 과학, 데이터와 수학, 인공지능, 연구 분야와 재귀 하위 분야를 한국어로 작성했다.
  - 8개 leaf 상태: 습득 2, 학습 중 4, 예정 2
  - 가중 진척: `(2 + 4 × 0.5) ÷ 8 = 50%`
  - related는 실제 공개 Knowledge ID `knowledge/database/b-tree-index`만 참조한다.
- `loadSkills(path, index)`가 YAML을 strict schema로 파싱하고 `ContentIndex.documents`에서 related ID를 검증한다.
  - 누락 문서는 빌드 오류다.
  - draft 또는 Knowledge가 아닌 문서도 빌드 오류다.
  - 오류는 현재 field ID, skill ID, related ID를 모두 포함한다.
- 순수 progress 계산을 브라우저 안전 모듈로 분리하고 `load-skills.ts`에서 계획의 public helper 계약을 다시 export한다.
- `/skills/`는 다음을 제공한다.
  - 전체 및 모든 분야의 상태 가중 진척과 완전한 progressbar ARIA
  - 실제 `ul > li` 재귀 목록을 source semantics로 사용하는 계층
  - SSR에서는 모두 펼쳐져 있고 hydration 뒤 실제 button으로 접고 펴는 static-first disclosure
  - `aria-expanded`, `aria-controls`, 한국어 accessible name, 네이티브 키보드 동작과 focus 유지
  - `습득`, `학습 중`, `예정` 텍스트와 색 이외의 점 형태 상태 신호
  - 제목이 표시되는 base-aware 일반 Knowledge anchor
- Task 8 홈의 optional loader가 별도 수정 없이 새 YAML을 감지해 `skills` source, 50%로 전환된다.
- seed 80 preflight의 Geist, Artistic Asymmetry radar, Quiet System 75% / Midnight Lab 25%, light-only 토큰, 큰 장 간격을 유지했다. 정보 전달에 불필요한 GSAP·마키·캐러셀은 추가하지 않았고 reduced motion에서 disclosure 아이콘 전환을 제거했다.

## TDD 증거

1. RED: `npm test -- tests/unit/skills.test.ts`
   - `src/lib/skills/load-skills` 모듈 부재로 예상한 import 실패를 확인했다.
2. GREEN: progress, 빈 집계, strict recursive schema, nested 분야 집계, 링크 경계, 실제 YAML load 8개 단위 테스트가 통과했다.
3. RED: 빌드 전 Chromium에서 `/skills/` 제목과 disclosure 부재를 확인했다.
4. GREEN: 스킬 페이지 구현 뒤 semantic hierarchy와 keyboard disclosure 테스트가 통과했다.
5. 접근성 RED: axe가 `습득` 텍스트의 3.47:1 대비를 검출했다.
6. 접근성 GREEN: 민트 점은 유지하고 텍스트를 ink와 혼합해 desktop/mobile axe 위반 0을 확인했다.
7. 홈 회귀 RED→GREEN: 기존 Knowledge fallback accessible name을 YAML skill-source accessible name으로 먼저 변경했고, YAML 추가 후 브라우저에서 실제 전환을 확인했다.

## 최종 검증

- `npm test`: 13 files, 84 tests passed.
- `npm run check`: 0 errors, 0 warnings, 기존 deprecation hint 1.
- `npm run build`: exit 0, 11 static pages built, `/skills/` 생성, Pagefind 공개 콘텐츠 4페이지 색인.
- `npx playwright test`: Chromium E2E 19 passed.
  - 스킬 tree/진척/link semantics
  - Enter disclosure와 focus 유지
  - desktop 1440×1000 axe 위반 0
  - mobile 390×844 axe 위반 0
  - 홈이 `스킬 트리 기준 전체 스킬 진척도`를 표시하는 integration regression
- 생성 HTML 확인:
  - 홈: `스킬 트리 기준 전체 스킬 진척도`, `aria-valuenow="50"`
  - 스킬 페이지: 전체 진척 50%, base-aware B-Tree Knowledge href
- `git diff --check`: passed.

## 시각 증거

Playwright Chromium full-page 캡처를 생성하고 직접 검토했다.

| Viewport | 캡처 | 검토 결과 |
| --- | --- | --- |
| 1440 × 1000 | `/tmp/gilgob-skills-desktop.png` (1440 × 3737) | 비대칭 hero와 radar, 전체/분야 진척 계층, 연결 링크, CTA 간격과 정렬 정상 |
| 390 × 844 | `/tmp/gilgob-skills-mobile.png` (390 × 3722) | hero 3줄, 세로 요약, nested 카드와 관련 링크 재배치, 가로 넘침 없음 |

두 화면 모두 한국어 UI, light-only 표면, 상태 텍스트와 신호점, 진행 막대가 명확했다. 키보드/focus 상태는 Chromium 자동화에서 별도로 확인했다.

## 우려 사항

- 기존 `src/lib/content/schema.ts`의 Zod `url()` deprecation hint 1건은 이번 범위 밖이라 변경하지 않았다.
- Pagefind 1.5.2의 한국어 stemming 미지원 안내는 기존과 동일하며 스킬 페이지 빌드나 관련 링크에는 영향을 주지 않는다.

---

## Fix round 1

### 리뷰 수정

- root `skillTreeDocumentSchema.superRefine`가 전체 recursive tree를 한 namespace로 순회한다.
  - field↔field, leaf↔leaf, field↔leaf ID 충돌을 모두 거부한다.
  - custom issue에 충돌 ID와 최초·현재 경로를 모두 기록한다.
  - ID를 영문자·숫자·하이픈·밑줄로 제한해 DOM identifier 계약을 명시한다.
- field disclosure의 DOM ID는 경로 문자열 조합이 아니라 전역 유일 field ID에서 직접 만든다. 서로 다른 경로가 같은 문자열로 합쳐져도 `aria-controls`가 충돌하지 않는다.
- related reference는 exact ID → exact slug → exact alias 순서로 해석한다.
  - 해석된 record가 draft 또는 Knowledge가 아니면 거부한다.
  - 성공한 reference는 canonical ContentRecord ID로 정규화하고 같은 문서를 여러 형식으로 참조하면 중복 제거한다.
  - 모든 실패 메시지는 field ID, skill ID, 원본 reference를 유지한다.
- canonical candidate selection을 `loadSkillsFromCandidates`로 통합했다.
  - `content/data/skills.yaml`이 `content/skills.yaml`보다 항상 먼저 평가된다.
  - canonical 후보가 strict schema나 public link 검증에 실패하면 오류를 보존하고 legacy 후보를 계속 시도한다.
  - `/skills/`와 홈은 같은 selection과 정규화된 `SkillTreeData.progress`를 소비한다.
- `stats.ts`의 별도 fs/YAML parser, 별도 strict schema 순회, 별도 가중치 공식을 제거했다. ContentIndex를 읽을 수 없는 경우와 모든 후보가 invalid인 경우의 Knowledge fallback은 유지한다.

### TDD 증거

1. schema/link/candidate RED: focused 22개 중 14개가 실패했다.
   - 중복 field, 중복 leaf, field↔leaf 충돌 3종이 모두 승인됐다.
   - DOM에 부적합한 ID가 승인됐다.
   - alias/slug로 찾은 draft·non-Knowledge가 missing으로 잘못 분류됐다.
   - slug/alias reference가 canonical ID로 정규화되지 않았다.
   - 공용 candidate loader와 새 홈 계약이 없었다.
2. 단계별 GREEN:
   - 전역 schema/DOM 계약 4/4
   - canonical related resolution/public 경계 5/5
   - candidate precedence/invalid continuation 2/2
   - 전체 focused loader/home 22/22
3. DOM collision RED: 전역 ID가 모두 다른 `a-b → c`, `a → b-c` tree를 SSR했을 때 controls 4개 중 unique target이 3개뿐이었다.
4. DOM collision GREEN: direct field ID target으로 변경 후 controls 4개가 모두 unique하고 존재하는 ID를 가리켰다.
5. 최종 focused: skill tree SSR, schema/loader, home signal 3 files, 23 tests passed.

### 최종 검증

- `npm test`: 14 files, 94 tests passed.
- `npm run check`: 0 errors, 0 warnings, 기존 deprecation hint 1.
- `npm run build`: exit 0, 11 static pages built, Pagefind 공개 콘텐츠 4페이지 색인.
- `npx playwright test`: Chromium E2E 19 passed.
  - nested list, related anchor, disclosure keyboard/focus 유지
  - 홈 YAML skill-source integration
  - desktop 1440×1000 및 mobile 390×844 axe 위반 0
- 생성 HTML 검사:
  - 홈과 `/skills/` 모두 explicit skill progress 50%
  - disclosure controls 7개, unique 7개, 누락 target 0개
- `git diff --check`: passed.

### 시각 증거

| Viewport | 캡처 | 결과 |
| --- | --- | --- |
| 1440 × 1000 | `/tmp/gilgob-skills-fix1-desktop.png` (1440 × 3737) | 기존 계층, radar, 전체·분야 진척, CTA 레이아웃 유지 |
| 390 × 844 | `/tmp/gilgob-skills-fix1-mobile.png` (390 × 3722) | 3줄 hero, nested card, 링크, 세로 요약과 무가로넘침 유지 |

### 남은 우려 사항

- 기존 Zod `url()` deprecation hint와 Pagefind 한국어 stemming 안내만 남아 있으며 fix round 변경과 무관하다.
