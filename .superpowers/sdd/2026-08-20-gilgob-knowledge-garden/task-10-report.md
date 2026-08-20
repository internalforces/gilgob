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
