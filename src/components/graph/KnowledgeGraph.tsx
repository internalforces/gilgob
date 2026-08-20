/** @jsxImportSource preact */
import type { Core, ElementDefinition, Layouts, StylesheetStyle } from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ContentKind, GraphData, GraphNode } from '../../lib/content/types';
import { filterGraph, toEgoGraph, type GraphFilter } from '../../lib/graph/filter';

export interface GraphDocument {
  id: string;
  title: string;
  description: string;
  kind: ContentKind;
  category: string;
  tags: string[];
  href: string;
}

interface Props {
  graph: GraphData;
  documents: GraphDocument[];
}

const KIND_LABELS: Record<ContentKind, string> = {
  knowledge: '지식',
  explorations: '탐구',
  projects: '프로젝트',
  logs: '학습 기록',
};

const EMPTY_FILTER: GraphFilter = { categories: [], kinds: [], tags: [] };

export default function KnowledgeGraph({ graph, documents }: Props) {
  const [filter, setFilter] = useState<GraphFilter>(EMPTY_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(() => firstDocumentId(graph));
  const mobileMedia = useMediaQuery('(max-width: 719px)');
  const reducedMotionMedia = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mobile = mobileMedia.matches;
  const reducedMotion = reducedMotionMedia.matches;
  const mediaReady = mobileMedia.ready && reducedMotionMedia.ready;
  const filteredGraph = useMemo(() => filterGraph(graph, filter), [filter, graph]);
  const firstFilteredDocument = firstDocumentId(filteredGraph);
  const graphCenter = selectedId !== null && filteredGraph.nodes.some((node) => node.id === selectedId && node.kind === 'document')
    ? selectedId
    : firstFilteredDocument;
  const renderedGraph = useMemo(
    () => mobile && graphCenter !== null ? toEgoGraph(filteredGraph, graphCenter) : filteredGraph,
    [filteredGraph, graphCenter, mobile],
  );
  const activeFilterCount = filter.categories.length + filter.kinds.length + filter.tags.length;
  const visibleDocumentCount = filteredGraph.nodes.filter((node) => node.kind === 'document').length;
  const selectedNode = filteredGraph.nodes.find((node) => node.id === selectedId) ?? null;
  const options = useMemo(() => graphOptions(documents), [documents]);

  useEffect(() => {
    if (selectedId !== null && filteredGraph.nodes.some((node) => node.id === selectedId)) return;
    setSelectedId(firstFilteredDocument);
  }, [filteredGraph, firstFilteredDocument, selectedId]);

  return (
    <section class="knowledge-graph" aria-labelledby="interactive-graph-title">
      <div class="graph-section-heading">
        <div>
          <h2 id="interactive-graph-title">관계를 좁혀 살펴보기</h2>
          <p>같은 필터 안에서는 하나라도 맞으면 남고, 서로 다른 필터끼리는 함께 만족해야 합니다.</p>
        </div>
        <div class="graph-filter-summary" aria-live="polite">
          <strong>활성 필터 {activeFilterCount}개</strong>
          <span>문서 {visibleDocumentCount}개 · 노드 {filteredGraph.nodes.length}개</span>
        </div>
      </div>

      <div class="graph-filters">
        <Facet
          label="분야"
          values={options.categories}
          selected={filter.categories}
          countFor={(value) => documents.filter((document) => document.category === value).length}
          onToggle={(value) => setFilter((current) => ({
            ...current,
            categories: toggleValue(current.categories, value),
          }))}
        />
        <Facet
          label="글 유형"
          values={options.kinds}
          labels={KIND_LABELS}
          selected={filter.kinds}
          countFor={(value) => documents.filter((document) => document.kind === value).length}
          onToggle={(value) => setFilter((current) => ({
            ...current,
            kinds: toggleValue(current.kinds, value),
          }))}
        />
        <Facet
          label="태그"
          values={options.tags}
          selected={filter.tags}
          countFor={(value) => documents.filter((document) => document.tags.includes(value)).length}
          onToggle={(value) => setFilter((current) => ({
            ...current,
            tags: toggleValue(current.tags, value),
          }))}
        />
      </div>

      {activeFilterCount > 0 && (
        <button class="graph-filter-clear" type="button" onClick={() => setFilter(EMPTY_FILTER)}>
          필터 모두 지우기
        </button>
      )}

      {filteredGraph.nodes.length === 0 ? (
        <div class="graph-empty" role="status">
          <strong>조건에 맞는 연결이 없습니다.</strong>
          <p>필터를 하나씩 해제해 다시 살펴보세요.</p>
        </div>
      ) : (
        <div class="graph-workspace" data-graph-mode={mobile ? 'ego' : 'full'} data-graph-motion={reducedMotion ? 'reduced' : 'standard'}>
          <GraphCanvas
            enabled={mediaReady}
            graph={renderedGraph}
            mode={mobile ? 'ego' : 'full'}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <NodeExplorer
            graph={filteredGraph}
            documents={documents}
            selectedNode={selectedNode}
            onSelect={setSelectedId}
          />
        </div>
      )}
    </section>
  );
}

function Facet<T extends string>({
  label,
  values,
  labels,
  selected,
  countFor,
  onToggle,
}: {
  label: string;
  values: T[];
  labels?: Partial<Record<T, string>>;
  selected: T[];
  countFor: (value: T) => number;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset class="graph-facet">
      <legend>{label} <span>{selected.length}개 선택</span></legend>
      <div class="graph-facet__options">
        {values.map((value) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            <span>{labels?.[value] ?? value}</span>
            <small>{countFor(value)}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GraphCanvas({
  enabled,
  graph,
  mode,
  selectedId,
  onSelect,
}: {
  enabled: boolean;
  graph: GraphData;
  mode: 'ego' | 'full';
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let instance: Core | null = null;
    let activeLayout: Layouts | null = null;

    async function mountGraph() {
      try {
        setStatus('loading');
        const { default: cytoscape } = await import('cytoscape');
        if (cancelled || containerRef.current === null) return;
        containerRef.current.dataset.graphInitializedMode = mode;

        instance = cytoscape({
          container: containerRef.current,
          elements: cytoscapeElements(graph),
          style: GRAPH_STYLES,
          layout: { name: 'preset' },
          selectionType: 'single',
          minZoom: 0.55,
          maxZoom: 1.8,
        });
        cyRef.current = instance;
        instance.on('tap', 'node', (event) => onSelect(event.target.id()));
        if (selectedId !== null) instance.$id(selectedId).select();
        activeLayout = instance.layout(graphLayout());
        activeLayout.run();

        resizeObserver = new ResizeObserver(() => {
          instance?.resize();
          instance?.fit(undefined, 28);
        });
        resizeObserver.observe(containerRef.current);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void mountGraph();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      activeLayout?.stop();
      instance?.elements().stop(true, false);
      instance?.destroy();
      if (containerRef.current?.dataset.graphInitializedMode === mode) {
        delete containerRef.current.dataset.graphInitializedMode;
      }
      if (cyRef.current === instance) cyRef.current = null;
    };
  }, [enabled, graph, mode, onSelect]);

  useEffect(() => {
    const cy = cyRef.current;
    if (cy === null) return;
    cy.nodes().unselect();
    if (selectedId !== null) cy.$id(selectedId).select();
  }, [selectedId]);

  return (
    <div class="graph-visual" aria-hidden="true">
      <div class="graph-visual__legend">
        <span><i class="graph-key graph-key--document"></i>문서</span>
        <span><i class="graph-key graph-key--category"></i>분야</span>
        <span><i class="graph-key graph-key--tag"></i>태그</span>
        <span><i class="graph-line graph-line--wiki"></i>위키링크</span>
      </div>
      <div ref={containerRef} class="graph-canvas" data-graph-canvas></div>
      {status !== 'ready' && (
        <p class="graph-canvas__status">{status === 'error' ? '시각 그래프를 불러오지 못했습니다.' : '그래프를 구성하고 있습니다.'}</p>
      )}
    </div>
  );
}

function NodeExplorer({
  graph,
  documents,
  selectedNode,
  onSelect,
}: {
  graph: GraphData;
  documents: GraphDocument[];
  selectedNode: GraphNode | null;
  onSelect: (id: string) => void;
}) {
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const groups = [
    { kind: 'document' as const, label: '문서' },
    { kind: 'category' as const, label: '분야' },
    { kind: 'tag' as const, label: '태그' },
  ];
  const connectedDocuments = selectedNode === null ? [] : graph.edges
    .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    .flatMap((edge) => [edge.source, edge.target])
    .filter((id) => id !== selectedNode.id)
    .map((id) => documentById.get(id))
    .filter((document): document is GraphDocument => document !== undefined)
    .filter((document, index, all) => all.findIndex(({ id }) => id === document.id) === index)
    .sort((left, right) => left.title.localeCompare(right.title, 'ko'));

  return (
    <aside class="graph-explorer">
      <div class="graph-node-controls" aria-labelledby="graph-node-controls-title">
        <h3 id="graph-node-controls-title">키보드로 노드 선택</h3>
        <p>Tab으로 이동하고 Enter를 눌러 같은 상세 정보를 엽니다.</p>
        {groups.map(({ kind, label }) => {
          const nodes = graph.nodes.filter((node) => node.kind === kind);
          if (nodes.length === 0) return null;
          return (
            <section key={kind} aria-label={`${label} 노드`}>
              <h4>{label} <span>{nodes.length}</span></h4>
              <ul>
                {nodes.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      aria-pressed={selectedNode?.id === node.id}
                      onClick={() => onSelect(node.id)}
                    >
                      <i class={`graph-key graph-key--${node.kind}`} aria-hidden="true"></i>
                      <span>{node.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section class="graph-details" role="region" aria-label="선택한 노드 상세" aria-live="polite">
        {selectedNode === null ? (
          <p>노드를 선택하면 요약과 연결 문서를 볼 수 있습니다.</p>
        ) : selectedNode.kind === 'document' ? (
          <DocumentDetails document={documentById.get(selectedNode.id)} connectedDocuments={connectedDocuments} />
        ) : (
          <>
            <p class="graph-details__eyebrow">{selectedNode.kind === 'category' ? '분야' : '태그'}</p>
            <h3>{selectedNode.label}</h3>
            <p>이 분류에 직접 연결된 공개 문서입니다.</p>
            <DocumentLinks documents={connectedDocuments} />
          </>
        )}
      </section>
    </aside>
  );
}

function DocumentDetails({
  document,
  connectedDocuments,
}: {
  document: GraphDocument | undefined;
  connectedDocuments: GraphDocument[];
}) {
  if (document === undefined) return <p>공개 문서 정보를 찾을 수 없습니다.</p>;

  return (
    <>
      <p class="graph-details__eyebrow">{KIND_LABELS[document.kind]} · {document.category}</p>
      <h3>{document.title}</h3>
      <p>{document.description}</p>
      <ul class="graph-details__tags" aria-label="문서 태그">
        {document.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <a class="button-link button-link--primary" href={document.href}>문서 읽기</a>
      <h4>현재 그래프의 직접 연결</h4>
      <DocumentLinks documents={connectedDocuments} />
    </>
  );
}

function DocumentLinks({ documents }: { documents: GraphDocument[] }) {
  if (documents.length === 0) return <p class="graph-details__empty">직접 연결된 문서가 없습니다.</p>;
  return (
    <ul class="graph-details__links">
      {documents.map((document) => <li key={document.id}><a href={document.href}>{document.title}</a></li>)}
    </ul>
  );
}

function graphOptions(documents: GraphDocument[]) {
  return {
    categories: unique(documents.map(({ category }) => category)),
    kinds: unique(documents.map(({ kind }) => kind)) as ContentKind[],
    tags: unique(documents.flatMap(({ tags }) => tags)),
  };
}

function firstDocumentId(graph: GraphData): string | null {
  return graph.nodes.filter((node) => node.kind === 'document').sort((left, right) => left.id.localeCompare(right.id))[0]?.id ?? null;
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'ko'));
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : unique([...values, value]);
}

function useMediaQuery(query: string): { matches: boolean; ready: boolean } {
  const [state, setState] = useState({ matches: false, ready: false });

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setState({ matches: media.matches, ready: true });
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return state;
}

function cytoscapeElements(graph: GraphData): ElementDefinition[] {
  return [
    ...graph.nodes.map((node) => ({
      data: { id: node.id, label: node.label, kind: node.kind },
      classes: node.kind,
      selectable: true,
    })),
    ...graph.edges.map((edge) => ({
      data: { id: edge.id, source: edge.source, target: edge.target, kind: edge.kind },
      classes: edge.kind,
      selectable: false,
    })),
  ];
}

function graphLayout() {
  return {
    name: 'cose',
    animate: false,
    animationDuration: 0,
    randomize: false,
    fit: true,
    padding: 32,
  } as const;
}

const GRAPH_STYLES: StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#ffffff',
      'border-color': '#9aa8bd',
      'border-width': 1.5,
      color: '#0d1b36',
      label: 'data(label)',
      'font-family': 'Geist Variable, sans-serif',
      'font-size': 9,
      'text-max-width': '100px',
      'text-wrap': 'ellipsis',
      'text-valign': 'bottom',
      'text-margin-y': 8,
    },
  },
  { selector: 'node.document', style: { width: 31, height: 31, 'background-color': '#1d63ff', 'border-color': '#0d1b36' } },
  { selector: 'node.category', style: { width: 19, height: 19, shape: 'diamond', 'background-color': '#37c998' } },
  { selector: 'node.tag', style: { width: 13, height: 13, 'background-color': '#ffffff' } },
  { selector: 'node:selected', style: { 'border-color': '#0d1b36', 'border-width': 4, 'overlay-color': '#1d63ff', 'overlay-opacity': 0.08, 'overlay-padding': 8 } },
  { selector: 'edge', style: { width: 1, 'line-color': '#b7c2d1', 'curve-style': 'bezier', opacity: 0.65 } },
  { selector: 'edge.wikilink', style: { width: 1.8, 'line-color': '#52627a', opacity: 0.9, 'target-arrow-shape': 'triangle', 'target-arrow-color': '#52627a', 'arrow-scale': 0.65 } },
  { selector: 'edge.tag', style: { opacity: 0.28, 'line-style': 'dashed' } },
];
