# gilgob

`gilgob`은 `internalforces`가 지식, 탐구, 프로젝트, 학습 기록을 관계로 연결해 가꾸는 한국어 정적 Knowledge Garden입니다. 저장소의 `content/`가 그대로 Obsidian Vault이자 Astro Content Collections의 원본이며, 별도의 CMS나 콘텐츠 복사 단계가 없습니다.

기본 공개 주소는 `https://internalforces.github.io/gilgob/`입니다. 기본 base path 계약은 저장소 이름과 같은 `/gilgob`입니다.

## 로컬 실행

Node.js 22와 npm이 필요합니다.

```bash
npm ci
npm run dev
```

개발 서버는 초안도 보여 줍니다. GitHub Pages와 같은 기본 경로로 프로덕션 결과를 확인하려면 다음을 실행합니다.

```bash
npm run build
npm run preview
```

## Obsidian에서 `content/` 열기

Obsidian에서 **Open folder as vault**를 선택한 뒤 저장소 루트가 아닌 `content/` 폴더를 엽니다. 공유 설정은 `content/.obsidian/`에 있으며 첨부 파일 폴더는 `attachments`, 템플릿 폴더는 `templates`로 지정되어 있습니다. 개인별 workspace 상태는 Git에서 제외됩니다.

새 글은 목적에 맞는 컬렉션 폴더 아래에 만듭니다.

- `content/knowledge/`: 정리된 개념과 재사용할 지식
- `content/explorations/`: 아직 결론이 나지 않은 질문과 탐구
- `content/projects/`: 프로젝트의 선택, 결과, 회고
- `content/logs/`: 날짜 중심의 짧은 학습 기록
- `content/portfolio/`: 직접 공유하는 링크 전용 취업 포트폴리오

## 다섯 글 템플릿

Obsidian의 Templates 플러그인에서 다음 파일을 선택합니다.

- `content/templates/knowledge.md`: `seed`, `growing`, `mastered`
- `content/templates/exploration.md`: `active`, `paused`, `complete`
- `content/templates/project.md`: `idea`, `building`, `maintained`, `archived`
- `content/templates/log.md`: 별도 `status`가 없는 학습 기록
- `content/templates/portfolio.md`: 직접 공유하는 링크 전용 포트폴리오

`knowledge`, `exploration`, `project`, `log` 템플릿을 적용한 뒤 제목, 설명, 분야, 날짜, 상태를 실제 값으로 바꾸고 알맞은 컬렉션 폴더에 저장합니다. 이 공개 문서는 파일 경로가 기본 slug가 되며 `slug`를 명시하면 그 값을 사용합니다.

포트폴리오는 공개 문서용 `category`, `status`, `slug` 규칙을 쓰지 않습니다. `title`, `description`, `shareId`, `project`, `targetRole`, `targetDomains`, `period`, `projectType`, `role`, `tags`, `updated`, `draft`를 작성하고, 필요하면 `repository`, `package`, `demo` HTTPS 링크를 추가합니다. `targetDomains`에는 확실한 1순위 `primary`와 하나 이상의 `subdomains`를 구분해 작성합니다. `shareId`는 파일명과 무관한 직접 공유 경로이며, 템플릿처럼 충분히 긴 임의형 접두사를 사용하면 우연한 발견을 줄일 수 있습니다. 다만 이는 인증이 아니므로 URL을 아는 사람은 열 수 있으며, 민감한 정보나 NDA 자료는 저장하지 마세요. 포트폴리오는 공개 목록, 사이트맵, RSS와 사이트 내 검색에서 제외됩니다.

## frontmatter 표

| 필드 | 필수 | 형식과 의미 |
| --- | --- | --- |
| `title` | 예 | 비어 있지 않은 문서 제목 |
| `description` | 예 | 목록, 검색, SEO에 쓰는 한두 문장 설명 |
| `category` | 예 | 분야 이름 문자열 |
| `tags` | 예 | YAML 문자열 배열, 없으면 `[]` |
| `created` | 예 | `YYYY-MM-DD` |
| `updated` | 아니요 | 수정일 `YYYY-MM-DD`, 없으면 `created` 사용 |
| `draft` | 예 | 초안은 `true`, 공개는 `false` |
| `aliases` | 예 | 위키링크 별칭 배열, 없으면 `[]` |
| `featured` | 예 | 홈 주요 항목 노출 여부 |
| `slug` | 아니요 | 파일 경로 대신 사용할 URL 경로 |
| `nextQuestions` | 아니요 | 다음 탐구 질문 문자열 배열 |
| `status` | 컬렉션별 | 로그를 제외한 세 컬렉션의 위 상태 값 |
| `repository` | 프로젝트만 선택 | 유효한 `https://` 저장소 URL |

필수 필드 누락, 잘못된 상태, 중복 slug·제목·별칭, 스킬 트리의 잘못된 문서 참조는 빌드를 실패시킵니다.

## 위키링크와 첨부 규칙

본문에서 `[[문서 제목]]`, `[[문서 제목|표시 이름]]`, `[[문서 제목#소제목]]`을 사용할 수 있습니다. 해석 순서는 상대 파일 경로, 정확한 제목, 정확한 별칭, 대소문자를 무시한 제목·별칭입니다. 해결되지 않은 링크는 공개 빌드를 멈추지 않고 아직 작성되지 않은 문서로 표시됩니다.

첨부 파일은 `content/attachments/` 아래에 두고 `![[attachments/파일명.png]]`처럼 삽입합니다. 빌드가 이를 base-aware `content-assets` 경로로 복사합니다. 선택적 첨부가 없으면 경고만 출력하므로, 게시 전에 화면과 빌드 로그를 함께 확인합니다.

## 초안 게시

작성 중에는 frontmatter의 `draft: true`를 유지합니다. 로컬 개발 서버에서는 초안을 확인할 수 있지만 프로덕션 목록, 본문 경로, RSS, 사이트맵과 검색 색인에서는 제외됩니다. 게시할 때 내용을 검토하고 `draft: false`로 바꾼 뒤 전체 검증을 실행합니다.

## 테스트

커밋 전에 전체 정적 품질 게이트를 실행합니다.

```bash
npm run verify
npx playwright install chromium
npm run test:e2e
```

`npm run verify`는 Astro 타입 검사, 단위·통합 테스트, 정적 빌드와 Pagefind 색인을 실행합니다. Pagefind는 한국어 stemming(어근 확장)을 지원하지 않으므로 조사나 활용형을 자동으로 같은 단어로 묶지 못합니다. 검색이 누락되면 제목·태그에 실제로 쓰인 더 정확한 단어로 검색합니다.

## GitHub Pages 설정

저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다. `.github/workflows/deploy.yml`은 다음 경우 검증, 빌드, 브라우저 테스트 후 Pages artifact를 배포합니다.

- `main` 브랜치 push
- 수동 `workflow_dispatch`
- 매일 03:17 KST (`17 18 * * *` UTC)

Workflow는 Node.js 22와 `npm ci`를 사용하고 기본값으로 다음 환경을 빌드 단계에만 전달합니다.

```text
SITE_URL=https://internalforces.github.io
BASE_PATH=/gilgob
```

GitHub가 자동 발급하는 `GITHUB_TOKEN`은 빌드 시 공개 기여 통계와 공개 이벤트를 읽는 데만 사용하며 브라우저 번들에 포함하지 않습니다. 이 토큰은 현재 저장소 범위의 기본 권한만 가지므로 다른 비공개 저장소의 활동이나 비공개 기여를 완전하게 집계한다고 가정하면 안 됩니다. Pull Request 이벤트에서는 배포 workflow가 실행되지 않아 fork의 secret을 가정하지 않습니다.

통계 결과는 `.cache/github-stats.json`에 저장되고 날짜별 Actions cache로 복구됩니다. API 제한이나 일시적 오류가 있으면 마지막 캐시를 오래된 데이터로 표시하며, 캐시도 없으면 안전한 빈 상태로 빌드합니다. 캐시 파일은 공개 저장소에 커밋하지 않으며 공개 GitHub 데이터만 담습니다.

## `/gilgob` 경로 확인

이 저장소의 기본 Pages 경로는 `/gilgob`입니다. 로컬에서 배포 환경과 같은 설정을 명시적으로 확인하려면 다음을 실행합니다.

```text
SITE_URL=https://internalforces.github.io
BASE_PATH=/gilgob
```

로컬에서 먼저 확인하려면 다음을 실행합니다.

```bash
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run verify
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run test:e2e
```

저장소 이름을 바꾸면 `src/config/site.ts`, workflow와 테스트 helper의 기본 base path도 같은 이름으로 변경합니다.

## 커스텀 도메인 전환

GitHub Pages 설정에서 커스텀 도메인과 DNS를 먼저 구성합니다. 루트에서 제공되는 `https://garden.example.com/` 같은 도메인이라면 workflow의 두 build 환경 블록을 다음처럼 바꿉니다.

```text
SITE_URL=https://garden.example.com
BASE_PATH=
```

로컬 검증도 같은 값으로 수행합니다.

```bash
SITE_URL=https://garden.example.com BASE_PATH='' npm run verify
SITE_URL=https://garden.example.com BASE_PATH='' npm run test:e2e
```

서브경로를 사용하는 커스텀 호스팅이라면 `BASE_PATH`에 그 경로를 명시합니다. 변경 후 canonical URL, Open Graph 이미지, RSS, `robots.txt`, sitemap과 내부 링크가 새 도메인·경로를 사용하는지 확인합니다.
