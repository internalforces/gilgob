---
title: "Signal Hub · 백엔드 포트폴리오"
description: "결정론적 시계열 신호 생성과 SQLite 중복 방지를 중심으로 CSV 분석 도구를 설계하고 배포한 과정이다."
shareId: "8c5e1a7d3b92-signal-hub"
project: "signal-hub"
targetRole: "백엔드 개발자"
targetDomains:
  primary: "데이터 플랫폼"
  subdomains:
    - "시계열 분석"
    - "핀테크 데이터"
    - "개발자 도구"
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
updated: 2026-08-21
draft: false
repository: "https://github.com/internalforces/SignalHub"
package: "https://www.npmjs.com/package/csv-to-signal"
headline: "재현 가능한 데이터 처리를 실제 배포까지 연결했습니다."
metrics:
  - value: "약 4주"
    label: "개발 기간"
    detail: "2026-07-27 첫 커밋부터"
  - value: "83"
    label: "자동화 테스트"
    detail: "15개 테스트 파일"
  - value: "9"
    label: "워크스페이스"
    detail: "앱 1 · 커넥터 3 · 패키지 5"
  - value: "0.3.0"
    label: "npm 공개 버전"
    detail: "Node.js 20 · 22 · 24"
story:
  problem: "전체 운영 플랫폼 없이 시계열 규칙을 먼저 검증하기 어려웠습니다."
  approach: "CSV 입력과 명시적인 규칙 기반 탐지기에 범위를 집중했습니다."
  result: "같은 입력에서 같은 신호와 중복 없는 저장 결과를 재현합니다."
capabilities:
  - title: "연속 변화율"
    summary: "인접 값의 변화를 탐지합니다."
    evidence: "동일 입력에서 같은 신호 ID"
    visual: "trend"
  - title: "임계값 통과"
    summary: "기준선의 상향·하향 통과를 찾습니다."
    evidence: "방향과 시점을 명시"
    visual: "threshold"
  - title: "시간 윈도우 변화"
    summary: "지정 기간의 누적 변화를 비교합니다."
    evidence: "24시간 변화율 25%"
    visual: "window"
ownership:
  - "모노레포 아키텍처"
  - "탐지·점수화"
  - "SQLite 저장"
  - "CLI·테스트·npm 배포"
architecture:
  - label: "INPUT"
    title: "CSV Connector"
    detail: "시계열 행 정규화"
  - label: "CORE"
    title: "Detector + Score"
    detail: "규칙 기반 신호 생성"
  - label: "OUTPUT"
    title: "SQLite + JSON"
    detail: "멱등 저장과 정렬 출력"
decisions:
  - title: "결정론적 신호 ID"
    implementation: "입력과 규칙으로 ID를 생성했습니다."
    impact: "재실행 결과를 비교할 수 있습니다."
  - title: "SQLite 멱등 저장"
    implementation: |-
      INSERT OR IGNORE
      TEXT PRIMARY KEY
    impact: "동일 신호의 중복 적재를 막습니다."
  - title: "단방향 패키지 경계"
    implementation: "입력→코어→저장·출력 방향을 유지했습니다."
    impact: "책임과 배포 단위를 분리합니다."
validation:
  steps:
    - "build"
    - "83 tests"
    - "typecheck"
    - "audit"
    - "isolated install"
    - "real CLI run"
  proofs:
    - value: "2"
      label: "격리 환경 생성 신호"
    - value: "25%"
      label: "24시간 변화율"
    - value: "1"
      label: "소비자 data.db"
    - value: "0"
      label: "패키지 내부 DB"
  command: "npm run release:check"
currentScope: "CSV 입력과 로컬 CLI 실행을 지원하며 외부 서비스 커넥터는 포함하지 않습니다."
nextStep: "CSV 파싱과 외부 커넥터 경계를 강화하되 결정론과 멱등성 계약을 유지합니다."
---

## 30초 요약

Signal Hub는 서버·스케줄러·대시보드 없이 시계열 규칙을 재현 가능하게 검증하기 위한 도구다. CSV 입력을 받아 신호를 탐지하고 점수화한 뒤, 저장 결과와 JSON 출력을 연결하는 흐름을 만들었다. 공개 결과물은 npm 패키지 `csv-to-signal` 0.3.0이다.

## 문제와 제약

같은 입력을 다시 처리해도 결과가 흔들리지 않고, 재실행이 저장된 결과를 중복시키지 않아야 했다. 또한 실행 환경의 상태나 연결된 서비스에 기대지 않고 로컬에서 검증 가능한 흐름을 유지해야 했다.

## 내가 담당한 범위

CSV 입력부터 탐지, 점수화, SQLite 저장, JSON 출력까지의 흐름을 설계하고 구현했다. 입력과 출력의 경계를 분명히 하면서, 패키지 사이에는 한 방향으로만 의존하도록 경계를 두었다.

## 핵심 기술적 의사결정

같은 시계열 규칙과 입력에서 같은 신호 ID와 점수가 만들어지도록 결정론적 신호 생성을 선택했다. SQLite에는 신호 ID를 기준으로 중복 저장을 막아 재실행에도 같은 결과를 다룰 수 있게 했다. 패키지 경계는 한 방향 의존으로 유지해 CSV 처리, 신호 생성, 저장과 출력의 책임이 역으로 섞이지 않도록 했다.

## 검증과 결과

빌드, 테스트, 타입 검사, 감사, 패키지 구성 검사, 격리 설치와 CLI 실행을 하나의 **격리된 릴리스 검증 경로**로 묶었다. npm 패키지 `csv-to-signal` 0.3.0을 배포했으며, 지원 대상은 Node.js 20, 22, 24 릴리스 라인이다.

## 한계와 다음 개선

현재 CSV 파서는 단순한 입력 형태를 전제로 하고, 실행은 로컬 환경에 한정되며, 커넥터는 외부 서비스와 연결되지 않는다. 다음 개선에서는 이 제약을 유지한 채 입력 처리와 연결 경계를 더 명확히 검증할 계획이다.
