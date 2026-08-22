---
title: "Signal Hub · CSV 시계열 분석 CLI"
description: "CSV 시계열 데이터를 규칙 기반 신호로 바꾸고 SQLite에 중복 없이 저장하는 CLI를 설계해 npm에 배포했다."
shareId: "8c5e1a7d3b92-signal-hub"
project: "signal-hub"
targetRole: "백엔드 개발자"
targetDomains:
  primary: "시계열 데이터 처리"
  subdomains:
    - "개발자 도구"
    - "로컬 데이터 분석"
period: "2026.08–현재"
projectType: "개인 프로젝트"
role:
  - "아키텍처 설계"
  - "CSV 입력부터 탐지·점수화·저장·JSON 출력까지 구현"
  - "릴리스 검증과 npm 배포"
tags:
  - "TypeScript"
  - "SQLite"
  - "CLI"
updated: 2026-08-22
draft: false
repository: "https://github.com/internalforces/SignalHub"
package: "https://www.npmjs.com/package/csv-to-signal"
headline: "CSV 시계열 데이터를 신호로 바꾸는 CLI를 설계해 npm에 배포했습니다."
metrics:
  - value: "0.3.0"
    label: "npm 공개 버전"
    detail: "Node.js 20 · 22 · 24"
  - value: "83"
    label: "자동화 테스트"
    detail: "15개 파일"
  - value: "9"
    label: "워크스페이스"
    detail: "1 CLI · 3 커넥터 · 5 패키지"
story:
  problem: "시계열 규칙 하나를 시험하려고 수집 서버와 대시보드까지 만들 수는 없었습니다."
  approach: "입력은 CSV, 실행은 로컬 CLI로 좁히고 탐지 규칙을 코드로 작성했습니다."
  result: "같은 입력을 다시 실행해도 같은 ID를 만들고 중복 저장하지 않습니다."
capabilities:
  - title: "직전 값과 비교"
    summary: "이전 값과 현재 값의 변화율을 계산합니다."
    evidence: "샘플 결과 +25% · -20%"
    visual: "trend"
  - title: "임계값 통과 찾기"
    summary: "값이 기준을 아래에서 위로 넘는 시점을 찾습니다."
    evidence: "방향 · 발생 시점 포함"
    visual: "threshold"
  - title: "지정 시점과 비교"
    summary: "최신 값과 지정 시간 전 관측값을 비교합니다."
    evidence: "24시간 옵션 지원"
    visual: "window"
ownership:
  - "모노레포·의존성 설계"
  - "탐지·점수화 구현"
  - "SQLite·JSON 출력"
  - "CLI 테스트·npm 배포"
architecture:
  - label: "입력"
    title: "CSV 커넥터"
    detail: "행을 검증하고 시계열 값으로 정규화"
  - label: "처리"
    title: "탐지기 + 점수"
    detail: "명시한 규칙으로 신호와 점수를 생성"
  - label: "출력"
    title: "SQLite + JSON"
    detail: "중복 없이 저장하고 점수순으로 출력"
decisions:
  - title: "입력값으로 ID 생성"
    implementation: "탐지기 설정과 입력값으로 신호 ID를 만듭니다."
    impact: "같은 CSV와 옵션에는 같은 ID가 생깁니다."
  - title: "같은 신호는 한 번만 저장"
    implementation: "신호 ID를 기본키로 두고 INSERT OR IGNORE로 저장합니다."
    impact: "재실행해도 신호 행이 늘지 않습니다."
  - title: "의존성 방향 제한"
    implementation: "입력→코어→저장·출력 순서로만 참조합니다."
    impact: "SQLite 코드는 저장 패키지에만 둡니다."
validation:
  steps:
    - "빌드"
    - "테스트 83개"
    - "타입 검사"
    - "감사"
    - "격리 설치"
    - "CLI 실행"
  proofs:
    - value: "2건"
      label: "샘플 CSV에서 생성된 신호"
    - value: "25%"
      label: "샘플에서 확인한 최대 변화율"
    - value: "실행 디렉터리"
      label: "data.db 생성 위치"
  command: "pnpm release:check"
currentScope: "CSV 입력과 로컬 CLI를 지원합니다. 외부 서비스 커넥터는 CLI에서 사용할 수 없습니다."
nextStep: "다음은 따옴표와 쉼표가 있는 CSV 입력 지원입니다."
---

## 한눈에 보기

Signal Hub는 시간 정보가 있는 CSV를 읽어 규칙에 맞는 신호를 찾고, 점수를 매겨 SQLite와 JSON으로 내보내는 로컬 CLI다. 서버나 대시보드 없이 시계열 규칙을 시험할 수 있도록 만들었으며, `csv-to-signal` 0.3.0으로 npm에 공개했다.

## 입력과 실행 방식

CLI가 받는 CSV 열은 `metricId`, `timestamp`, `value` 세 개다. 타임스탬프를 UTC로 정규화한 뒤 연속 변화율, 임계값 통과, 지정 시간 전후의 변화를 계산한다. 결과는 점수순 JSON으로 출력하고, 관측값과 신호는 명령을 실행한 디렉터리의 `data.db`에 저장한다.

## 직접 구현한 범위

CSV 파싱부터 탐지, 점수화, SQLite 저장, JSON 출력까지 구현했다. 모노레포 안에서는 입력→코어→저장·출력 순서로만 의존하게 구성하고, SQLite 접근은 저장 패키지에 모았다.

## 다시 실행해도 같은 결과를 만드는 방법

신호 ID는 탐지기 설정과 입력값으로 만든다. 같은 CSV와 옵션으로 실행하면 같은 신호를 식별할 수 있다. SQLite에서는 이 ID를 기본키로 사용하고 `INSERT OR IGNORE`로 저장해, 같은 입력을 다시 처리해도 신호 행을 추가하지 않는다.

## 배포 전 확인

`pnpm release:check`로 빌드, 자동화 테스트 83개, 타입 검사, 의존성 감사, 패키지 구성 검사를 실행한다. 이어서 만든 패키지를 격리된 디렉터리에 설치하고 실제 CLI 명령까지 실행한다. 이 절차를 통과한 `csv-to-signal` 0.3.0은 Node.js 20, 22, 24를 지원한다.

## 현재 제한

CSV 파서는 따옴표로 감싼 값이나 이스케이프된 쉼표를 처리하지 않는다. 실행 환경은 로컬 CLI로 한정되며, 저장소에 있는 GitHub와 CoinGecko 커넥터는 공개 CLI에 연결하지 않았다. 먼저 CSV 입력 범위를 넓힌 뒤 외부 커넥터를 CLI에 연결할지 결정할 계획이다.
