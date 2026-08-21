# gilgob AI Development Harness Design

## 목적

`gilgob`에서 AI 에이전트가 매 작업마다 프로젝트 구조와 문서 규칙을 다시 추론하지 않도록 AI Development Harness v1.1을 도입한다. 하네스는 개발 작업뿐 아니라 지식 정원 콘텐츠의 작성, 검토, 정리, 이동, 병합과 삭제를 일관된 절차로 수행하게 한다.

## 현재 프로젝트 사실

- 기존 단일 저장소이며 프로젝트명은 `gilgob`이다.
- TypeScript, Astro 7, Preact를 사용하고 콘텐츠는 Markdown 또는 MDX로 작성한다.
- 데이터베이스와 별도 CMS 없이 `content/`가 Obsidian Vault이자 Astro Content Collections 원본이다.
- npm을 사용하고 GitHub Actions에서 검증한 뒤 GitHub Pages에 배포한다.
- 콘텐츠 컬렉션은 `knowledge`, `explorations`, `projects`, `logs`, `portfolio` 다섯 종류다.
- 현재 확정된 제품 로드맵은 없다. 하네스의 `roadmap.md`는 계획이 생길 때 갱신하는 운영 문서로 둔다.

## 선택한 구조

Standard Harness를 저장소에 통합하되 자동 탐색성과 문서 격리를 함께 확보한다.

```text
AGENTS.md                         # 자동 인식되는 짧은 진입점
gilgob-harness/
├── .harness-version
├── AGENTS.md                    # 전체 프로젝트 헌법
├── ORCHESTRATOR.md
├── commands.md
├── standards.md
├── tech-stack.md
├── dependencies.md
├── roadmap.md
├── memory/
├── tasks/
├── prompts/
├── reports/
└── docs/
    └── content-authoring/
        ├── README.md
        ├── knowledge.md
        ├── exploration.md
        ├── project.md
        ├── log.md
        └── portfolio.md
```

루트 `AGENTS.md`는 프로젝트의 핵심 금지사항과 `gilgob-harness/AGENTS.md`를 읽으라는 지시만 담는다. 상세 운영 규칙은 하네스 본체에 한 번만 기록해 중복과 불일치를 피한다.

## 활성 역할

| 역할 | 책임 | 주요 산출물 | 사용자 승인 조건 |
|---|---|---|---|
| Planner | 요구사항 분해와 우선순위 지정 | `tasks/` | 분해할 수 없는 대형 작업 |
| Architect | 구조와 기술 의사결정 | `memory/architecture.md`, ADR | 새 의존성·인프라 변경 |
| Implementer | 코드 구현 | 코드와 완료 작업 | 공개 인터페이스·보안 변경 |
| Reviewer | 품질 및 규칙 준수 검토 | `reports/review-*` | 병합·배포 |
| Researcher | 공식 근거 조사와 대안 비교 | `reports/research-*` | 없음 |
| Debugger | 재현과 근본 원인 분석 | `memory/known-issues.md` | 외부 운영 상태 접근 |
| Tester | 단위·통합·E2E 검증 | 테스트와 검증 보고 | 없음 |
| Content Writer | 새 문서 작성과 기존 문서 개선 | `content/**/*.md(x)` | 민감하거나 확인되지 않은 내용 공개 |
| Content Curator | 중복 탐지, 분류, 이동, 병합, 보관과 삭제 제안 | 정리 보고서와 승인된 콘텐츠 변경 | 문서 이동·병합·삭제, 공개 URL 변경 |

`Content Curator`는 파괴적 작업 전에 대상 문서, 연결된 위키링크, 백링크, 첨부 파일, 기존 및 변경 후 슬러그를 보고한다. 실제 삭제는 사용자가 정확한 대상을 승인한 뒤 수행한다. 삭제 후에는 전체 콘텐츠 인덱스와 빌드를 검증한다.

## 콘텐츠 작성 하네스

### 공통 가이드

`docs/content-authoring/README.md`는 다음 흐름을 정의한다.

1. 목적에 맞는 컬렉션을 선택한다.
2. `content/templates/`의 해당 템플릿을 복사한다.
3. 스키마에 맞는 frontmatter를 작성한다.
4. 제목·별칭·슬러그 중복을 확인한다.
5. 위키링크, 첨부, 관련 태그와 다음 질문을 연결한다.
6. 작성 중에는 `draft: true`를 유지한다.
7. 종류별 체크리스트와 `npm run verify`를 통과한 뒤 게시한다.

공통 가이드는 안전한 상대 슬러그, HTTPS 외부 링크, 첨부 경로, 위키링크 해석 순서, 공개 문서가 초안을 링크할 때의 동작, 중복 제목·별칭 금지를 설명한다.

### 종류별 가이드

- `knowledge.md`: 재사용할 개념을 질문, 핵심 설명, 예시, 오해, 연결 지식과 다음 질문으로 정리한다. `seed → growing → mastered`의 상태 기준을 둔다.
- `exploration.md`: 아직 결론이 없는 질문에 대해 가설, 조사 범위, 근거, 반례, 현재 판단과 다음 실험을 기록한다. `active → paused | complete`의 전환 기준을 둔다.
- `project.md`: 문제, 제약, 결정, 구조, 구현 범위, 검증 결과, 운영 상태와 회고를 기록한다. `idea → building → maintained → archived`의 전환 기준을 둔다.
- `log.md`: 날짜 중심으로 배운 내용, 시도한 것, 막힌 점, 확인한 사실과 다음 행동을 짧게 남긴다. 별도 `status`를 사용하지 않는다.
- `portfolio.md`: 목표 직무와 산업 분야에 맞춰 문제, 본인 기여, 기술적 결정, 검증 가능한 결과, 한계와 다음 개선을 작성한다. 직접 공유 전용이며 인증 기능이 아니고 검색·RSS·사이트맵에서 제외된다는 점을 명시한다.

각 가이드는 필수·선택 frontmatter 표, 권장 본문 골격, 좋은 작성 기준, 금지 패턴, 게시 전 체크리스트와 실제 파일 예시 링크를 포함한다.

## 프롬프트와 작업 흐름

`prompts/content-writing.md`는 Content Writer가 문서 종류를 판별하고 해당 가이드만 읽은 뒤 템플릿 기반으로 초안을 만드는 절차를 정의한다. 확인되지 않은 사실은 단정하지 않으며, 외부 근거가 필요한 경우 Researcher 흐름으로 전환한다.

`prompts/content-curation.md`는 Content Curator가 다음 순서로 작업하게 한다.

```text
목록화 → 중복·노후·잘못된 분류 탐지 → 링크 영향 분석
→ 유지/개선/이동/병합/삭제 제안 → 사용자 승인
→ 최소 변경 → npm run verify → 결과 보고
```

문서 작성이나 정리 과정에서 코드 동작 변경이 필요하면 Content 역할이 직접 수정하지 않고 Planner 또는 Implementer 흐름으로 넘긴다.

## 운영 문서 원칙

- Harness Version은 `1.1`, Tier는 `standard`로 기록한다.
- 루트 진입점과 `gilgob-harness/` 아래의 모든 하네스 운영 문서는 영어로 작성한다.
- 모든 하네스 문서는 Purpose, Owner, Update Trigger, Harness Version 헤더를 가진다.
- 로드맵에는 임의의 마일스톤이나 기능을 만들지 않는다. 현재 계획 없음과 갱신 조건만 기록한다.
- `tasks/`에는 존재하지 않는 기능 백로그를 채우지 않는다.
- `memory/`에는 저장소에서 확인한 현재 상태와 이미 채택된 결정만 기록한다.
- 외부 의존성 추가, 배포, 공개 URL 변경, 문서 삭제와 비밀정보 접근은 사용자 승인 게이트로 둔다.

## 검증

생성 후 다음을 확인한다.

1. 모든 하네스 Markdown 문서에 통일 헤더가 있는지 검사한다.
2. 미치환 대괄호 토큰이나 미완성 표기가 남아 있지 않은지 검사한다.
3. 하네스 내부 상대 링크와 기존 템플릿·예시 문서 경로가 존재하는지 검사한다.
4. 루트 `AGENTS.md`가 하네스 진입 순서를 정확히 가리키는지 확인한다.
5. 콘텐츠 작성 가이드가 `src/lib/content/schema.ts` 및 `README.md`의 현재 계약과 일치하는지 대조한다.
6. 문서만 추가하므로 코드 테스트 대신 `npm run check`와 `npm run build`를 실행해 콘텐츠 계약과 정적 빌드를 검증한다.

## 범위 밖

- 기존 `content/templates/*.md` 본문 변경
- 기존 콘텐츠 문서 재작성 또는 삭제
- 새 제품 기능이나 로드맵 항목 생성
- 배포 또는 GitHub 설정 변경
- 새 npm 의존성 추가
