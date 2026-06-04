export interface Thresholds {
  /** Soft: flag if no commits within this many years. */
  commitAgeYears: number;
  /** Soft: flag if no npm publish within this many years (dead release cadence). */
  cadenceYears: number;
  /** Soft: open-issue ratio above which the backlog looks abandoned (0–1). */
  staleIssueRatio: number;
  /** Soft: OpenSSF "Maintained" score at or below this floor counts against the package (0–10).*/
  scorecardMaintainedFloor: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  commitAgeYears: 2,
  cadenceYears: 2,
  staleIssueRatio: 0.9,
  scorecardMaintainedFloor: 2,
};
