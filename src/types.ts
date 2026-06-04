export type Tier = 'unmaintained' | 'probably' | 'maintained';

export type Confidence = 'hard' | 'soft';

export interface Reason {
  signal: string;
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
