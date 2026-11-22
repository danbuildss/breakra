// Types for scripts/status-check.mjs (plain Node so the workflow needs no install).
export const SERVICES: Array<{ id: string; name: string; run: () => Promise<unknown> }>;
export function runChecks(): Promise<
  Record<string, { ok: boolean; ms: number; detail: string; slow?: boolean }>
>;
export function fold(
  prev: unknown,
  t: string,
  results: Record<string, unknown>,
  downloads: number | null,
): any;
