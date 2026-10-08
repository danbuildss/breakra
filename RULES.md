# Breakra — Compatibility Rule Set 0.1.0

Implemented in `src/core/classify.ts`. Covered by `tests/rules.test.ts`, `tests/bakeoff.test.ts`, and cross-checked against oasdiff (`scripts/oracle.ts`).
Every finding has `rule` = `<direction>.<kind>`. Bump `RULE_SET_VERSION` (`src/version.ts`) on **any** change to these rules.

## Classes

| Class | Meaning |
|---|---|
| `breaking` | Existing callers **will** fail. Used only where that's certain (a removed operation). |
| `potentially_breaking` | **May** break consumers depending on how they use the API. Review needed. |
| `unknown` | Changed in a way rule set 0.1.0 doesn't evaluate. Never silently ignored. |
| `compatible` | Existing well-behaved consumers are unaffected. |
| `non_contract` | Documentation or metadata only. |

The overall `compatibility` is the most severe class present, in the order breaking > potentially_breaking > unknown > compatible. `non_contract` alone gives `compatible`.
Wording rule: findings say "may break", never "will break" (except `operation_removed`).

## Core principle for schemas

| Direction | Narrowing (fewer valid values) | Widening (more valid values) | Other change |
|---|---|---|---|
| **request** (parameters, request bodies) | `potentially_breaking` (callers' existing values may be rejected) | `compatible` | `potentially_breaking` |
| **response** (response bodies, headers) | `compatible` | `potentially_breaking` (consumers may receive values they don't handle) | `potentially_breaking` |

Keyword effects:
- **Narrowing:** adding or tightening `maximum`, `maxLength`, `maxItems`, `maxProperties`, `minimum`, `minLength`, `minItems`, `minProperties`; adding `pattern`, `format`, `multipleOf`, `enum`, `exclusiveMaximum/Minimum: true`, `uniqueItems: true` or `additionalProperties: false`; removing an enum value; removing a `oneOf`/`anyOf` branch; adding an `allOf` branch; `nullable` true → false; `number` → `integer`.
- **Widening:** the reverse of each of the above, including `integer` → `number`.
- **Changed (potentially breaking both ways):** any other `type` change; `pattern`, `format` or `multipleOf` replaced; `readOnly`/`writeOnly` changed.

## Rules

| Area | Change | Class |
|---|---|---|
| Operation | removed | **breaking** |
| | added | compatible |
| | marked deprecated | compatible |
| | `operationId` changed (affects generated SDKs) | potentially_breaking |
| | operation `servers` changed | potentially_breaking |
| | `callbacks` changed | unknown |
| | summary / description / tags | non_contract |
| Parameter (request) | required parameter added (or any `path` parameter) | potentially_breaking |
| | optional parameter added | compatible |
| | parameter removed | potentially_breaking |
| | optional → required | potentially_breaking |
| | required → optional | compatible |
| | `style` / `explode` / `allowReserved` / `allowEmptyValue` / `content` changed | potentially_breaking |
| | schema changed | per the schema principle (request) |
| | deprecated | compatible |
| Request body | required body added | potentially_breaking |
| | optional body added | compatible |
| | body removed | potentially_breaking |
| | optional → required / required → optional | potentially_breaking / compatible |
| | media type added / removed | compatible / potentially_breaking |
| | `encoding` changed | potentially_breaking |
| Schema property | property added | compatible (a new *required* request property is reported separately as `property_became_required`) |
| | property removed | potentially_breaking (both directions) |
| | became required | request: potentially_breaking · response: compatible |
| | became optional | request: compatible · response: potentially_breaking |
| | `default` changed | request: potentially_breaking · response: non_contract |
| | `discriminator`, inside `not`, unrecognised keywords | unknown |
| Response | status added | compatible |
| | success status (2xx, `default`) removed | potentially_breaking |
| | error status removed | compatible |
| | media type added | compatible |
| | media type removed | success: potentially_breaking · error: compatible |
| | header added / removed | compatible / potentially_breaking |
| | header required → optional / optional → required | potentially_breaking / compatible |
| Security | requirement added where there was none | potentially_breaking (compatible if it includes `{}`, i.e. optional) |
| | requirement removed | compatible |
| | alternative added (OR) / removed | compatible / potentially_breaking |
| | extra scheme required (AND) / no longer required | potentially_breaking / compatible |
| | OAuth scope added / removed | potentially_breaking / compatible |
| | security scheme added / changed / removed | compatible / potentially_breaking / potentially_breaking |
| Document | `servers` changed | potentially_breaking |
| | `info`, `openapi`, `tags`, `externalDocs`, `x-*` | non_contract |
| | changed `$ref` that can't be resolved locally (external) | unknown (targets are never fetched) |
| | changes to unused `components` | not reported (components affect the contract only where referenced, and are reported there) |

## Known differences from oasdiff (documented in `tests/oracle-differences.json`)

Breakra is deliberately more conservative than oasdiff v1.33.0 in two places, per the master brief §10:
- **Authentication added:** oasdiff rates it INFO; Breakra rates it potentially_breaking.
- **Optional response property removed:** oasdiff rates it INFO; Breakra rates it potentially_breaking.
