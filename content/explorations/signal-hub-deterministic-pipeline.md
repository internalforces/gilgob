---
title: "Signal Hub는 어떻게 동일 입력에서 동일 결과를 보장할까?"
description: "Signal Hub의 데이터 정규화, 결정론적 ID, SQLite 중복 방지와 순수한 탐지기를 따라가며 재현 가능한 시계열 파이프라인의 조건을 탐구한다."
category: "Research"
tags: ["Time Series", "Determinism", "Idempotency", "Data Pipeline"]
created: 2026-08-21
draft: false
aliases: ["Signal Hub 결정론 학습"]
featured: false
status: active
---

## 탐구 질문

[[Signal Hub]]는 같은 관측값과 같은 탐지기 설정을 처리할 때 어떻게 같은 신호 ID와 점수를 다시 만들고, 반복 실행에서도 중복 저장을 피할까?

> [!question] 중심 질문
> 재현 가능한 시계열 파이프라인을 만들려면 입력 경계, 시간 처리, 식별자, 저장소와 탐지기가 각각 어떤 불변조건을 지켜야 할까?

## 왜 공부할까?

Signal Hub의 변화율과 임계값 계산은 비교적 단순하다. 이 프로젝트에서 더 깊게 공부할 부분은 고급 통계보다 **같은 입력을 반복해서 처리해도 결과가 흔들리지 않는 시스템을 구성하는 방법**이다.

이 질문을 따라가면 다음 주제가 하나의 흐름으로 연결된다.

```text
외부 데이터
    ↓ 정규화와 검증
DataPoint
    ↓ 멱등 저장
시계열 이력
    ↓ 순수한 탐지 규칙
Signal
    ↓ 점수화와 정렬
결정론적 출력
```

## 현재 확인한 구조

| 경계 | 대표 역할 | 먼저 확인할 불변조건 |
| --- | --- | --- |
| `Connector` | CSV나 외부 API 데이터를 `DataPoint[]`로 바꾼다. | 타임스탬프를 같은 UTC 형식으로 정규화하는가? |
| `Storage` | 관측값과 신호를 SQLite에 저장한다. | 같은 논리적 레코드를 다시 넣어도 중복되지 않는가? |
| `Detector` | 하나의 지표 시계열에서 신호를 찾는다. | 입력 순서나 이전 실행 상태에 결과가 좌우되지 않는가? |
| `Core` | 수집, 저장, 탐지, 점수화와 정렬을 조합한다. | 단계의 실행 순서와 패키지 책임이 명확한가? |
| `CLI` | 사용자의 입력과 옵션을 내부 구성요소로 연결한다. | CLI가 분석 규칙을 직접 소유하지 않는가? |

현재 파이프라인의 대표 흐름은 다음과 같다.

1. Connector가 관측값을 가져온다.
2. 유효하지 않은 관측값을 제거한다.
3. 정규화된 관측값을 저장한다.
4. `metricId`별 저장 이력을 시간순으로 읽는다.
5. 각 Detector를 실행한다.
6. 변화율을 점수로 변환하고 최소 점수로 필터링한다.
7. 점수 내림차순으로 정렬한 뒤 신호를 저장하고 반환한다.

근거가 되는 구현은 [Core 파이프라인](https://github.com/internalforces/SignalHub/blob/main/packages/core/src/pipeline.ts), [SQLite 저장소](https://github.com/internalforces/SignalHub/blob/main/packages/storage/src/SqliteStorage.ts), [공통 타입](https://github.com/internalforces/SignalHub/blob/main/packages/types/src/index.ts)에서 확인할 수 있다.

## 학습할 큰 줄기

### 1. 도메인 계약

`DataPoint`, `Signal`, `Connector`, `Detector`가 어떤 책임을 표현하는지 확인한다. TypeScript 타입이 보장하는 것과 런타임 검증이 추가로 필요한 것을 구분한다.

### 2. 데이터 정규화

CSV, GitHub, CoinGecko처럼 형태와 실패 방식이 다른 입력이 어떻게 같은 `DataPoint`가 되는지 비교한다. UTC 정규화, 잘못된 레코드, 중복 timestamp와 부분 실패 정책을 살펴본다.

### 3. 시간 의미론

연속 변화율, 임계값 통과와 시간 윈도우 변화가 각각 어떤 두 관측값을 비교하는지 확인한다. 특히 불규칙한 관측 간격에서 “24시간 전”의 기준값을 어떻게 선택하는지가 핵심이다.

### 4. 결정론과 멱등성

관측값과 신호의 ID가 어떤 값으로 구성되는지, SQLite의 기본 키와 `INSERT OR IGNORE`가 반복 실행을 어떻게 처리하는지 추적한다. 같은 timestamp에 수정된 값이 들어오는 경우처럼 현재 정책의 의미와 한계도 함께 살펴본다.

### 5. 테스트 가능한 아키텍처

패키지의 단방향 의존성, Repository Pattern, Composition Root와 상태 없는 Detector가 테스트 격리에 어떤 영향을 주는지 확인한다. 테스트 이름만 읽지 않고 각 경계의 실패 사례와 불변조건을 찾아본다.

### 6. 배포 가능한 CLI

내부 워크스페이스 코드는 번들에 포함하고 네이티브 SQLite 의존성은 외부에 두는 이유를 알아본다. 소스 코드가 동작하는 것과 실제 npm 설치 결과물이 동작하는 것을 왜 별도로 검증하는지도 확인한다.

## 깊게 확인할 질문

- `metricId + timestamp`를 관측값의 정체성으로 삼으면 값 수정은 어떤 의미가 될까?
- 부동소수점 변화율을 Signal ID에 포함해도 환경과 구현 변경에 안정적일까?
- 점수가 같은 Signal 사이에도 항상 같은 출력 순서가 필요한가?
- Detector의 계산 방식이나 버전이 바뀌면 기존 Signal과 어떻게 구분해야 할까?
- 같은 시각을 서로 다른 timezone 표기로 입력해도 같은 관측값으로 취급되는가?
- 불규칙한 관측에서 시간 경계 이전의 가장 가까운 값을 기준으로 삼는 정책은 언제 적합하지 않을까?
- Connector의 일부 레코드 실패와 전체 요청 실패는 어떤 기준으로 나누어야 할까?
- Core가 구체적인 SQLite 저장소 대신 저장소 인터페이스에 의존하면 무엇이 좋아지고 무엇이 복잡해질까?

## 현재 판단

현재까지는 Signal Hub를 **시계열 통계 프로젝트보다 결정론적 데이터 처리 시스템의 작은 수직 슬라이스**로 보는 것이 적절하다. 핵심 알고리즘만 따로 보는 것보다 입력 정규화부터 저장과 출력까지 이어지는 불변조건을 추적해야 설계 의도를 이해할 수 있다.

이 판단은 아직 학습 전의 출발점이다. 각 구현과 테스트를 읽고 직접 실험한 결과에 따라 수정한다.

## 다음 행동과 완료 기준

다음 순서로 하나씩 확인한다.

1. 공통 타입과 Core 파이프라인을 읽고 데이터 흐름을 직접 다시 그린다.
2. 같은 CSV를 두 번 실행해 관측값과 신호가 중복되지 않는지 확인한다.
3. 입력 순서, timezone, 값 `0`, 중복 timestamp와 불규칙 간격 사례를 실험한다.
4. Detector 테스트를 읽고 각 테스트가 보호하는 불변조건을 문장으로 정리한다.
5. ID와 저장 정책의 한계를 설명할 수 있을 때 결정론과 멱등성을 별도의 지식 문서로 정리한다.

이 탐구는 위 질문에 근거 있는 답을 내고, 재사용할 수 있는 핵심 내용을 지식 문서로 분리하면 완료한다.

## 참고할 원문

- [Signal Hub 저장소](https://github.com/internalforces/SignalHub)
- [개발 가이드](https://github.com/internalforces/SignalHub/blob/main/docs/development.md)
- [라이브러리 사용 예제](https://github.com/internalforces/SignalHub/blob/main/docs/library-usage.md)
- [WindowedChangeDetector](https://github.com/internalforces/SignalHub/blob/main/packages/analysis/src/detectors/WindowedChangeDetector.ts)
- [Release 검증 스크립트](https://github.com/internalforces/SignalHub/blob/main/scripts/release-check.mjs)
