# 채용 담당자용 웹·PDF 프로젝트 포트폴리오 설계

## 목적

기존 링크 전용 프로젝트 포트폴리오를 채용 담당자가 짧은 시간에 판단할 수 있는 구조로 개편한다. 하나의 Astro 콘텐츠 문서를 웹과 PDF의 공통 원본으로 사용하며, 웹 URL은 이력서에 첨부하고 PDF는 실제 지원의 주 제출물로 사용한다.

첫 적용 대상은 Signal Hub다. 이후 최대 세 개의 서로 다른 직무 프로젝트를 같은 구조로 작성할 수 있어야 한다.

## 범위

이번 작업에 포함한다.

- 손명관의 공통 지원자 정보
- 프로젝트별 직무와 도메인에 특화된 웹 포트폴리오
- A4 세로 한 페이지 안에 독립 화면 두 개를 위아래로 배치한 인쇄 레이아웃
- 브라우저의 `PDF로 저장` 동작
- 저장소 명령을 통한 재현 가능한 공식 PDF 생성
- Signal Hub 문서의 채용 중심 콘텐츠 개편
- 웹, 인쇄, PDF 페이지 수, PDF 시각 결과 검증

이번 작업에 포함하지 않는다.

- 소개 PDF와 목차 PDF
- 여러 PDF의 합본과 순서 관리
- 이력서 생성
- 포트폴리오 목록 페이지
- 전화번호 공개
- 비밀번호 인증이나 접근 제어
- 사이트에서 미리 생성한 PDF 파일의 직접 다운로드

## 개인정보와 공개 범위

공통 지원자 정보는 다음과 같다.

| 항목 | 값 |
| --- | --- |
| 이름 | 손명관 |
| 이메일 | `tarmk0801@gmail.com` |
| GitHub | `https://github.com/internalforces` |

공통 직함은 두지 않는다. 프로젝트가 백엔드가 아닐 수 있으므로 각 문서의 `targetRole`을 화면과 PDF에 표시한다. 전화번호는 공개 저장소와 인증 없는 URL에 남기지 않는다.

기존 미노출 계약은 유지한다. 포트폴리오는 URL을 아는 사람이 열 수 있지만 사이트 내 검색, 공개 목록, RSS, sitemap, 지식 그래프와 일반 내비게이션에는 나타나지 않는다.

## 단일 콘텐츠 원본

각 프로젝트의 Markdown 문서가 웹과 PDF의 유일한 콘텐츠 원본이다. PDF용 문서를 별도로 복사하지 않는다.

기존 포트폴리오 frontmatter에 다음 구조화 필드를 추가한다.

```ts
interface PortfolioMetric {
  value: string;
  label: string;
  detail: string;
}

interface PortfolioStory {
  problem: string;
  approach: string;
  result: string;
}

interface PortfolioCapability {
  title: string;
  summary: string;
  evidence: string;
  visual?: 'trend' | 'threshold' | 'window';
}

interface PortfolioArchitectureNode {
  label: string;
  title: string;
  detail: string;
}

interface PortfolioDecision {
  title: string;
  implementation: string;
  impact: string;
}

interface PortfolioProof {
  value: string;
  label: string;
}

interface PortfolioValidation {
  steps: string[];
  proofs: PortfolioProof[];
  command?: string;
}
```

프로젝트 문서는 다음 계약을 만족해야 한다.

- `headline`: 채용 담당자가 이해할 수 있는 한 문장
- `metrics`: 정확히 네 개
- `story`: 문제, 선택, 결과
- `capabilities`: 정확히 세 개
- `ownership`: 직접 담당한 범위
- `architecture`: 두 개 이상 네 개 이하의 순서가 있는 노드
- `decisions`: 정확히 세 개
- `validation.steps`: 세 개 이상 여섯 개 이하
- `validation.proofs`: 정확히 네 개
- `currentScope`: 현재 지원 범위와 제약
- `nextStep`: 다음 개선과 유지할 품질 계약

`visual`은 Signal Hub의 세 탐지 기능에만 사용한다. 다른 프로젝트에서 생략하면 장식 그래픽 대신 제목, 설명과 근거를 크게 표시한다. 상세 기술 설명과 회고는 기존 Markdown 본문에 유지한다.

템플릿과 README도 이 계약에 맞춰 갱신한다. 필수 값이나 고정 개수가 맞지 않으면 콘텐츠 스키마 검증에서 빌드를 실패시킨다.

## Signal Hub 콘텐츠

Signal Hub의 핵심 채용 메시지는 다음과 같다.

> 재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.

첫 화면은 다음 정보를 보여 준다.

- 최초 커밋 2026-07-27부터 현재까지 약 4주
- 자동화 테스트 83개
- 앱, 커넥터와 패키지를 합친 워크스페이스 9개
- npm 공개 버전 0.3.0
- 운영 플랫폼 전체를 만들기 전에 규칙을 검증하기 어려웠던 문제
- 로컬 CSV와 명시적인 규칙 기반 탐지기에 범위를 집중한 선택
- 동일 입력 재현, 점수순 JSON과 SQLite 기록을 얻는 결과
- 연속 변화율, 임계값 통과, 시간 윈도우 변화 기능
- 설계, 입력, 분석, 저장, CLI와 배포의 직접 담당 범위

두 번째 화면은 다음 정보를 보여 준다.

- CSV Connector에서 탐지·점수화를 거쳐 SQLite와 JSON으로 이어지는 구조
- 결정론적 ID, SQLite 멱등 저장, 단방향 패키지 경계
- build, 83 tests, typecheck, audit, isolated install, real CLI run 검증 단계
- 격리된 소비자 환경에서 신호 2개 생성
- 24시간 변화율 25% 확인
- 소비자 작업 폴더에 `data.db` 한 개 생성
- 배포 패키지 내부 DB 파일 0개 확인
- 공개 CLI는 CSV와 로컬 실행으로 제한된다는 현재 범위
- CSV 파싱과 외부 커넥터 경계를 강화하는 다음 단계

모든 수치는 공개 저장소의 현재 코드, 테스트와 릴리스 검증 스크립트로 확인할 수 있는 사실만 사용한다.

## 웹 정보 구조

포트폴리오는 기존 `BaseLayout`의 메타데이터와 접근성 기반을 재사용하되 일반 사이트 chrome을 숨긴다.

상단 전용 바는 다음 항목만 보여 준다.

- 손명관
- GitHub
- 이메일
- PDF로 저장

본문은 다음 순서다.

1. 독립 화면 1: 문제, 선택, 결과, 성과 수치, 주요 기능과 담당 범위
2. 독립 화면 2: 아키텍처, 기술 판단, 검증 결과, 현재 범위와 다음 단계
3. 상세 Markdown 케이스 스터디
4. 이메일과 GitHub로 연결되는 채용 문의 영역

데스크톱에서는 두 화면이 넓은 단일 열로 이어진다. 모바일에서는 표와 다열 콘텐츠를 한 열 또는 두 열로 재배치하며 가로 스크롤을 만들지 않는다. 웹 링크는 클릭할 수 있지만 인쇄에서는 URL을 사람이 읽을 수 있는 짧은 형태로 표시한다.

웹 전용 등장 효과는 콘텐츠 가독성을 방해하지 않는 짧은 이동과 투명도 변화로 제한한다. `prefers-reduced-motion`에서는 모든 콘텐츠를 처음부터 최종 상태로 표시한다. 인쇄 결과에는 애니메이션 상태가 영향을 주지 않는다.

## A4 2-up 인쇄 구조

실제 PDF는 A4 세로 한 페이지다. 프로젝트 개요와 기술 근거를 별도 페이지로 만들지 않고, 독립된 가로형 화면 두 개를 위와 아래에 배치한다.

- 용지: A4 portrait
- 바깥 여백: 약 8mm
- 두 화면 사이 간격: 약 4mm
- 각 화면: 자체 머리말, 본문과 꼬리말을 가진 독립 영역
- 기본 본문: 8.5pt에서 9pt
- 표와 보조 문구: 최소 8pt
- 화면 제목: 약 22pt
- 페이지 수: 정확히 한 페이지

화면 1은 무엇을 만들었고 어떻게 동작하는지를 설명한다. 화면 2는 어떤 판단을 했고 결과물을 왜 신뢰할 수 있는지를 설명한다.

인쇄 디자인은 흰색 바탕과 얇은 회색 경계가 기본이다. 파란색은 제목, 수치, 선과 작은 라벨에만 사용한다. 넓은 검정이나 진한 파란 배경을 사용하지 않는다. 배경 그래픽을 끈 브라우저 인쇄와 흑백 프린터에서도 정보 구조가 유지되어야 한다.

`@media print`에서는 다음을 숨긴다.

- 웹 전용 상단 바
- PDF로 저장 버튼
- 상세 Markdown 본문
- 채용 문의 영역
- 애니메이션과 웹 전용 장식

인쇄 전용 컨테이너는 두 화면을 한 페이지 안에 고정하며 화면 내부 콘텐츠가 잘리거나 다음 페이지로 넘어가지 않게 한다. 글씨를 임의로 축소해 한 페이지를 맞추지 않고, 계약을 넘는 콘텐츠는 생성 검증을 실패시킨다.

## PDF 생성 흐름

브라우저의 `PDF로 저장` 버튼은 `window.print()`를 호출한다. 이는 빠른 예비 출력 경로다.

공식 제출본은 다음 명령으로 생성한다.

```bash
npm run portfolio:pdf -- --share-id 8c5e1a7d3b92-signal-hub
```

명령은 다음 순서로 동작한다.

1. 프로덕션 사이트를 빌드한다.
2. 사용 가능한 로컬 포트에서 Astro preview를 시작한다.
3. 요청한 `shareId`의 포트폴리오 경로를 Chromium으로 연다.
4. 웹 폰트와 정적 자산 로딩이 끝날 때까지 기다린다.
5. CSS page size를 우선하는 A4 PDF를 임시 파일로 생성한다.
6. PDF가 정확히 한 페이지인지 검사한다.
7. 필수 텍스트가 렌더링된 페이지에 존재하는지 확인한다.
8. 검증된 파일만 최종 경로로 원자적으로 이동한다.
9. 성공과 실패에 관계없이 preview와 Chromium을 종료한다.

최종 출력 경로는 다음과 같다.

```text
output/pdf/sonmyeonggwan-signal-hub-project-portfolio.pdf
```

`output/pdf`는 생성 결과 디렉터리이며 소스 콘텐츠가 아니다. 기존 결과가 있더라도 새 임시 파일의 검증이 끝나기 전에 덮어쓰지 않는다.

페이지 수 검증에는 `pdf-lib` 개발 의존성을 사용한다. 실제 텍스트와 시각 품질 검증에는 Codex PDF 런타임의 `pypdf`, Poppler `pdftoppm`과 `pdfinfo`를 사용한다.

## 오류 처리

다음 조건에서는 최종 PDF를 만들지 않고 비정상 종료한다.

- `--share-id`가 없거나 형식이 잘못됨
- 해당 포트폴리오가 없음
- 문서가 초안이어서 프로덕션 경로가 없음
- Astro 빌드 실패
- preview 시작 또는 페이지 로딩 실패
- Chromium 또는 Playwright 브라우저 없음
- 폰트나 필수 자산 로딩 실패
- PDF 페이지 수가 한 페이지가 아님
- 필수 텍스트가 PDF에 없음

Playwright Chromium이 없으면 다음 복구 명령을 안내한다.

```bash
npx playwright install chromium
```

## 테스트와 검증

### 콘텐츠 스키마

- 새 구조의 유효한 문서를 허용한다.
- 고정 개수의 metrics, capabilities, decisions와 proofs를 검증한다.
- architecture와 validation steps의 최소·최대 개수를 검증한다.
- 기존 HTTPS 링크와 안전한 `shareId` 계약을 유지한다.
- 포트폴리오 템플릿이 같은 스키마를 통과한다.

### 웹 통합

- 손명관, 이메일과 프로젝트별 `targetRole`을 렌더링한다.
- GitHub, npm과 기술 문서 링크를 유지한다.
- PDF로 저장 버튼이 `window.print()`를 호출한다.
- 일반 사이트 내비게이션과 검색을 포트폴리오에서 렌더링하지 않는다.
- noindex, Pagefind 제외, sitemap·RSS·공개 인덱스 제외 계약을 유지한다.

### E2E와 접근성

- 데스크톱과 모바일에서 가로 overflow가 없다.
- 키보드로 링크와 PDF 버튼에 접근할 수 있다.
- 자동 접근성 검사에서 serious 이상 위반이 없다.
- reduced motion에서 콘텐츠가 최종 상태로 보인다.
- print media에서 독립 화면 두 개만 보이고 웹 전용 영역은 숨는다.

### 실제 PDF

- 공식 명령이 예상 경로에 PDF를 만든다.
- `pdf-lib` 기준 한 페이지다.
- `pypdf` 텍스트 추출에 손명관, Signal Hub, 이메일과 핵심 성과가 있다.
- `pdftoppm`으로 렌더링한 PNG에서 잘림, 겹침, 빈 화면과 넓은 어두운 면이 없다.
- 최신 렌더링 이미지를 직접 시각 검토한 뒤에만 완료로 판단한다.

## 완료 기준

- 웹 첫 화면에서 지원자, 프로젝트 가치와 네 개의 근거를 바로 이해할 수 있다.
- 두 번째 화면에서 아키텍처, 기술 판단과 실제 설치 검증을 확인할 수 있다.
- 브라우저 인쇄와 자동 생성 PDF가 같은 두 화면을 사용한다.
- 자동 생성 PDF는 A4 세로 한 페이지이며 독립 화면 두 개가 잘리지 않는다.
- 컬러와 흑백 출력에서 읽을 수 있고 넓은 어두운 면이 없다.
- 다른 직무의 프로젝트가 공통 지원자 정보와 프로젝트별 `targetRole`을 조합해 같은 구조를 사용할 수 있다.
- 기존 링크 전용 미노출 계약과 공개 콘텐츠 격리가 유지된다.
