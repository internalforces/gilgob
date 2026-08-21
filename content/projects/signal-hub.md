---
title: "Signal Hub"
description: "시간 정보가 포함된 CSV 관측값을 규칙 기반 탐지와 SQLite 저장을 거쳐 점수순 신호로 변환하는 결정론적 엔진과 CLI다."
category: "Projects"
tags: ["TypeScript", "CLI", "Time Series", "SQLite"]
created: 2026-08-20
updated: 2026-08-21
draft: false
aliases: ["신호 허브", "CSV to Signal", "csv-to-signal"]
featured: true
status: maintained
repository: "https://github.com/internalforces/SignalHub"
---

Signal Hub는 시간 정보가 포함된 숫자 관측값을 **결정론적이고 점수화된 신호**로 바꾸는 로컬 분석 엔진이다. 저장소의 프로젝트 이름은 Signal Hub이고, 사용자가 설치하는 공개 npm 패키지와 실행 파일의 이름은 [`csv-to-signal`](https://www.npmjs.com/package/csv-to-signal)이다.

현재 공개 버전은 `0.3.0`이다. 별도의 서버나 대시보드를 운영하지 않고도 CSV로 시계열 규칙을 검증할 수 있도록 TypeScript, Node.js, SQLite를 기반으로 작고 재현 가능한 실행 경로를 제공한다.

```text
CSV -> Connector -> Core -> Detector -> Score -> SQLite -> JSON
```

## 해결하려는 문제

시계열 데이터를 분석할 때 수집 서비스, 스케줄러, 데이터베이스 서버, 대시보드부터 구축하면 단순한 규칙 하나를 검증하는 데도 운영 부담이 커진다. Signal Hub는 이 범위를 로컬 CLI와 명시적인 규칙 기반 탐지기로 제한한다. 같은 관측값과 같은 탐지기 설정에는 같은 신호 ID와 점수를 생성하므로 결과를 반복 실행하고 비교하기 쉽다.

## 현재 지원 범위

| 기능 | 동작 |
|---|---|
| 연속 변화율 | 같은 지표의 바로 이전 관측값과 현재 값을 비교한다. 기본 탐지기로 항상 실행된다. |
| 임계값 통과 | 첫 값이 임계값 이상이거나 값이 임계값 아래에서 위로 통과할 때 신호를 만든다. |
| 시간 윈도우 변화 | 최신 값과 지정한 시간 경계 또는 그 이전의 가장 가까운 관측값을 비교한다. |
| 점수화 | `abs(changePercent) * 2`를 반올림한 뒤 `0`에서 `100` 사이로 제한한다. |
| 로컬 저장 | 정규화한 관측값과 생성한 신호를 현재 작업 디렉터리의 `data.db`에 저장한다. |
| 출력 | 최소 점수로 필터링한 신호를 점수 내림차순의 JSON으로 표준 출력에 기록한다. |

관측값은 `metricId`, `timestamp`, `value`로 구성된다. 타임스탬프는 ISO 8601 UTC로 정규화하고, 관측값은 `metricId + timestamp`, 신호는 탐지기 설정과 입력값에서 만든 결정론적 ID로 중복 저장을 방지한다.

## 빠른 시작

Node.js `20`, `22`, `24` 릴리스 계열을 지원한다.

```bash
npm install --global csv-to-signal
csv-to-signal analyze prices.csv --min-score 40 --threshold 120 --window-hours 24
```

입력 CSV의 첫 번째 비어 있지 않은 줄은 아래 헤더를 정확히 이 순서로 가져야 한다. 헤더의 대소문자와 앞뒤 공백은 무시한다.

```csv
metricId,timestamp,value
demo.price,2026-08-01T00:00:00Z,100
demo.price,2026-08-02T00:00:00Z,125
demo.price,2026-08-03T00:00:00Z,100
```

```text
csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]
```

| 옵션 | 의미 |
|---|---|
| `--min-score <n>` | 점수가 `n` 이상인 신호만 반환한다. 기본값은 `0`이다. |
| `--threshold <n>` | 상향 임계값 통과 탐지기를 추가한다. |
| `--window-hours <n>` | 양의 유한한 시간 단위 윈도우 변화 탐지기를 추가한다. |

CSV 파서는 의도적으로 단순하다. 따옴표로 감싼 필드, 이스케이프된 쉼표, 다른 열 순서와 같은 RFC 4180 기능은 지원하지 않는다. `data.db`는 입력 파일 옆이 아니라 **명령을 실행한 현재 작업 디렉터리**에 생성되므로 분석별로 저장소를 분리하려면 서로 다른 디렉터리에서 실행해야 한다.

## 구조

Signal Hub는 pnpm 워크스페이스와 Turborepo를 사용하는 모노레포다.

```text
SignalHub/
├── apps/cli/                 # csv-to-signal 실행 파일과 CLI 조합 계층
├── connectors/
│   ├── csv/                  # CSV -> DataPoint
│   ├── github/               # GitHub 커밋 -> UTC 일별 커밋 수
│   └── coingecko/            # CoinGecko 가격 -> DataPoint
└── packages/
    ├── types/                # DataPoint, Signal, Detector, Connector 계약
    ├── connector-sdk/        # 커넥터 검증 유틸리티
    ├── storage/              # SQLite 저장소와 리포지토리
    ├── analysis/             # 탐지기와 점수 계산
    └── core/                 # 파이프라인 실행과 JSON 포맷
```

GitHub와 CoinGecko 커넥터는 저장소 내부 라이브러리로 구현되어 있지만 공개 CLI에는 연결되어 있지 않다. CLI에서 직접 분석할 수 있는 입력은 현재 CSV뿐이다. 패키지 간 의존성은 단방향으로 유지하며, SQLite 접근은 `storage` 패키지로 제한한다.

## 소스에서 실행하기

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
node apps/cli/dist/index.js analyze examples/prices.csv
```

저장소는 `pnpm build`, `pnpm test`, `pnpm typecheck`를 기본 검증 명령으로 제공한다. `pnpm release:check`는 빌드·테스트·타입 검사·의존성 감사·npm 패키지 구성 검사와 격리 설치 후 CLI 실행까지 수행하지만 실제 배포는 하지 않는다.

## 의도적으로 제외한 기능

현재 버전은 스케줄링, 알림, REST API, 대시보드, YAML 설정, Polymarket 또는 범용 REST 수집을 제공하지 않는다. 이상 탐지, 추세 분류, 스파이크 탐지, 변화점 탐지와 같은 ML 스타일 분석도 구현 범위 밖이다. 이 제약 덕분에 Signal Hub는 서비스 플랫폼이 아니라 **로컬에서 규칙을 빠르게 검증하는 결정론적 엔진**이라는 목적을 유지한다.

## 관련 링크

- [GitHub 저장소](https://github.com/internalforces/SignalHub)
- [npm 패키지](https://www.npmjs.com/package/csv-to-signal)
- [한국어 사용 안내](https://github.com/internalforces/SignalHub/blob/main/docs/README.ko.md)
- [라이브러리 사용 예제](https://github.com/internalforces/SignalHub/blob/main/docs/library-usage.md)
- [개발 가이드](https://github.com/internalforces/SignalHub/blob/main/docs/development.md)
