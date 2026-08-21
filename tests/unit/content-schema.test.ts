import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  explorationSchema,
  knowledgeSchema,
  logSchema,
  portfolioSchema,
  projectSchema,
} from '../../src/lib/content/schema';

const common = {
  title: 'B-Tree는 왜 DB Index에 사용될까?',
  description: 'B-Tree 인덱스를 설명한다.',
  category: 'Database',
  tags: ['B-Tree', 'Index'],
  created: '2026-08-20',
  draft: false,
  aliases: ['B-Tree Index'],
};

const portfolio = {
  title: 'Signal Hub 포트폴리오',
  description: '결정론적 시계열 분석 엔진을 설계하고 배포한 과정이다.',
  shareId: '8c5e1a7d3b92-signal-hub',
  project: 'signal-hub',
  targetRole: '백엔드 개발자',
  targetDomains: {
    primary: '데이터 플랫폼',
    subdomains: ['시계열 분석', '핀테크 데이터', '개발자 도구'],
  },
  period: '2026.08–현재',
  projectType: '개인 프로젝트',
  role: ['아키텍처 설계', 'CLI와 분석 엔진 구현', 'npm 배포'],
  tags: ['TypeScript', 'SQLite', 'CLI'],
  updated: '2026-08-21',
  draft: false,
  repository: 'https://github.com/internalforces/SignalHub',
  package: 'https://www.npmjs.com/package/csv-to-signal',
  headline: '재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.',
  metrics: [
    { value: '약 4주', label: '개발 기간', detail: '2026-07-27 첫 커밋부터' },
    { value: '83', label: '자동화 테스트', detail: '15개 테스트 파일' },
    { value: '9', label: '워크스페이스', detail: '앱 1 · 커넥터 3 · 패키지 5' },
    { value: '0.3.0', label: 'npm 공개 버전', detail: 'Node.js 20 · 22 · 24' },
  ],
  story: {
    problem: '전체 운영 플랫폼 없이 시계열 규칙을 먼저 검증하기 어려웠습니다.',
    approach: 'CSV 입력과 명시적인 규칙 기반 탐지기에 범위를 집중했습니다.',
    result: '같은 입력에서 같은 신호와 중복 없는 저장 결과를 재현합니다.',
  },
  capabilities: [
    { title: '연속 변화율', summary: '인접 값의 변화를 탐지합니다.', evidence: '동일 입력에서 같은 신호 ID', visual: 'trend' },
    { title: '임계값 통과', summary: '기준선의 상향·하향 통과를 찾습니다.', evidence: '방향과 시점을 명시', visual: 'threshold' },
    { title: '시간 윈도우 변화', summary: '지정 기간의 누적 변화를 비교합니다.', evidence: '24시간 변화율 25%', visual: 'window' },
  ],
  ownership: ['모노레포 아키텍처', '탐지·점수화', 'SQLite 저장', 'CLI·테스트·npm 배포'],
  architecture: [
    { label: 'INPUT', title: 'CSV Connector', detail: '시계열 행 정규화' },
    { label: 'CORE', title: 'Detector + Score', detail: '규칙 기반 신호 생성' },
    { label: 'OUTPUT', title: 'SQLite + JSON', detail: '멱등 저장과 정렬 출력' },
  ],
  decisions: [
    { title: '결정론적 신호 ID', implementation: '입력과 규칙으로 ID를 생성했습니다.', impact: '재실행 결과를 비교할 수 있습니다.' },
    { title: 'SQLite 멱등 저장', implementation: 'TEXT PRIMARY KEY와 INSERT OR IGNORE를 사용했습니다.', impact: '동일 신호의 중복 적재를 막습니다.' },
    { title: '단방향 패키지 경계', implementation: '입력→코어→저장·출력 방향을 유지했습니다.', impact: '책임과 배포 단위를 분리합니다.' },
  ],
  validation: {
    steps: ['build', '83 tests', 'typecheck', 'audit', 'isolated install', 'real CLI run'],
    proofs: [
      { value: '2', label: '격리 환경 생성 신호' },
      { value: '25%', label: '24시간 변화율' },
      { value: '1', label: '소비자 data.db' },
      { value: '0', label: '패키지 내부 DB' },
    ],
    command: 'npm run release:check',
  },
  currentScope: 'CSV 입력과 로컬 CLI 실행을 지원하며 외부 서비스 커넥터는 포함하지 않습니다.',
  nextStep: 'CSV 파싱과 외부 커넥터 경계를 강화하되 결정론과 멱등성 계약을 유지합니다.',
};

describe('content schemas', () => {
  it('coerces dates and accepts knowledge status', () => {
    const value = knowledgeSchema.parse({ ...common, status: 'mastered' });
    expect(value.created).toBeInstanceOf(Date);
  });

  it('rejects a project-only status in knowledge', () => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'building' })).toThrow();
  });

  it('accepts the project lifecycle', () => {
    expect(projectSchema.parse({ ...common, status: 'maintained' }).status).toBe('maintained');
  });

  it.each([
    '../escape',
    'nested/../escape',
    './dot',
    'nested//empty',
    '/absolute',
    'windows\\path',
    'query?draft=true',
    'fragment#heading',
    '%2e%2e/%2e%2e/graph',
    '%2E%2e/escape',
    'nested%2fescape',
    'nested%5Cescape',
    'control%00byte',
    'malformed%',
  ])('rejects unsafe explicit slug %s', (slug) => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'growing', slug })).toThrow();
  });

  it('accepts safe Unicode POSIX slug segments', () => {
    expect(knowledgeSchema.parse({
      ...common,
      status: 'growing',
      slug: '보안/위협-모델',
    }).slug).toBe('보안/위협-모델');
  });

  it('accepts only HTTPS project repository URLs', () => {
    expect(projectSchema.parse({
      ...common,
      status: 'maintained',
      repository: 'https://github.com/internalforces/gilgob',
    }).repository).toBe('https://github.com/internalforces/gilgob');

    expect(() => projectSchema.parse({
      ...common,
      status: 'maintained',
      repository: 'http://github.com/internalforces/gilgob',
    })).toThrow();
  });

  it('accepts optional next exploration questions', () => {
    const value = knowledgeSchema.parse({
      ...common,
      status: 'growing',
      nextQuestions: ['분기 계수는 읽기 비용에 어떤 영향을 줄까?'],
    });

    expect(value.nextQuestions).toEqual(['분기 계수는 읽기 비용에 어떤 영향을 줄까?']);
  });

  it('accepts an unlisted portfolio case study', () => {
    expect(portfolioSchema.parse(portfolio).shareId).toBe(portfolio.shareId);
  });

  it.each([
    ['metrics', { metrics: portfolio.metrics.slice(0, 3) }],
    ['capabilities', { capabilities: [...portfolio.capabilities, portfolio.capabilities[0]] }],
    ['architecture minimum', { architecture: portfolio.architecture.slice(0, 1) }],
    ['architecture maximum', { architecture: [...portfolio.architecture, portfolio.architecture[0], portfolio.architecture[1]] }],
    ['decisions', { decisions: portfolio.decisions.slice(0, 2) }],
    ['validation steps minimum', { validation: { ...portfolio.validation, steps: ['build', 'test'] } }],
    ['validation steps maximum', { validation: { ...portfolio.validation, steps: ['1', '2', '3', '4', '5', '6', '7'] } }],
    ['validation proofs', { validation: { ...portfolio.validation, proofs: portfolio.validation.proofs.slice(0, 3) } }],
  ])('rejects an invalid portfolio %s count', (_name, override) => {
    expect(() => portfolioSchema.parse({ ...portfolio, ...override })).toThrow();
  });

  it('accepts a capability without a decorative visual', () => {
    const capabilities = portfolio.capabilities.map(({ visual: _visual, ...capability }) => capability);
    expect(portfolioSchema.parse({ ...portfolio, capabilities }).capabilities).toEqual(capabilities);
  });

  it('requires prioritized portfolio target domains', () => {
    expect(portfolioSchema.parse(portfolio).targetDomains).toEqual({
      primary: '데이터 플랫폼',
      subdomains: ['시계열 분석', '핀테크 데이터', '개발자 도구'],
    });

    const { targetDomains: _targetDomains, ...portfolioWithoutTargetDomains } = portfolio;
    expect(() => portfolioSchema.parse(portfolioWithoutTargetDomains)).toThrow();
    expect(() => portfolioSchema.parse({
      ...portfolio,
      targetDomains: { primary: '데이터 플랫폼', subdomains: [] },
    })).toThrow();
  });

  it.each(['../secret', 'nested/share', 'encoded%2fpath', 'query?x=1', 'fragment#x'])
    ('rejects unsafe portfolio share id %s', (shareId) => {
      expect(() => portfolioSchema.parse({ ...portfolio, shareId })).toThrow();
    });

  it('requires at least one portfolio role', () => {
    const { role: _role, ...portfolioWithoutRole } = portfolio;
    expect(() => portfolioSchema.parse(portfolioWithoutRole)).toThrow();
  });

  it('accepts only HTTPS portfolio links', () => {
    expect(() => portfolioSchema.parse({
      ...portfolio,
      repository: 'http://github.com/internalforces/SignalHub',
    })).toThrow();
  });

  it('validates the frontmatter in every Obsidian template', () => {
    const templates = [
      ['knowledge', knowledgeSchema],
      ['exploration', explorationSchema],
      ['project', projectSchema],
      ['log', logSchema],
      ['portfolio', portfolioSchema],
    ] as const;

    for (const [name, schema] of templates) {
      const path = fileURLToPath(new URL(`../../content/templates/${name}.md`, import.meta.url));
      expect(() => schema.parse(matter(readFileSync(path, 'utf8')).data)).not.toThrow();
    }
  });
});
