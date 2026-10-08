import type { RawDiff } from "./compare";
import { isObject, type Json } from "./validate";

/**
 * Breakra rule set 0.1.0 (RULES.md). Pure, deterministic mapping from raw structural changes to
 * findings. api-smart-diff's own labels are never consulted (D-013, D-020).
 *
 * Core principle for schemas:
 *   request side  — narrowing what is accepted may break callers; widening is compatible.
 *   response side — widening what may be returned may break consumers; narrowing is compatible.
 */

export type Compatibility = "breaking" | "potentially_breaking" | "unknown" | "compatible" | "non_contract";
export type Direction = "request" | "response" | "operation" | "security" | "document";

export interface Location {
  in?: string;
  name?: string;
  status?: string;
  media_type?: string;
  field?: string;
  keyword?: string;
}

export interface Change {
  rule: string;
  kind: string;
  compatibility: Compatibility;
  direction: Direction;
  operation: { method: string; path: string } | null;
  location: Location;
  reason: string;
  recommended_action: string;
  evidence: { path: string[]; before: Json | null; after: Json | null };
}

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);
const META_KEYWORDS = new Set([
  "description",
  "title",
  "summary",
  "example",
  "examples",
  "externalDocs",
  "xml",
  "tags",
]);
const MAX_KEYWORDS = new Set(["maximum", "maxLength", "maxItems", "maxProperties"]);
const MIN_KEYWORDS = new Set(["minimum", "minLength", "minItems", "minProperties"]);

type Effect = "narrow" | "widen" | "changed" | "meta" | "deprecated" | "unknown";

interface Ctx {
  diff: RawDiff;
  merged: Json;
  displayPath: string[];
}

function getAt(root: Json, path: Array<string | number>): Json | undefined {
  let node: Json | undefined = root;
  for (const key of path) {
    if (Array.isArray(node) && typeof key === "number") node = node[key];
    else if (isObject(node) && typeof key === "string") node = node[key];
    else return undefined;
    if (node === undefined) return undefined;
  }
  return node;
}

function isExtension(key: string | number | undefined): boolean {
  return typeof key === "string" && key.startsWith("x-");
}

function opName(op: { method: string; path: string } | null): string {
  return op ? `${op.method} ${op.path}` : "the API";
}

function value(v: Json | undefined): Json | null {
  return v === undefined ? null : v;
}

function make(
  ctx: Ctx,
  fields: {
    kind: string;
    compatibility: Compatibility;
    direction: Direction;
    operation: { method: string; path: string } | null;
    location?: Location;
    reason: string;
    action: string;
  },
): Change {
  return {
    rule: `${fields.direction}.${fields.kind}`,
    kind: fields.kind,
    compatibility: fields.compatibility,
    direction: fields.direction,
    operation: fields.operation,
    location: fields.location ?? {},
    reason: fields.reason,
    recommended_action: fields.action,
    evidence: { path: ctx.displayPath, before: value(ctx.diff.before), after: value(ctx.diff.after) },
  };
}

// ---------------------------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------------------------

function numericEffect(
  keyword: string,
  action: RawDiff["action"],
  before: Json | undefined,
  after: Json | undefined,
): Effect {
  const isMax = MAX_KEYWORDS.has(keyword);
  if (action === "add") {
    // Adding a lower bound of 0 constrains nothing.
    if (!isMax && after === 0) return "meta";
    return "narrow";
  }
  if (action === "remove") return "widen";
  if (typeof before === "number" && typeof after === "number") {
    if (after === before) return "meta";
    const tighter = isMax ? after < before : after > before;
    return tighter ? "narrow" : "widen";
  }
  return "changed";
}

function addRemoveEffect(action: RawDiff["action"], onAdd: Effect, onRemove: Effect): Effect {
  if (action === "add") return onAdd;
  if (action === "remove") return onRemove;
  return "changed";
}

function keywordEffect(keyword: string, d: RawDiff): Effect {
  const { action, before, after } = d;
  if (MAX_KEYWORDS.has(keyword) || MIN_KEYWORDS.has(keyword))
    return numericEffect(keyword, action, before, after);
  switch (keyword) {
    case "type":
      if (action === "replace" && before === "integer" && after === "number") return "widen";
      if (action === "replace" && before === "number" && after === "integer") return "narrow";
      return addRemoveEffect(action, "narrow", "widen");
    case "exclusiveMaximum":
    case "exclusiveMinimum":
    case "uniqueItems":
      if (after === true && before !== true) return "narrow";
      if (before === true && after !== true) return "widen";
      return "meta";
    case "nullable":
      if (after === true && before !== true) return "widen";
      if (before === true && after !== true) return "narrow";
      return "meta";
    case "multipleOf":
    case "pattern":
    case "format":
    case "enum":
    case "items":
    case "properties":
      return addRemoveEffect(action, "narrow", "widen");
    case "additionalProperties":
      if (after === false || (action === "add" && isObject(after ?? null))) return "narrow";
      if (before === false || action === "remove" || after === true) return "widen";
      return "changed";
    case "oneOf":
    case "anyOf":
    case "allOf":
      return addRemoveEffect(action, "narrow", "widen");
    case "readOnly":
    case "writeOnly":
      return "changed";
    case "deprecated":
      return after === true ? "deprecated" : "meta";
    case "discriminator":
    case "not":
      return "unknown";
    default:
      if (META_KEYWORDS.has(keyword) || isExtension(keyword)) return "meta";
      return "unknown";
  }
}

function effectCompatibility(effect: Effect, direction: "request" | "response"): Compatibility {
  switch (effect) {
    case "narrow":
      return direction === "request" ? "potentially_breaking" : "compatible";
    case "widen":
      return direction === "request" ? "compatible" : "potentially_breaking";
    case "changed":
      return "potentially_breaking";
    case "meta":
      return "non_contract";
    case "deprecated":
      return "compatible";
    default:
      return "unknown";
  }
}

const EFFECT_WORD: Record<Effect, string> = {
  narrow: "narrowed",
  widen: "widened",
  changed: "changed",
  meta: "documentation changed",
  deprecated: "deprecated",
  unknown: "changed in a way this rule set does not evaluate",
};

interface SchemaPlace {
  direction: "request" | "response";
  operation: { method: string; path: string } | null;
  base: Location;
  subject: string; // e.g. "the request body", "query parameter `q`"
}

/** Classifies a change located inside a schema. `schemaPath` is the path below the schema root. */
function classifySchema(ctx: Ctx, place: SchemaPlace, schemaPath: Array<string | number>): Change {
  const d = ctx.diff;
  const { direction, operation, base, subject } = place;
  let field = "";
  let i = 0;
  // Navigate structural keywords; stop at the terminal keyword.
  while (i < schemaPath.length) {
    const tok = schemaPath[i];
    const rest = schemaPath.length - i - 1;
    if (tok === "properties" && rest >= 2) {
      field += `${field ? "." : ""}${String(schemaPath[i + 1])}`;
      i += 2;
    } else if (tok === "items" && rest >= 1) {
      field += "[]";
      i += 1;
    } else if (tok === "additionalProperties" && rest >= 1) {
      field += `${field ? "." : ""}*`;
      i += 1;
    } else if ((tok === "oneOf" || tok === "anyOf" || tok === "allOf") && rest >= 2) {
      field += `<${tok}:${String(schemaPath[i + 1])}>`;
      i += 2;
    } else if (tok === "not" && rest >= 1) {
      // Changes inside `not` invert meaning; not evaluated in 0.1.0.
      return make(ctx, {
        kind: "schema_change_unsupported",
        compatibility: "unknown",
        direction,
        operation,
        location: { ...base, field: field || undefined, keyword: "not" },
        reason: `A schema inside \`not\` changed in ${subject}${field ? ` (field \`${field}\`)` : ""}; rule set 0.1.0 does not evaluate negated schemas.`,
        action: `Review ${subject} of ${opName(operation)} manually.`,
      });
    } else {
      break;
    }
  }
  const terminal = schemaPath.slice(i);
  const fieldLabel = (f: string) => (f ? `field \`${f}\`` : "the schema root");
  const loc = (f: string, keyword?: string): Location => ({
    ...base,
    ...(f ? { field: f } : {}),
    ...(keyword ? { keyword } : {}),
  });

  // Whole schema added/removed.
  if (terminal.length === 0) {
    const effect: Effect = addRemoveEffect(d.action, "narrow", "widen");
    return make(ctx, {
      kind:
        d.action === "add" ? "schema_added" : d.action === "remove" ? "schema_removed" : "schema_replaced",
      compatibility: effectCompatibility(effect, direction),
      direction,
      operation,
      location: loc(field),
      reason: `The schema for ${subject}${field ? ` at ${fieldLabel(field)}` : ""} was ${d.action === "add" ? "added" : d.action === "remove" ? "removed" : "replaced"}.`,
      action: `Review how ${opName(operation)} handles ${subject}.`,
    });
  }

  const last = terminal[terminal.length - 1];
  const keyword = terminal.length >= 2 ? terminal[terminal.length - 2] : undefined;

  // Property added/removed/replaced: [..., "properties", name]
  if (terminal.length === 2 && keyword === "properties" && typeof last === "string") {
    const prop = field ? `${field}.${last}` : last;
    if (d.action === "add") {
      return make(ctx, {
        kind: "property_added",
        compatibility: "compatible",
        direction,
        operation,
        location: loc(prop),
        reason:
          direction === "request"
            ? `Property \`${prop}\` was added to ${subject}. Callers that omit it are unaffected unless it is also required.`
            : `Property \`${prop}\` was added to ${subject}. Tolerant consumers are unaffected.`,
        action:
          direction === "request"
            ? `Optionally send \`${prop}\` in ${opName(operation)}; check whether it is required.`
            : `Ensure consumers of ${opName(operation)} ignore or handle the new \`${prop}\` field (strict deserializers may reject unknown fields).`,
      });
    }
    if (d.action === "remove") {
      return make(ctx, {
        kind: "property_removed",
        compatibility: "potentially_breaking",
        direction,
        operation,
        location: loc(prop),
        reason:
          direction === "request"
            ? `Property \`${prop}\` was removed from ${subject}. Callers that still send it may have it rejected or silently ignored.`
            : `Property \`${prop}\` was removed from ${subject}. Consumers that read it may break.`,
        action:
          direction === "request"
            ? `Stop sending \`${prop}\` to ${opName(operation)} or confirm the server tolerates it.`
            : `Find code that reads \`${prop}\` from ${opName(operation)} and handle its absence.`,
      });
    }
    return make(ctx, {
      kind: "property_changed",
      compatibility: "potentially_breaking",
      direction,
      operation,
      location: loc(prop),
      reason: `The definition of property \`${prop}\` in ${subject} was replaced.`,
      action: `Review usage of \`${prop}\` in ${opName(operation)}.`,
    });
  }

  // Required list entries: [..., "required", i] or whole [..., "required"].
  if (keyword === "required" && typeof last === "number" && terminal.length === 2) {
    const prop = typeof d.after === "string" ? d.after : typeof d.before === "string" ? d.before : "?";
    const full = field ? `${field}.${prop}` : prop;
    return requiredChange(
      ctx,
      place,
      loc(full),
      full,
      d.action === "add" ? "added" : d.action === "remove" ? "removed" : "changed",
    );
  }
  if (last === "required" && terminal.length === 1) {
    const before = Array.isArray(d.before) ? d.before : [];
    const after = Array.isArray(d.after) ? d.after : [];
    const added = after.filter((p) => !before.includes(p));
    const removed = before.filter((p) => !after.includes(p));
    const names = (list: Json[]) => list.map((p) => (field ? `${field}.${String(p)}` : String(p))).join(", ");
    if (added.length && !removed.length) return requiredChange(ctx, place, loc(field), names(added), "added");
    if (removed.length && !added.length)
      return requiredChange(ctx, place, loc(field), names(removed), "removed");
    return requiredChange(ctx, place, loc(field), names([...added, ...removed]), "changed");
  }

  // Enum values: [..., "enum", i]
  if (keyword === "enum" && typeof last === "number" && terminal.length === 2) {
    const v = JSON.stringify(d.action === "remove" ? d.before : d.after)?.slice(0, 80);
    const effect: Effect = d.action === "add" ? "widen" : d.action === "remove" ? "narrow" : "changed";
    const compat = effectCompatibility(effect, direction);
    return make(ctx, {
      kind:
        d.action === "add"
          ? "enum_value_added"
          : d.action === "remove"
            ? "enum_value_removed"
            : "enum_value_changed",
      compatibility: compat,
      direction,
      operation,
      location: loc(field, "enum"),
      reason:
        d.action === "add"
          ? direction === "response"
            ? `Value ${v} was added to the allowed values of ${fieldLabel(field)} in ${subject}. Consumers with exhaustive handling may receive a value they do not expect.`
            : `Value ${v} is now accepted for ${fieldLabel(field)} in ${subject}.`
          : d.action === "remove"
            ? direction === "request"
              ? `Value ${v} is no longer accepted for ${fieldLabel(field)} in ${subject}. Callers sending it may be rejected.`
              : `Value ${v} will no longer be returned for ${fieldLabel(field)} in ${subject}.`
            : `An allowed value of ${fieldLabel(field)} in ${subject} changed.`,
      action:
        compat === "compatible"
          ? `No action required for ${opName(operation)}; optionally update enums in generated clients.`
          : direction === "request"
            ? `Check callers of ${opName(operation)} for value ${v} in ${fieldLabel(field)}.`
            : `Update enum handling for ${fieldLabel(field)} in consumers of ${opName(operation)}.`,
    });
  }

  // Composition variants: [..., "oneOf"|"anyOf"|"allOf", i]
  if ((keyword === "oneOf" || keyword === "anyOf" || keyword === "allOf") && typeof last === "number") {
    const effect: Effect =
      keyword === "allOf"
        ? addRemoveEffect(d.action, "narrow", "widen")
        : addRemoveEffect(d.action, "widen", "narrow");
    return make(ctx, {
      kind:
        d.action === "add"
          ? "schema_variant_added"
          : d.action === "remove"
            ? "schema_variant_removed"
            : "schema_variant_changed",
      compatibility: effectCompatibility(effect, direction),
      direction,
      operation,
      location: loc(field, keyword),
      reason: `A \`${keyword}\` branch was ${d.action === "add" ? "added to" : d.action === "remove" ? "removed from" : "changed in"} ${fieldLabel(field)} in ${subject}, so the set of ${direction === "request" ? "accepted" : "possible"} values ${EFFECT_WORD[effect]}.`,
      action: `Review ${fieldLabel(field)} handling in ${opName(operation)}.`,
    });
  }

  // Any change below an enum/required/type array we did not catch above, or deeper unknown shapes.
  const kw = typeof last === "string" ? last : String(keyword ?? "");
  if (terminal.length !== 1 || typeof last !== "string") {
    return make(ctx, {
      kind: "schema_change_unsupported",
      compatibility: "unknown",
      direction,
      operation,
      location: loc(field, kw || undefined),
      reason: `A schema construct (\`${terminal.join(".")}\`) changed in ${subject}; rule set 0.1.0 does not evaluate it.`,
      action: `Review ${subject} of ${opName(operation)} manually.`,
    });
  }

  if (kw === "default") {
    return make(ctx, {
      kind: "default_changed",
      compatibility: direction === "request" ? "potentially_breaking" : "non_contract",
      direction,
      operation,
      location: loc(field, "default"),
      reason:
        direction === "request"
          ? `The default of ${fieldLabel(field)} in ${subject} changed. Callers that omit it may get different behaviour.`
          : `The documented default of ${fieldLabel(field)} in ${subject} changed.`,
      action:
        direction === "request"
          ? `If callers of ${opName(operation)} rely on the old default, send the value explicitly.`
          : "No action required.",
    });
  }

  const effect = keywordEffect(kw, d);
  const compat = effectCompatibility(effect, direction);
  const kind =
    effect === "meta"
      ? "schema_documentation_changed"
      : effect === "deprecated"
        ? "schema_deprecated"
        : effect === "unknown"
          ? "schema_change_unsupported"
          : kw === "type"
            ? "type_changed"
            : kw === "enum"
              ? d.action === "add"
                ? "enum_added"
                : d.action === "remove"
                  ? "enum_removed"
                  : "enum_changed"
              : `constraint_${effect === "narrow" ? "narrowed" : effect === "widen" ? "widened" : "changed"}`;
  const accepted = direction === "request" ? "accepted" : "returned";
  return make(ctx, {
    kind,
    compatibility: compat,
    direction,
    operation,
    location: loc(field, kw),
    reason:
      effect === "meta"
        ? `Documentation (\`${kw}\`) of ${fieldLabel(field)} in ${subject} changed; no contract impact.`
        : effect === "unknown"
          ? `\`${kw}\` of ${fieldLabel(field)} in ${subject} changed; rule set 0.1.0 does not evaluate this keyword.`
          : effect === "deprecated"
            ? `${fieldLabel(field)} in ${subject} was marked deprecated.`
            : `\`${kw}\` of ${fieldLabel(field)} in ${subject} changed (${JSON.stringify(value(d.before))?.slice(0, 60)} → ${JSON.stringify(value(d.after))?.slice(0, 60)}), so the set of ${accepted} values ${EFFECT_WORD[effect]}.`,
    action:
      compat === "potentially_breaking"
        ? direction === "request"
          ? `Check that values callers of ${opName(operation)} send for ${fieldLabel(field)} still satisfy the new \`${kw}\`.`
          : `Check that consumers of ${opName(operation)} handle the new \`${kw}\` of ${fieldLabel(field)}.`
        : compat === "unknown"
          ? `Review ${fieldLabel(field)} in ${opName(operation)} manually.`
          : "No action required.",
  });
}

function requiredChange(
  ctx: Ctx,
  place: SchemaPlace,
  location: Location,
  names: string,
  change: "added" | "removed" | "changed",
): Change {
  const { direction, operation, subject } = place;
  if (change === "added") {
    return make(ctx, {
      kind: "property_became_required",
      compatibility: direction === "request" ? "potentially_breaking" : "compatible",
      direction,
      operation,
      location: { ...location, keyword: "required" },
      reason:
        direction === "request"
          ? `\`${names}\` is now required in ${subject}. Callers that omit it may be rejected.`
          : `\`${names}\` is now always present in ${subject}.`,
      action:
        direction === "request"
          ? `Ensure callers of ${opName(operation)} always send \`${names}\`.`
          : "No action required.",
    });
  }
  if (change === "removed") {
    return make(ctx, {
      kind: "property_became_optional",
      compatibility: direction === "request" ? "compatible" : "potentially_breaking",
      direction,
      operation,
      location: { ...location, keyword: "required" },
      reason:
        direction === "request"
          ? `\`${names}\` is no longer required in ${subject}.`
          : `\`${names}\` is no longer guaranteed in ${subject}. Consumers that assume it is present may break.`,
      action:
        direction === "request"
          ? "No action required."
          : `Handle a missing \`${names}\` in consumers of ${opName(operation)}.`,
    });
  }
  return make(ctx, {
    kind: "required_properties_changed",
    compatibility: "potentially_breaking",
    direction,
    operation,
    location: { ...location, keyword: "required" },
    reason: `The set of required properties in ${subject} changed (\`${names}\`).`,
    action: `Review required fields of ${subject} in ${opName(operation)}.`,
  });
}

// ---------------------------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------------------------

function classifySecurity(
  ctx: Ctx,
  operation: { method: string; path: string } | null,
  rel: Array<string | number>,
): Change {
  const d = ctx.diff;
  const scope = operation ? opName(operation) : "operations that do not declare their own security";
  const direction: Direction = "security";
  const isOptional = (req: Json | undefined) =>
    isObject(req ?? null) && Object.keys(req as object).length === 0;
  const fields = (kind: string, compatibility: Compatibility, reason: string, action: string) =>
    make(ctx, {
      kind,
      compatibility,
      direction,
      operation,
      location: { keyword: "security" },
      reason,
      action,
    });

  if (rel.length === 0) {
    if (d.action === "add") {
      const list = Array.isArray(d.after) ? d.after : [];
      if (list.some((r) => isOptional(r))) {
        return fields(
          "security_requirement_added",
          "compatible",
          `Optional authentication was declared for ${scope}.`,
          "No action required.",
        );
      }
      return fields(
        "security_requirement_added",
        "potentially_breaking",
        `Authentication is now required for ${scope}. Unauthenticated callers may be rejected.`,
        `Ensure callers of ${scope} send valid credentials.`,
      );
    }
    if (d.action === "remove") {
      return fields(
        "security_requirement_removed",
        "compatible",
        `The security requirement for ${scope} was removed.`,
        "No action required.",
      );
    }
    return fields(
      "security_requirement_changed",
      "potentially_breaking",
      `The security requirement for ${scope} changed.`,
      `Verify the credentials callers of ${scope} send.`,
    );
  }
  if (rel.length === 1) {
    // Alternatives (OR): adding one widens, removing one may break callers using it.
    if (d.action === "add") {
      return fields(
        "security_alternative_added",
        "compatible",
        `An additional way to authenticate was added for ${scope}${isOptional(d.after) ? " (authentication is now optional)" : ""}.`,
        "No action required.",
      );
    }
    if (d.action === "remove") {
      return fields(
        "security_alternative_removed",
        "potentially_breaking",
        `An accepted way to authenticate was removed for ${scope}. Callers using it may be rejected.`,
        `Check which credentials callers of ${scope} use.`,
      );
    }
  }
  if (rel.length === 2) {
    // Schemes inside one requirement (AND): adding one tightens, removing one relaxes.
    if (d.action === "add") {
      return fields(
        "security_scheme_required",
        "potentially_breaking",
        `An additional credential (\`${String(rel[1])}\`) is now required for ${scope}.`,
        `Ensure callers of ${scope} send \`${String(rel[1])}\` credentials.`,
      );
    }
    if (d.action === "remove") {
      return fields(
        "security_scheme_no_longer_required",
        "compatible",
        `Credential \`${String(rel[1])}\` is no longer required for ${scope}.`,
        "No action required.",
      );
    }
  }
  if (rel.length === 3) {
    // OAuth scopes inside a requirement.
    if (d.action === "add") {
      return fields(
        "security_scope_added",
        "potentially_breaking",
        `OAuth scope ${JSON.stringify(d.after)} is now required for ${scope}. Tokens without it may be rejected.`,
        `Request the new scope for tokens used with ${scope}.`,
      );
    }
    if (d.action === "remove") {
      return fields(
        "security_scope_removed",
        "compatible",
        `OAuth scope ${JSON.stringify(d.before)} is no longer required for ${scope}.`,
        "No action required.",
      );
    }
  }
  return fields(
    "security_requirement_changed",
    "potentially_breaking",
    `The security requirement for ${scope} changed.`,
    `Verify the credentials callers of ${scope} send.`,
  );
}

function classifySecuritySchemes(ctx: Ctx, rel: Array<string | number>): Change | null {
  const d = ctx.diff;
  const name = rel[0] === undefined ? undefined : String(rel[0]);
  const base = {
    direction: "security" as Direction,
    operation: null,
    location: { keyword: "securitySchemes", ...(name ? { name } : {}) },
  };
  if (rel.length <= 1 && d.action === "add") {
    return make(ctx, {
      ...base,
      kind: "security_scheme_added",
      compatibility: "compatible",
      reason: `Security scheme${name ? ` \`${name}\`` : "s"} added (no effect unless referenced by a requirement).`,
      action: "No action required.",
    });
  }
  if (rel.length <= 1 && d.action === "remove") {
    return make(ctx, {
      ...base,
      kind: "security_scheme_removed",
      compatibility: "potentially_breaking",
      reason: `Security scheme${name ? ` \`${name}\`` : "s"} removed.`,
      action: "Verify how callers authenticate.",
    });
  }
  const leaf = rel[rel.length - 1];
  if (typeof leaf === "string" && (META_KEYWORDS.has(leaf) || isExtension(leaf))) {
    return make(ctx, {
      ...base,
      kind: "security_scheme_documentation_changed",
      compatibility: "non_contract",
      reason: `Documentation of security scheme \`${name}\` changed.`,
      action: "No action required.",
    });
  }
  return make(ctx, {
    ...base,
    kind: "security_scheme_changed",
    compatibility: "potentially_breaking",
    reason: `Security scheme \`${name}\` changed (\`${rel.slice(1).join(".")}\`). Existing credentials may no longer be accepted.`,
    action: "Verify how callers authenticate against the changed scheme.",
  });
}

// ---------------------------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------------------------

function param(ctx: Ctx, opPath: Array<string | number>, index: number): { in: string; name: string } {
  // A whole-parameter add/remove carries the parameter object itself: the most reliable source.
  const own = ctx.diff.action === "remove" ? ctx.diff.before : ctx.diff.after;
  if (
    isObject(own ?? null) &&
    typeof (own as Record<string, Json>).name === "string" &&
    typeof (own as Record<string, Json>).in === "string"
  ) {
    return { in: String((own as Record<string, Json>).in), name: String((own as Record<string, Json>).name) };
  }
  const p = getAt(ctx.merged, [...opPath, "parameters", index]);
  const source = isObject(p ?? null)
    ? (p as Record<string, Json>)
    : isObject(ctx.diff.before ?? null)
      ? (ctx.diff.before as Record<string, Json>)
      : (ctx.diff.after as Record<string, Json>);
  return { in: String(source?.in ?? "?"), name: String(source?.name ?? "?") };
}

function classifyParameter(
  ctx: Ctx,
  operation: { method: string; path: string },
  rest: Array<string | number>,
  opPath: Array<string | number>,
): Change {
  const d = ctx.diff;
  const index = typeof rest[0] === "number" ? rest[0] : -1;
  const p = param(ctx, opPath, index);
  const label = `${p.in} parameter \`${p.name}\``;
  const location: Location = { in: p.in, name: p.name };
  const sub = rest.slice(1);
  const base = { direction: "request" as Direction, operation, location };

  if (sub.length === 0) {
    if (d.action === "add") {
      const required =
        (isObject(d.after ?? null) && (d.after as Record<string, Json>).required === true) || p.in === "path";
      return make(ctx, {
        ...base,
        kind: required ? "required_parameter_added" : "optional_parameter_added",
        compatibility: required ? "potentially_breaking" : "compatible",
        reason: required
          ? `A new required ${label} was added to ${opName(operation)}. Callers that do not send it may be rejected.`
          : `A new optional ${label} was added to ${opName(operation)}.`,
        action: required
          ? `Update callers of ${opName(operation)} to send \`${p.name}\`.`
          : "No action required.",
      });
    }
    if (d.action === "remove") {
      return make(ctx, {
        ...base,
        kind: "parameter_removed",
        compatibility: "potentially_breaking",
        reason: `The ${label} was removed from ${opName(operation)}. Callers that still send it may be rejected or have it ignored.`,
        action: `Stop sending \`${p.name}\` to ${opName(operation)} or confirm it is safely ignored.`,
      });
    }
  }
  const key = sub[0];
  if (key === "required" && sub.length === 1) {
    const nowRequired = d.after === true;
    return make(ctx, {
      ...base,
      kind: nowRequired ? "parameter_became_required" : "parameter_became_optional",
      compatibility: nowRequired ? "potentially_breaking" : "compatible",
      reason: nowRequired
        ? `The ${label} of ${opName(operation)} is now required. Callers that omit it may be rejected.`
        : `The ${label} of ${opName(operation)} is no longer required.`,
      action: nowRequired
        ? `Ensure callers of ${opName(operation)} always send \`${p.name}\`.`
        : "No action required.",
    });
  }
  if (key === "schema") {
    return classifySchema(
      ctx,
      { direction: "request", operation, base: location, subject: `the ${label}` },
      sub.slice(1),
    );
  }
  if (key === "content" && sub[2] === "schema") {
    return classifySchema(
      ctx,
      {
        direction: "request",
        operation,
        base: { ...location, media_type: String(sub[1]) },
        subject: `the ${label}`,
      },
      sub.slice(3),
    );
  }
  if (key === "deprecated") {
    return make(ctx, {
      ...base,
      kind: "parameter_deprecated",
      compatibility: d.after === true ? "compatible" : "non_contract",
      reason: `The ${label} of ${opName(operation)} was ${d.after === true ? "marked deprecated" : "un-deprecated"}.`,
      action: d.after === true ? `Plan to stop sending \`${p.name}\`.` : "No action required.",
    });
  }
  if (
    key === "style" ||
    key === "explode" ||
    key === "allowReserved" ||
    key === "allowEmptyValue" ||
    key === "content"
  ) {
    return make(ctx, {
      ...base,
      kind: "parameter_serialization_changed",
      compatibility: "potentially_breaking",
      location: { ...location, keyword: String(key) },
      reason: `How the ${label} of ${opName(operation)} is serialized changed (\`${String(key)}\`).`,
      action: `Check how callers of ${opName(operation)} encode \`${p.name}\`.`,
    });
  }
  if (typeof key === "string" && (META_KEYWORDS.has(key) || isExtension(key))) {
    return make(ctx, {
      ...base,
      kind: "parameter_documentation_changed",
      compatibility: "non_contract",
      reason: `Documentation of the ${label} of ${opName(operation)} changed.`,
      action: "No action required.",
    });
  }
  return make(ctx, {
    ...base,
    kind: "parameter_change_unsupported",
    compatibility: "unknown",
    reason: `The ${label} of ${opName(operation)} changed (\`${sub.join(".")}\`); rule set 0.1.0 does not evaluate this.`,
    action: `Review the ${label} manually.`,
  });
}

function classifyRequestBody(
  ctx: Ctx,
  operation: { method: string; path: string },
  rest: Array<string | number>,
): Change {
  const d = ctx.diff;
  const base = { direction: "request" as Direction, operation };
  if (rest.length === 0) {
    if (d.action === "add") {
      const required = isObject(d.after ?? null) && (d.after as Record<string, Json>).required === true;
      return make(ctx, {
        ...base,
        kind: required ? "required_request_body_added" : "optional_request_body_added",
        compatibility: required ? "potentially_breaking" : "compatible",
        reason: required
          ? `${opName(operation)} now requires a request body.`
          : `${opName(operation)} now accepts an optional request body.`,
        action: required ? `Update callers of ${opName(operation)} to send a body.` : "No action required.",
      });
    }
    if (d.action === "remove") {
      return make(ctx, {
        ...base,
        kind: "request_body_removed",
        compatibility: "potentially_breaking",
        reason: `${opName(operation)} no longer declares a request body. Callers that send one may be rejected or have it ignored.`,
        action: `Review what callers send to ${opName(operation)}.`,
      });
    }
  }
  const key = rest[0];
  if (key === "required" && rest.length === 1) {
    const now = d.after === true;
    return make(ctx, {
      ...base,
      kind: now ? "request_body_became_required" : "request_body_became_optional",
      compatibility: now ? "potentially_breaking" : "compatible",
      reason: now
        ? `The request body of ${opName(operation)} is now required.`
        : `The request body of ${opName(operation)} is now optional.`,
      action: now ? `Ensure callers of ${opName(operation)} always send a body.` : "No action required.",
    });
  }
  if (key === "content") {
    const mediaType = rest[1] === undefined ? undefined : String(rest[1]);
    if (rest.length <= 2) {
      if (d.action === "add")
        return make(ctx, {
          ...base,
          location: mediaType ? { media_type: mediaType } : {},
          kind: "request_media_type_added",
          compatibility: "compatible",
          reason: `${opName(operation)} now also accepts ${mediaType ?? "new media types"}.`,
          action: "No action required.",
        });
      if (d.action === "remove")
        return make(ctx, {
          ...base,
          location: mediaType ? { media_type: mediaType } : {},
          kind: "request_media_type_removed",
          compatibility: "potentially_breaking",
          reason: `${opName(operation)} no longer accepts ${mediaType ?? "a media type"} request bodies.`,
          action: `Check the Content-Type callers of ${opName(operation)} send.`,
        });
    }
    if (rest[2] === "schema") {
      return classifySchema(
        ctx,
        {
          direction: "request",
          operation,
          base: { media_type: String(mediaType) },
          subject: "the request body",
        },
        rest.slice(3),
      );
    }
    if (rest[2] === "encoding") {
      return make(ctx, {
        ...base,
        location: { media_type: String(mediaType), keyword: "encoding" },
        kind: "request_encoding_changed",
        compatibility: "potentially_breaking",
        reason: `The encoding of ${mediaType} request bodies for ${opName(operation)} changed.`,
        action: `Check how callers of ${opName(operation)} encode the body.`,
      });
    }
    if (typeof rest[2] === "string" && (META_KEYWORDS.has(rest[2]) || isExtension(rest[2]))) {
      return make(ctx, {
        ...base,
        location: { media_type: String(mediaType) },
        kind: "request_body_documentation_changed",
        compatibility: "non_contract",
        reason: `Request body documentation of ${opName(operation)} changed.`,
        action: "No action required.",
      });
    }
  }
  if (typeof key === "string" && (META_KEYWORDS.has(key) || isExtension(key))) {
    return make(ctx, {
      ...base,
      kind: "request_body_documentation_changed",
      compatibility: "non_contract",
      reason: `Request body documentation of ${opName(operation)} changed.`,
      action: "No action required.",
    });
  }
  return make(ctx, {
    ...base,
    kind: "request_body_change_unsupported",
    compatibility: "unknown",
    reason: `The request body of ${opName(operation)} changed (\`${rest.join(".")}\`); rule set 0.1.0 does not evaluate this.`,
    action: "Review the request body manually.",
  });
}

function isSuccess(status: string): boolean {
  return /^2\d\d$/.test(status) || status === "2XX" || status === "default";
}

function classifyResponses(
  ctx: Ctx,
  operation: { method: string; path: string },
  rest: Array<string | number>,
): Change {
  const d = ctx.diff;
  const status = rest[0] === undefined ? undefined : String(rest[0]);
  const base = { direction: "response" as Direction, operation };
  if (status === undefined) {
    return make(ctx, {
      ...base,
      kind: d.action === "remove" ? "responses_removed" : "responses_changed",
      compatibility: "potentially_breaking",
      reason: `The responses of ${opName(operation)} changed.`,
      action: `Review response handling for ${opName(operation)}.`,
    });
  }
  const loc: Location = { status };
  if (rest.length === 1) {
    if (d.action === "add") {
      return make(ctx, {
        ...base,
        location: loc,
        kind: "response_status_added",
        compatibility: "compatible",
        reason: `${opName(operation)} may now return status ${status}.`,
        action: isSuccess(status)
          ? `Optionally handle status ${status} explicitly in consumers of ${opName(operation)}.`
          : "No action required for clients that handle errors generically.",
      });
    }
    if (d.action === "remove") {
      const success = isSuccess(status);
      return make(ctx, {
        ...base,
        location: loc,
        kind: "response_status_removed",
        compatibility: success ? "potentially_breaking" : "compatible",
        reason: success
          ? `${opName(operation)} no longer documents success status ${status}. Consumers expecting it may break.`
          : `${opName(operation)} no longer documents status ${status}.`,
        action: success
          ? `Check which status codes consumers of ${opName(operation)} expect.`
          : "No action required.",
      });
    }
  }
  const key = rest[1];
  if (key === "content") {
    const mediaType = rest[2] === undefined ? undefined : String(rest[2]);
    const mloc: Location = { status, ...(mediaType ? { media_type: mediaType } : {}) };
    if (rest.length <= 3) {
      if (d.action === "add")
        return make(ctx, {
          ...base,
          location: mloc,
          kind: "response_media_type_added",
          compatibility: "compatible",
          reason: `Status ${status} of ${opName(operation)} may now be returned as ${mediaType ?? "new media types"}.`,
          action: "No action required.",
        });
      if (d.action === "remove")
        return make(ctx, {
          ...base,
          location: mloc,
          kind: "response_media_type_removed",
          compatibility: isSuccess(status) ? "potentially_breaking" : "compatible",
          reason: `Status ${status} of ${opName(operation)} is no longer returned as ${mediaType ?? "a media type"}.`,
          action: isSuccess(status)
            ? `Check the Accept header and parsers used by consumers of ${opName(operation)}.`
            : "No action required.",
        });
    }
    if (rest[3] === "schema") {
      return classifySchema(
        ctx,
        { direction: "response", operation, base: mloc, subject: `the ${status} response body` },
        rest.slice(4),
      );
    }
    if (typeof rest[3] === "string" && (META_KEYWORDS.has(rest[3]) || isExtension(rest[3]))) {
      return make(ctx, {
        ...base,
        location: mloc,
        kind: "response_documentation_changed",
        compatibility: "non_contract",
        reason: `Response documentation of ${opName(operation)} changed.`,
        action: "No action required.",
      });
    }
  }
  if (key === "headers") {
    const header = rest[2] === undefined ? undefined : String(rest[2]);
    const hloc: Location = { status, in: "header", ...(header ? { name: header } : {}) };
    if (rest.length <= 3) {
      if (d.action === "add")
        return make(ctx, {
          ...base,
          location: hloc,
          kind: "response_header_added",
          compatibility: "compatible",
          reason: `Status ${status} of ${opName(operation)} may now include header \`${header}\`.`,
          action: "No action required.",
        });
      if (d.action === "remove")
        return make(ctx, {
          ...base,
          location: hloc,
          kind: "response_header_removed",
          compatibility: "potentially_breaking",
          reason: `Status ${status} of ${opName(operation)} no longer documents header \`${header}\`. Consumers that read it may break.`,
          action: `Find code that reads \`${header}\` from ${opName(operation)}.`,
        });
    }
    if (rest[3] === "schema") {
      return classifySchema(
        ctx,
        { direction: "response", operation, base: hloc, subject: `response header \`${header}\`` },
        rest.slice(4),
      );
    }
    if (rest[3] === "required" && rest.length === 4) {
      const now = d.after === true;
      return make(ctx, {
        ...base,
        location: hloc,
        kind: now ? "response_header_became_required" : "response_header_became_optional",
        compatibility: now ? "compatible" : "potentially_breaking",
        reason: now
          ? `Header \`${header}\` is now always returned with status ${status}.`
          : `Header \`${header}\` is no longer guaranteed with status ${status}.`,
        action: now
          ? "No action required."
          : `Handle a missing \`${header}\` in consumers of ${opName(operation)}.`,
      });
    }
    if (
      typeof rest[3] === "string" &&
      (META_KEYWORDS.has(rest[3]) || isExtension(rest[3]) || rest[3] === "deprecated")
    ) {
      return make(ctx, {
        ...base,
        location: hloc,
        kind: "response_documentation_changed",
        compatibility: "non_contract",
        reason: `Documentation of header \`${header}\` changed.`,
        action: "No action required.",
      });
    }
  }
  if (key === "links" || (typeof key === "string" && (META_KEYWORDS.has(key) || isExtension(key)))) {
    return make(ctx, {
      ...base,
      location: loc,
      kind: "response_documentation_changed",
      compatibility: "non_contract",
      reason: `Documentation of status ${status} of ${opName(operation)} changed.`,
      action: "No action required.",
    });
  }
  return make(ctx, {
    ...base,
    location: loc,
    kind: "response_change_unsupported",
    compatibility: "unknown",
    reason: `Status ${status} of ${opName(operation)} changed (\`${rest.slice(1).join(".")}\`); rule set 0.1.0 does not evaluate this.`,
    action: "Review the response manually.",
  });
}

function classifyOperation(ctx: Ctx, pathKey: string, method: string, rest: Array<string | number>): Change {
  const d = ctx.diff;
  const operation = { method: method.toUpperCase(), path: pathKey };
  const opPath = ["paths", pathKey, method];
  const base = { direction: "operation" as Direction, operation };
  if (rest.length === 0) {
    if (d.action === "add")
      return make(ctx, {
        ...base,
        kind: "operation_added",
        compatibility: "compatible",
        reason: `New operation ${opName(operation)}.`,
        action: "No action required.",
      });
    if (d.action === "remove")
      return make(ctx, {
        ...base,
        kind: "operation_removed",
        compatibility: "breaking",
        reason: `Operation ${opName(operation)} was removed. Callers of it will receive errors.`,
        action: `Find and replace all calls to ${opName(operation)}.`,
      });
  }
  const key = rest[0];
  switch (key) {
    case "parameters":
      if (rest.length === 1) {
        return make(ctx, {
          ...base,
          direction: "request",
          kind: d.action === "remove" ? "parameters_removed" : "parameters_changed",
          compatibility: "potentially_breaking",
          reason: `The parameters of ${opName(operation)} changed.`,
          action: `Review the parameters callers of ${opName(operation)} send.`,
        });
      }
      return classifyParameter(ctx, operation, rest.slice(1), opPath);
    case "requestBody":
      return classifyRequestBody(ctx, operation, rest.slice(1));
    case "responses":
      return classifyResponses(ctx, operation, rest.slice(1));
    case "security":
      return classifySecurity(ctx, operation, rest.slice(1));
    case "deprecated":
      return make(ctx, {
        ...base,
        kind: d.after === true ? "operation_deprecated" : "operation_undeprecated",
        compatibility: d.after === true ? "compatible" : "non_contract",
        reason:
          d.after === true
            ? `${opName(operation)} was marked deprecated and may be removed in a future version.`
            : `${opName(operation)} is no longer deprecated.`,
        action: d.after === true ? `Plan to migrate away from ${opName(operation)}.` : "No action required.",
      });
    case "operationId":
      return make(ctx, {
        ...base,
        kind: "operation_id_changed",
        compatibility: "potentially_breaking",
        reason: `The operationId of ${opName(operation)} changed. Generated client method names may change.`,
        action: "Regenerate clients and update call sites if your SDK uses operationIds.",
      });
    case "servers":
      return make(ctx, {
        ...base,
        kind: "operation_servers_changed",
        compatibility: "potentially_breaking",
        reason: `The server URLs for ${opName(operation)} changed.`,
        action: `Check the base URL used to call ${opName(operation)}.`,
      });
    case "callbacks":
      return make(ctx, {
        ...base,
        kind: "callbacks_changed",
        compatibility: "unknown",
        reason: `Callbacks of ${opName(operation)} changed; rule set 0.1.0 does not evaluate callbacks.`,
        action: "Review callbacks manually.",
      });
    default:
      if (typeof key === "string" && (META_KEYWORDS.has(key) || isExtension(key))) {
        return make(ctx, {
          ...base,
          kind: "operation_documentation_changed",
          compatibility: "non_contract",
          reason: `Documentation (\`${key}\`) of ${opName(operation)} changed.`,
          action: "No action required.",
        });
      }
      return make(ctx, {
        ...base,
        kind: "operation_change_unsupported",
        compatibility: "unknown",
        reason: `${opName(operation)} changed (\`${rest.join(".")}\`); rule set 0.1.0 does not evaluate this.`,
        action: `Review ${opName(operation)} manually.`,
      });
  }
}

/** Human-readable path: parameter array indexes replaced by `in:name`. */
function displayPath(diff: RawDiff, merged: Json): string[] {
  const out: string[] = [];
  for (let i = 0; i < diff.path.length; i++) {
    const seg = diff.path[i];
    const prev = diff.path[i - 1];
    if (typeof seg === "number" && prev === "parameters") {
      const p = getAt(merged, [...diff.path.slice(0, i + 1)]);
      const src = isObject(p ?? null)
        ? (p as Record<string, Json>)
        : isObject(diff.before ?? null)
          ? (diff.before as Record<string, Json>)
          : isObject(diff.after ?? null)
            ? (diff.after as Record<string, Json>)
            : null;
      out.push(src ? `${String(src.in)}:${String(src.name)}` : String(seg));
    } else {
      out.push(String(seg));
    }
  }
  return out;
}

/** Classifies one raw diff. Returns one or more findings, or none for changes with no contract surface. */
export function classify(diff: RawDiff, merged: Json): Change[] {
  const ctx: Ctx = { diff, merged, displayPath: displayPath(diff, merged) };
  const path = diff.path;
  const root = path[0];

  if (path.includes("$ref")) {
    return [
      make(ctx, {
        kind: "reference_changed",
        compatibility: "unknown",
        direction: "document",
        operation: null,
        reason:
          "A $ref that could not be resolved locally changed; its target was not fetched (external references are never fetched).",
        action: "Compare the referenced documents manually.",
      }),
    ];
  }

  if (root === "paths") {
    const pathKey = path[1];
    if (typeof pathKey !== "string") return [];
    if (path.length === 2) {
      // Whole path item added/removed: report each operation.
      const item = diff.action === "remove" ? diff.before : diff.after;
      if (!isObject(item ?? null)) return [];
      return Object.keys(item as object)
        .filter((m) => HTTP_METHODS.has(m))
        .sort()
        .flatMap((m) => classify({ ...diff, path: ["paths", pathKey, m] }, merged));
    }
    const second = path[2];
    if (typeof second === "string" && HTTP_METHODS.has(second)) {
      // A whole parameters array added/removed: report each parameter individually.
      if (path.length === 4 && path[3] === "parameters" && diff.action !== "replace") {
        const list = diff.action === "remove" ? diff.before : diff.after;
        if (Array.isArray(list)) {
          return list.flatMap((p, i) =>
            classify(
              {
                action: diff.action,
                path: [...path, i],
                before: diff.action === "remove" ? p : undefined,
                after: diff.action === "add" ? p : undefined,
              },
              merged,
            ),
          );
        }
      }
      return [classifyOperation(ctx, pathKey, second, path.slice(3))];
    }
    if (second === "servers") {
      return [
        make(ctx, {
          kind: "path_servers_changed",
          compatibility: "potentially_breaking",
          direction: "document",
          operation: null,
          location: { name: pathKey },
          reason: `The server URLs for path ${pathKey} changed.`,
          action: `Check the base URL used for ${pathKey}.`,
        }),
      ];
    }
    if (second === "parameters") {
      // api-smart-diff normally merges path-level parameters into each operation; this is a fallback.
      return [
        make(ctx, {
          kind: "path_parameters_changed",
          compatibility: "potentially_breaking",
          direction: "request",
          operation: { method: "*", path: pathKey },
          reason: `Path-level parameters of ${pathKey} changed.`,
          action: `Review parameters for all operations on ${pathKey}.`,
        }),
      ];
    }
    return [
      make(ctx, {
        kind: "path_documentation_changed",
        compatibility: "non_contract",
        direction: "document",
        operation: null,
        location: { name: pathKey },
        reason: `Documentation of path ${pathKey} changed.`,
        action: "No action required.",
      }),
    ];
  }

  if (root === "security") return [classifySecurity(ctx, null, path.slice(1))];

  if (root === "components") {
    if (path.length === 1) {
      // Whole components object added/removed: only security schemes have direct contract effect.
      const comp = diff.action === "remove" ? diff.before : diff.after;
      if (isObject(comp ?? null) && isObject((comp as Record<string, Json>).securitySchemes ?? null)) {
        const change = classifySecuritySchemes(ctx, []);
        return change ? [change] : [];
      }
      return [];
    }
    if (path[1] === "securitySchemes") {
      const change = classifySecuritySchemes(ctx, path.slice(2));
      return change ? [change] : [];
    }
    // Other components affect the contract only through $refs, which are reported where used.
    return [];
  }

  if (root === "servers") {
    return [
      make(ctx, {
        kind: "servers_changed",
        compatibility: "potentially_breaking",
        direction: "document",
        operation: null,
        reason: "The API's server URLs changed.",
        action: "Check the base URL your integration calls.",
      }),
    ];
  }

  if (
    root === "info" ||
    root === "openapi" ||
    root === "tags" ||
    root === "externalDocs" ||
    isExtension(root)
  ) {
    return [
      make(ctx, {
        kind: "document_metadata_changed",
        compatibility: "non_contract",
        direction: "document",
        operation: null,
        reason: `Document metadata (\`${path.join(".")}\`) changed; no contract impact.`,
        action: "No action required.",
      }),
    ];
  }

  return [
    make(ctx, {
      kind: "document_change_unsupported",
      compatibility: "unknown",
      direction: "document",
      operation: null,
      reason: `\`${path.join(".")}\` changed; rule set 0.1.0 does not evaluate this.`,
      action: "Review manually.",
    }),
  ];
}
