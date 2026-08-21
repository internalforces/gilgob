---
title: "서로 다른 데이터를 같은 분석기로 처리하려면?"
description: "GitHub 커밋과 CoinGecko 가격을 공통 DataPoint로 바꾸는 과정을 통해 관심사의 분리, 인터페이스 기반 설계와 의존성 역전의 효과를 살펴본다."
category: "Computer Science"
tags: ["TypeScript", "Software Architecture", "Data Pipeline", "Dependency Inversion"]
created: 2026-08-21
draft: false
aliases: ["Connector 인터페이스 설계", "수집기와 분석기의 관심사 분리"]
featured: false
status: growing
---

서로 성격이 다른 데이터 소스를 하나의 분석 파이프라인에서 처리하려면, 분석기가 외부 API의 세부 형식을 직접 알아서는 안 된다. **Connector가 외부 데이터를 공통 도메인 형식으로 번역하고, Detector는 그 형식만 분석하도록 경계를 나누면 된다.**

[[Signal Hub]]의 GitHub와 CoinGecko Connector는 이 구조를 보여 주는 작은 예다.

```text
GitHub commits API ──> GitHubConnector ──┐
                                        ├─> DataPoint[] ──> Detector ──> Signal[]
CoinGecko market chart ─> CoinGeckoConnector ─┘
```

## 같은 `DataPoint`, 다른 관측

두 Connector는 모두 `DataPoint[]`를 반환하지만, 수집 대상과 정규화 방식은 다르다.

| 구분 | GitHub Connector | CoinGecko Connector |
| --- | --- | --- |
| 원본 데이터 | 저장소의 개별 커밋 | 암호화폐 가격 관측값 |
| 시간 처리 | 커미터 시각을 UTC 날짜로 변환 | 밀리초 timestamp를 ISO 8601 시각으로 변환 |
| 값의 의미 | 해당 UTC 날짜의 커밋 수 | 해당 시점의 가격 |
| 집계 방식 | 같은 날짜의 커밋을 하나로 합침 | 각 시점의 가격을 유지하고 중복 timestamp는 마지막 값으로 대체 |
| 지표 식별자 | `github:{owner}/{repo}:commits` | `coingecko:{coinId}:price:{currency}` |

GitHub API가 다음과 같은 커밋을 반환했다고 생각해 보자.

```text
2026-08-20T10:31:00Z  commit A
2026-08-20T14:20:00Z  commit B
2026-08-21T09:00:00Z  commit C
```

GitHub Connector는 커밋 하나마다 관측값을 만들지 않는다. UTC 날짜별 개수를 세어 다음과 같이 변환한다.

```ts
[
  {
    metricId: "github:internalforces/SignalHub:commits",
    timestamp: "2026-08-20T00:00:00.000Z",
    value: 2,
  },
  {
    metricId: "github:internalforces/SignalHub:commits",
    timestamp: "2026-08-21T00:00:00.000Z",
    value: 1,
  },
]
```

반면 CoinGecko의 `market_chart` 응답은 `[timestamp, price]` 쌍을 포함한다. Connector는 각 관측의 시각과 가격을 보존하면서 공통 형식으로 바꾼다.

```ts
[
  {
    metricId: "coingecko:bitcoin:price:usd",
    timestamp: "2026-08-20T10:00:00.000Z",
    value: 64_123.45,
  },
  {
    metricId: "coingecko:bitcoin:price:usd",
    timestamp: "2026-08-20T11:00:00.000Z",
    value: 65_000,
  },
]
```

두 결과는 원본의 모습은 다르지만, 분석기가 필요로 하는 세 가지 질문에는 같은 방식으로 답한다.

- 어떤 지표인가? — `metricId`
- 언제 관측했는가? — `timestamp`
- 값은 얼마인가? — `value`

## 공통 타입은 경계의 약속이다

Signal Hub의 공통 계약은 작다.

```ts
interface DataPoint {
  metricId: string;
  timestamp: string;
  value: number;
}

interface Connector {
  id: string;
  fetch(): Promise<DataPoint[]>;
}

interface Detector {
  id: string;
  detect(series: DataPoint[]): Signal[];
}
```

Pipeline은 구체적인 GitHub 또는 CoinGecko 클래스를 요구하지 않는다. `Connector` 규격을 만족하는 객체를 받아 `fetch()`를 호출하고, 얻은 관측값을 `Detector`에 전달한다.

```ts
async function runPipeline(
  connector: Connector,
  storage: SqliteStorage,
  options: { detectors: Detector[] },
): Promise<Signal[]> {
  const points = await connector.fetch();
  // 검증, 저장, 지표별 조회, 탐지와 점수화
}
```

여기서 인터페이스는 단순히 TypeScript 문법이 아니다. **두 구성요소가 서로의 내부 구현 대신 무엇을 주고받을지만 합의한 경계**다.

## 관심사의 분리: 각 단계가 자기 문제만 다룬다

관심사의 분리(Separation of Concerns)는 한 구성요소가 여러 종류의 문제를 동시에 책임지지 않도록 나누는 설계 원칙이다.

Signal Hub에서 Connector는 다음 문제를 맡는다.

- 외부 API 주소와 요청 옵션
- 인증 헤더와 페이지네이션
- 응답 파싱과 잘못된 레코드 처리
- 시간 형식 정규화
- 원본 데이터를 의미 있는 숫자 시계열로 변환하는 규칙

Detector의 관심사는 다르다.

- 시간순 관측값에서 비교 대상을 선택
- 변화율이나 임계값 통과 계산
- 조건을 만족하면 `Signal` 생성

따라서 GitHub API의 페이지네이션 규격이 바뀌면 GitHub Connector를 수정하면 된다. 변화율 계산법이 바뀌면 Detector를 수정한다. 변경 이유가 다른 코드를 서로 다른 경계에 두었기 때문에 영향 범위를 좁힐 수 있다.

## 의존성 역전: 정책이 구체적인 수집기를 모르게 한다

구체적인 구현에 직접 묶인 Pipeline은 다음과 같은 모습이 된다.

```ts
async function runPipeline() {
  const connector = new GitHubConnector({ /* ... */ });
  const points = await connector.fetch();
}
```

이 구조에서 Pipeline은 GitHub에 의존한다. CoinGecko나 CSV를 처리하려면 Pipeline의 생성 코드와 흐름을 함께 수정해야 한다.

인터페이스를 사용하면 의존 방향이 달라진다.

```text
             Connector 인터페이스
                ↑          ↑
               구현       사용
                │          │
GitHubConnector / CoinGeckoConnector    Pipeline
```

상위 수준 정책인 Pipeline과 하위 수준 세부 구현인 Connector가 모두 `Connector`라는 추상화에 의존한다. 이것이 이 경계에서 나타나는 **의존성 역전 원칙(Dependency Inversion Principle)**이다.

다만 Signal Hub 전체의 모든 의존성이 역전되어 있는 것은 아니다. 현재 Pipeline의 저장소 매개변수는 저장소 인터페이스가 아니라 구체 타입인 `SqliteStorage`다. 따라서 Connector와 Detector 경계는 인터페이스 기반이지만, Storage 경계까지 같은 수준으로 추상화했다고 말하면 과장이다.

## 이 구조가 주는 장점

### 새로운 데이터 소스를 추가하기 쉽다

날씨, 주가 또는 웹 트래픽을 추가할 때 기존 Pipeline을 데이터 소스별로 복제할 필요가 없다. 새 Connector가 유효한 `DataPoint[]`를 반환하도록 만들고 조합 지점에서 선택하면 된다.

```text
WeatherConnector ─┐
StockConnector ───┼─> DataPoint[] ─> 기존 Pipeline
TrafficConnector ─┘
```

### 분석 알고리즘을 재사용할 수 있다

변화율 Detector는 입력이 GitHub 커밋인지 Bitcoin 가격인지 알 필요가 없다. 숫자 시계열이라는 계약만 충족하면 같은 계산 코드를 적용할 수 있다.

```text
일별 커밋 수  10 → 12 → 30 ─┐
                             ├─> PercentageChangeDetector
Bitcoin 가격  60k → 61k → 75k ┘
```

데이터 소스마다 `GitHubChangeDetector`, `BitcoinChangeDetector`를 따로 만드는 중복을 줄일 수 있다.

### 테스트 범위가 작아진다

Detector 테스트에는 실제 외부 API가 필요 없다. 직접 만든 `DataPoint[]`만 전달해 계산 규칙을 검증할 수 있다. Connector 테스트에서는 가짜 API 응답을 주고 정규화된 결과와 진단 정보만 확인하면 된다.

이렇게 테스트를 나누면 실패했을 때 원인이 수집인지 분석인지도 더 빨리 좁힐 수 있다.

### 외부 변화가 내부로 퍼지는 것을 막는다

API 응답 필드, 인증 방식 또는 페이지네이션이 바뀌어도 Connector가 같은 계약을 유지하면 Pipeline과 Detector는 영향을 받지 않는다. 외부 시스템의 불안정한 세부사항을 경계에서 흡수하는 셈이다.

## 공통 타입이 모든 차이를 없애 주지는 않는다

같은 `DataPoint` 모양이라고 해서 데이터의 의미까지 같아지는 것은 아니다.

- 커밋 수의 `value: 20`과 Bitcoin 가격의 `value: 20`은 단위와 의미가 다르다.
- 일별 집계와 시간별 관측은 표본 간격이 다르다.
- 가격의 10% 변화와 커밋 수의 10% 변화는 같은 계산 결과여도 해석이 다르다.
- 커밋이 없는 날을 `0`으로 만들지 않고 생략하면 Detector가 보는 시간 간격도 달라진다.

따라서 공통 인터페이스는 **구조적 호환성**을 제공할 뿐, 모든 Detector가 모든 지표에 의미 있게 적용된다고 보장하지 않는다. 단위, 표본 주기, 결측값과 집계 정책은 별도의 도메인 규칙으로 명시해야 한다.

Connector의 정규화도 중립적인 변환만은 아니다. GitHub 커밋을 UTC 날짜별로 합치는 순간 “하루”의 기준과 집계 단위를 선택한 것이다. 좋은 경계는 이런 결정을 숨기는 경계가 아니라, 결정이 어디에서 이루어지는지 분명하게 만드는 경계다.

## 언제 이 방식을 사용하면 좋을까?

다음 조건이라면 공통 Connector 계약이 잘 맞는다.

- 외부 데이터의 형식은 다르지만 내부에서 같은 종류의 시계열 연산을 수행한다.
- 데이터 소스가 추가되거나 외부 API가 바뀔 가능성이 있다.
- 수집 실패와 분석 오류를 독립적으로 테스트하고 싶다.
- Pipeline이 특정 벤더나 API에 종속되지 않아야 한다.

반대로 텍스트 이벤트, 다차원 좌표, 관계형 레코드처럼 `metricId + timestamp + value`만으로 중요한 의미가 사라지는 데이터까지 억지로 `DataPoint`에 맞추면 안 된다. 이때는 더 풍부한 도메인 모델이나 별도의 파이프라인이 필요하다.

## 정리

Signal Hub의 구조를 한 문장으로 줄이면 다음과 같다.

> Connector는 서로 다른 외부 세계를 공통 언어로 번역하고, Detector는 그 언어만 읽는다.

이 경계 덕분에 수집과 분석의 관심사가 분리되고, Pipeline은 구체적인 수집기 대신 인터페이스에 의존한다. 그 결과 데이터 소스 확장, 분석기 재사용, 독립적인 테스트와 변경 격리가 쉬워진다.

하지만 공통 타입은 데이터의 의미를 자동으로 통일하지 않는다. 인터페이스 기반 설계의 핵심은 차이를 없애는 것이 아니라, **어떤 차이를 Connector가 책임지고 어떤 의미를 분석 단계까지 보존할지 명시하는 것**이다.

## 구현 근거

- [공통 DataPoint, Connector와 Detector 타입](https://github.com/internalforces/SignalHub/blob/main/packages/types/src/index.ts)
- [Core Pipeline](https://github.com/internalforces/SignalHub/blob/main/packages/core/src/pipeline.ts)
- [GitHub Connector](https://github.com/internalforces/SignalHub/blob/main/connectors/github/src/GitHubConnector.ts)
- [CoinGecko Connector](https://github.com/internalforces/SignalHub/blob/main/connectors/coingecko/src/CoinGeckoConnector.ts)
