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

interface GraphLookup {
  nodeById: Map<string, GraphNode>;
  edgesByNode: Map<string, GraphEdge[]>;
}

export function filterGraph(graph: GraphData, filter: GraphFilter): GraphData {
  const lookup = indexGraph(graph);
  const { categoriesByDocument, tagsByDocument } = taxonomyByDocument(graph, lookup.nodeById);
  const retainedDocuments = new Set(graph.nodes
    .filter((node) => node.kind === 'document')
    .filter((node) => matchesFacet(categoriesByDocument.get(node.id), filter.categories))
    .filter((node) => filter.kinds.length === 0 || filter.kinds.includes(node.group as ContentKind))
    .filter((node) => matchesFacet(tagsByDocument.get(node.id), filter.tags))
    .map((node) => node.id));

  return graphForDocuments(graph, retainedDocuments);
}

export function graphForDocuments(graph: GraphData, documentIds: ReadonlySet<string>): GraphData {
  const { nodeById } = indexGraph(graph);
  const retainedIds = new Set(graph.nodes
    .filter((node) => node.kind === 'document' && documentIds.has(node.id))
    .map((node) => node.id));

  for (const edge of graph.edges) {
    const connected = connectedDocumentAndTaxonomy(nodeById, edge);
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
  const lookup = indexGraph(graph);
  if (!lookup.nodeById.has(centerId)) return { nodes: [], edges: [] };

  const retainedIds = new Set([centerId]);
  const retainedEdges = lookup.edgesByNode.get(centerId) ?? [];
  for (const edge of retainedEdges) {
    if (edge.source === centerId) retainedIds.add(edge.target);
    if (edge.target === centerId) retainedIds.add(edge.source);
  }

  return stableGraph(
    graph.nodes.filter((node) => retainedIds.has(node.id)),
    retainedEdges,
  );
}

function taxonomyByDocument(
  graph: GraphData,
  nodeById: ReadonlyMap<string, GraphNode>,
): {
  categoriesByDocument: Map<string, Set<string>>;
  tagsByDocument: Map<string, Set<string>>;
} {
  const categoriesByDocument = new Map<string, Set<string>>();
  const tagsByDocument = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    const connected = connectedDocumentAndTaxonomy(nodeById, edge);
    if (connected === null) continue;

    const values = connected.taxonomy.kind === 'category' ? categoriesByDocument : tagsByDocument;
    const labels = values.get(connected.document.id) ?? new Set<string>();
    labels.add(connected.taxonomy.label);
    values.set(connected.document.id, labels);
  }

  return { categoriesByDocument, tagsByDocument };
}

function indexGraph(graph: GraphData): GraphLookup {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgesByNode = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    const sourceEdges = edgesByNode.get(edge.source) ?? [];
    sourceEdges.push(edge);
    edgesByNode.set(edge.source, sourceEdges);
    if (edge.target === edge.source) continue;
    const targetEdges = edgesByNode.get(edge.target) ?? [];
    targetEdges.push(edge);
    edgesByNode.set(edge.target, targetEdges);
  }
  return { nodeById, edgesByNode };
}

function connectedDocumentAndTaxonomy(
  nodeById: ReadonlyMap<string, GraphNode>,
  edge: GraphEdge,
): { document: GraphNode; taxonomy: GraphNode } | null {
  if (edge.kind === 'wikilink') return null;
  const source = nodeById.get(edge.source);
  const target = nodeById.get(edge.target);
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
