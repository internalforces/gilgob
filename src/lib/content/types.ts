export type ContentKind = 'knowledge' | 'explorations' | 'projects' | 'logs';

export interface WikiLinkToken {
  raw: string;
  target: string;
  heading?: string;
  label: string;
  embed: boolean;
}

export interface ContentRecord {
  id: string;
  kind: ContentKind;
  slug: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  aliases: string[];
  status?: string;
  created: string;
  updated: string;
  draft: boolean;
  featured: boolean;
  sourcePath: string;
  outgoing: string[];
  backlinks: string[];
  related: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  kind: 'document' | 'category' | 'tag';
  group: string;
  url?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: 'wikilink' | 'category' | 'tag';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ContentIndex {
  documents: ContentRecord[];
  graph: GraphData;
  generatedAt: string;
}

export interface ResolvedWikiLink {
  found: boolean;
  href?: string;
  documentId?: string;
  label: string;
  heading?: string;
}
