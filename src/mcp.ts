/**
 * Minimal MCP server over stdio (newline-delimited JSON-RPC 2.0), no dependencies. One tool,
 * `check_openapi_change`, running the engine locally: free, no wallet, no network. Specs are never logged;
 * stdout carries only protocol messages.
 */
import { BreakraError } from "./core/errors";
import { isObject, type JsonObject, parseSpecText } from "./core/validate";
import { analyzeLocal, formatText } from "./local";
import { PACKAGE_VERSION } from "./version";

const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const doc = {
  description:
    "An OpenAPI 3.0.x or 3.1.x document: a JSON object, or the whole document as JSON or YAML text. Inline only; URLs are not fetched.",
  oneOf: [{ type: "object" }, { type: "string" }],
};

export const TOOL = {
  name: "check_openapi_change",
  title: "Check an OpenAPI change for breaking changes",
  description:
    "Compare two versions of an OpenAPI contract before you change an API or upgrade to a new version of one. Returns a verdict (safe / review / block), a suggested semver bump, and every change classified breaking / potentially_breaking / unknown / compatible / non_contract, with evidence and a recommended fix. Pass `uses` (the operations your code calls) to filter the findings to those operations; Breakra does not read your code. Deterministic; runs locally.",
  inputSchema: {
    type: "object",
    properties: {
      before: { ...doc, description: `The current contract. ${doc.description}` },
      after: { ...doc, description: `The new contract. ${doc.description}` },
      uses: {
        type: "array",
        description: 'Optional: operations your code calls, e.g. [{"method":"GET","path":"/orders/{id}"}].',
        items: {
          type: "object",
          properties: { method: { type: "string" }, path: { type: "string" } },
          required: ["method", "path"],
        },
      },
    },
    required: ["before", "after"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
};

type Message = { jsonrpc: "2.0"; id?: string | number | null; method?: string; params?: unknown };

function asDoc(value: unknown, side: "before" | "after"): JsonObject {
  if (isObject(value)) return value;
  if (typeof value === "string") return parseSpecText(value, side);
  throw new BreakraError(
    "INVALID_REQUEST",
    `"${side}" must be an OpenAPI document (object or JSON/YAML text).`,
  );
}

async function callTool(params: unknown) {
  const p = isObject(params) ? params : {};
  if (p.name !== TOOL.name)
    throw Object.assign(new Error(`Unknown tool: ${String(p.name).slice(0, 80)}`), { rpc: -32602 });
  const args = isObject(p.arguments) ? p.arguments : {};
  try {
    const result = await analyzeLocal(asDoc(args.before, "before"), asDoc(args.after, "after"), args.uses);
    return {
      content: [{ type: "text", text: `${formatText(result)}\n\n${JSON.stringify(result)}` }],
      structuredContent: result,
      isError: false,
    };
  } catch (err) {
    const e =
      err instanceof BreakraError
        ? err
        : new BreakraError("ANALYSIS_FAILED", "The analysis failed unexpectedly.");
    return { content: [{ type: "text", text: `${e.code}: ${e.message}` }], isError: true };
  }
}

/** Handles one JSON-RPC message; returns the response, or null for notifications. Exported for tests. */
export async function handleMessage(msg: Message): Promise<object | null> {
  const isRequest = msg.id !== undefined && msg.id !== null;
  const reply = (result: object) => ({ jsonrpc: "2.0", id: msg.id, result });
  const error = (code: number, message: string) => ({
    jsonrpc: "2.0",
    id: msg.id ?? null,
    error: { code, message },
  });
  try {
    switch (msg.method) {
      case "initialize": {
        const asked = isObject(msg.params) ? msg.params.protocolVersion : undefined;
        const version =
          typeof asked === "string" && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
        return reply({
          protocolVersion: version,
          capabilities: { tools: {} },
          serverInfo: { name: "breakra", title: "Breakra", version: PACKAGE_VERSION },
          instructions:
            "Call check_openapi_change with the old and new OpenAPI contract before changing an API or upgrading a dependency's API. Act on `verdict`: block = breaking, review = check each finding, safe = no caller impact.",
        });
      }
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: [TOOL] });
      case "tools/call":
        return reply(await callTool(msg.params));
      default:
        if (!isRequest) return null; // notifications such as notifications/initialized
        return error(-32601, `Method not found: ${String(msg.method).slice(0, 80)}`);
    }
  } catch (err) {
    const code = (err as { rpc?: number }).rpc ?? -32603;
    return isRequest ? error(code, err instanceof Error ? err.message : "Internal error") : null;
  }
}

/** Reads newline-delimited JSON-RPC from stdin and writes responses to stdout. */
export async function serveStdio(): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  // A client that disconnects closes our stdout: exit quietly instead of crashing with EPIPE.
  process.stdout.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE" || err.code === "ERR_STREAM_DESTROYED") process.exit(0);
    throw err;
  });
  const write = (obj: object) => process.stdout.write(`${JSON.stringify(obj)}\n`);
  for await (const chunk of process.stdin) {
    buffer += typeof chunk === "string" ? chunk : decoder.decode(chunk as Uint8Array, { stream: true });
    let nl = buffer.indexOf("\n");
    while (nl >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf("\n");
      if (!line) continue;
      let msg: Message;
      try {
        msg = JSON.parse(line);
      } catch {
        write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
        continue;
      }
      const out = await handleMessage(msg);
      if (out) write(out);
    }
  }
}
