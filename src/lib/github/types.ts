export const GITHUB_USERNAME = 'internalforces' as const;

export const CONTRIBUTION_COLORS = [
  '#edf1f5',
  '#c9f0df',
  '#7dd3a7',
  '#37c998',
  '#167c61',
] as const;

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;
export type ContributionColor = (typeof CONTRIBUTION_COLORS)[ContributionLevel];

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
  color: ContributionColor;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface GitHubActivity {
  id: string;
  repository: string;
  label: string;
  url: string;
  createdAt: string;
}

export interface GitHubStats {
  total: number;
  weeks: ContributionWeek[];
  events: GitHubActivity[];
  fetchedAt: string;
  stale: boolean;
}
