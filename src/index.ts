import { analyze } from "./analyze";
import { BreakraError, errorBody } from "./core/errors";
import { LIMITS } from "./core/limits";
import { parseRequestBody } from "./core/validate";
import { ENGINE_VERSION } from "./version";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "x-breakra-engine": ENGINE_VERSION,
};

/**
 * One structured log line per request. Contains no request body and no client IP (D-026).
 * `payer` comes from Bankr's router-set x-402-payer header and is used only for usage metrics.
 */
function logEvent(event: Record<string, string | number | null>): void {
  console.log(JSON.stringify({ event: "breakra.analyze", ...event }));
}

/**
 * Bankr x402 Cloud handler (D-025: literal default-function export).
 * Returns 2xx only for a complete analysis: Bankr settles payment only on 2xx (verified in T-001), so every
 * failure path below is free for the caller (D-023).
 */
export default async function handler(req: Request): Promise<Response> {
  const started = performance.now();
  const payer = req.headers.get("x-402-payer");
  try {
    if (req.method !== "POST") {
      throw new BreakraError("METHOD_NOT_ALLOWED", "Use POST with a JSON body.");
    }
    const declared = Number(req.headers.get("content-length") ?? "0");
    if (declared > LIMITS.maxBodyBytes) {
      throw new BreakraError("PAYLOAD_TOO_LARGE", "Request body exceeds the 1 MB limit.", {
        limit_bytes: LIMITS.maxBodyBytes,
      });
    }
    const bytes = new Uint8Array(await req.arrayBuffer());
    const result = await analyze(parseRequestBody(bytes));
    logEvent({
      outcome: "success",
      status: 200,
      bytes: bytes.byteLength,
      changes: result.summary.total_changes,
      compatibility: result.compatibility,
      duration_ms: Math.round(performance.now() - started),
      payer,
    });
    return new Response(JSON.stringify(result), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    const known =
      err instanceof BreakraError
        ? err
        : new BreakraError(
            "ANALYSIS_FAILED",
            "The analysis failed unexpectedly. You were not charged; retrying is safe.",
          );
    logEvent({
      outcome: "error",
      status: known.status,
      code: known.code,
      duration_ms: Math.round(performance.now() - started),
      payer,
      // Only the error class name is logged for unexpected failures; never messages that may echo input.
      internal: err instanceof BreakraError ? null : err instanceof Error ? err.name : "unknown",
    });
    return new Response(JSON.stringify(errorBody(known)), { status: known.status, headers: JSON_HEADERS });
  }
}
