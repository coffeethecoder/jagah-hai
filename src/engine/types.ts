// Shared engine types (SPEC 12.1, 8.1).

export interface Station { code: string; name: string; km?: number; weight?: number }
export interface Route {
  id: string; name: string; trainNumber: string | null; source: string;
  stations: Station[];                 // n = stations.length - 1 segments
}

export interface Booking {
  id: number;                          // = arrival index
  from: number;                        // station index
  to: number;                          // station index, from < to
  arrival: number;
  isTatkal: boolean;
}

export interface CoachConfig { berths: number; racBerths: number }  // k, r

export type Pool = 'confirmed' | 'rac';
export type StrategyId = 'first-fit' | 'best-fit' | 'random-fit' | 'deferred' | 'offline-optimum';
export type Tier = 1 | 2 | 3;

export type Outcome =
  | { kind: 'placed'; pool: Pool; index: number }   // berth (confirmed) or slot (rac)
  | { kind: 'pending'; pool: Pool }                 // Tier 2 before charting
  | { kind: 'rejected'; certificate: Certificate };

export type Certificate =
  | { kind: 'forced'; pool: Pool; segment: number; occupants: number[] }
  | { kind: 'strategy-induced'; pool: Pool; maxLoadOnRange: number;
      witness: Record<number, number> };

export interface StepEvent {
  booking: Booking;
  outcome: Outcome;
  confirmedLoad: number[];             // load profile after this step (length n)
  racLoad: number[];
}

export type Assignment = { confirmed: Record<number, number>; rac: Record<number, number> };

export interface Metrics {
  requested: number; confirmed: number; rac: number; seated: number; rejected: number;
  forced: number; strategyInduced: number;
  passengerSegmentsSeated: number; utilization: number; idleBerthSegments: number;
}

export interface RunResult {
  strategy: StrategyId; tier: Tier;
  events: StepEvent[];                 // empty for Tier 3
  assignment: Assignment;              // final (after charting for Tier 2)
  metrics: Metrics;
}

export interface DemandConfig {
  scenario: 'short' | 'long' | 'mixed' | 'uniform';
  demandFactor: number;      // ρ, e.g. 0.6 … 1.6
  tatkal: { enabled: boolean; fraction: number };  // fraction of total requests, default 0.2
  seed: number;
}
