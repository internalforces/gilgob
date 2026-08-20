import type {
  ContentKind,
  GraphData,
  GraphEdge,
  GraphNode,
} from '../content/types';

export interface GraphFilter {
  categories: string[];
  kinds: ContentKind[];
  tags: string[];
}

export function filterGraph(graph: GraphData, filter: GraphFilter): GraphData {
  const categoriesByDocument = taxonomyByDocument(graph, 'category');
  const tagsByDocument = taxonomyByDocument(graph, 'tag');
  const retainedDocuments = new Set(graph.nodes
    .filter((node) => node.kind === 'document')
    .filter((node) => matchesFacet(categoriesByDocument.get(node.id), filter.categories))
    .filter((node) => filter.kinds.length === 0 || filter.kinds.includes(node.group as ContentKind))
    .filter((node) => matchesFacet(tagsByDocument.get(node.id), filter.tags))
    .map((node) => node.id));

  return graphForDocuments(graph, retainedDocuments);
}

export function graphForDocuments(graph: GraphData, documentIds: ReadonlySet<string>): GraphData {
  const retainedIds = new Set(graph.nodes
    .filter((node) => node.kind === 'document' && documentIds.has(node.id))
    .map((node) => node.id));

  for (const edge of graph.edges) {
    const connected = connectedDocumentAndTaxonomy(graph.nodes, edge);
    if (connected !== null && retainedIds.has(connected.document.id)) {
      retainedIds.add(connected.taxonomy.id);
    }
  }

  return stableGraph(
    graph.nodes.filter((node) => retainedIds.has(node.id)),
    graph.edges.filter((edge) => retainedIds.has(edge.source) && retainedIds.has(edge.target)),
  );
}

export function toEgoGraph(graph: GraphData, centerId: string): GraphData {
  if (!graph.nodes.some((node) => node.id === centerId)) return { nodes: [], edges: [] };

  const retainedIds = new Set([centerId]);
  for (const edge of graph.edges) {
    if (edge.source === centerId) retainedIds.add(edge.target);
    if (edge.target === centerId) retainedIds.add(edge.source);
  }

  return stableGraph(
    graph.nodes.filter((node) => retainedIds.has(node.id)),
    graph.edges.filter((edge) => edge.source === centerId || edge.target === centerId),
  );
}

function taxonomyByDocument(
  graph: GraphData,
  kind: Extract<GraphNode['kind'], 'category' | 'tag'>,
): Map<string, Set<string>> {
  const values = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    const connected = connectedDocumentAndTaxonomy(graph.nodes, edge);
    if (connected?.taxonomy.kind !== kind) continue;

    const labels = values.get(connected.document.id) ?? new Set<string>();
    labels.add(connected.taxonomy.label);
    values.set(connected.document.id, labels);
  }

  return values;
}

function connectedDocumentAndTaxonomy(
  nodes: GraphNode[],
  edge: GraphEdge,
): { document: GraphNode; taxonomy: GraphNode } | null {
  if (edge.kind === 'wikilink') return null;
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (source === undefined || target === undefined) return null;
  if (source.kind === 'document' && target.kind !== 'document') return { document: source, taxonomy: target };
  if (target.kind === 'document' && source.kind !== 'document') return { document: target, taxonomy: source };
  return null;
}

function matchesFacet(values: ReadonlySet<string> | undefined, selected: string[]): boolean {
  return selected.length === 0 || selected.some((value) => values?.has(value) === true);
}

function stableGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphData {
  return {
    nodes: [...nodes].sort((left, right) => left.id.localeCompare(right.id)),
    edges: [...edges].sort((left, right) => left.id.localeCompare(right.id)),
  };
}
