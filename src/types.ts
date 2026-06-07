import { Thresholds } from './config.js';

export type Tier = 'unmaintained' | 'probably' | 'maintained';

export type Confidence = 'hard' | 'soft';

export interface Reason {
  check: string;
  detail: string;
  confidence: Confidence;
}

export interface Finding {
  name: string;
  version: string;
  tier: Tier;
  reasons: Reason[];
  /** Dependency path from a direct dependency down to this package (populated under --transitive). */
  path?: string[];
}

export interface RunOptions {
  /** Project directory to scan. */
  cwd: string;
  strict: boolean;
  soft: boolean;
  transitive: boolean;
  depth?: number;
  production: boolean;
  json: boolean;
  token?: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface PackageData {
  name: string;
  latestVersion: string | null;
  deprecated: string | null;
  repositoryUrl: string | null;
  archived: boolean | null;
  topics: string[];
  lastPublish: string | null;
  maintainerCount: number | null;
  lastCommit: string | null;
  openIssues: number | null;
  closedIssues: number | null;
  repoCreatedAt: string | null;
  scorecardMaintained: number | null;
}

export interface Sources {
  fetchPackages(names: string[]): Promise<PackageData[]>;
}

export interface SoftCheckInput {
  data: PackageData;
  now?: Date;
  thresholds?: Thresholds;
}
