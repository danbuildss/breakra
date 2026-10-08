/**
 * Spec pairs cross-checked against oasdiff (scripts/oracle.ts). Each case mutates a copy of the
 * base spec. Keep in sync with the behaviours covered in tests/rules.test.ts.
 */
import { baseSpec, clone, type Spec } from "./helpers";

const RESP = (s: Spec) => s.paths["/users"].get.responses["200"].content["application/json"].schema;
const REQ = (s: Spec) => s.paths["/users"].post.requestBody.content["application/json"].schema;

export interface OracleCase {
  name: string;
  before: Spec;
  after: Spec;
}

function mutated(name: string, mutate: (s: Spec) => void, start: Spec = baseSpec()): OracleCase {
  const after = clone(start);
  mutate(after);
  return { name, before: start, after };
}

function withSecurity(): Spec {
  const s = baseSpec();
  s.components = { securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Key" } } };
  s.security = [{ key: [] }];
  return s;
}

export const ORACLE_CASES: OracleCase[] = [
  mutated("no-change", () => {}),
  mutated("operation-removed", (s) => delete s.paths["/users"].post),
  mutated(
    "operation-added",
    (s) => (s.paths["/health"] = { get: { responses: { "200": { description: "ok" } } } }),
  ),
  mutated("required-param-added", (s) =>
    s.paths["/users"].get.parameters.push({
      name: "region",
      in: "query",
      required: true,
      schema: { type: "string" },
    }),
  ),
  mutated("optional-param-added", (s) =>
    s.paths["/users"].get.parameters.push({ name: "limit", in: "query", schema: { type: "integer" } }),
  ),
  mutated("param-removed", (s) => (s.paths["/users"].get.parameters = [])),
  mutated("param-became-required", (s) => (s.paths["/users"].get.parameters[0].required = true)),
  mutated("param-type-changed", (s) => (s.paths["/users"].get.parameters[0].schema.type = "integer")),
  mutated("request-maxlength-narrowed", (s) => (REQ(s).properties.name.maxLength = 10)),
  mutated("request-maxlength-widened", (s) => (REQ(s).properties.name.maxLength = 500)),
  mutated("request-enum-value-removed", (s) => REQ(s).properties.role.enum.pop()),
  mutated("request-enum-value-added", (s) => REQ(s).properties.role.enum.push("guest")),
  mutated("request-property-became-required", (s) => {
    REQ(s).properties.email = { type: "string" };
    REQ(s).required.push("email");
  }),
  mutated("request-property-removed", (s) => delete REQ(s).properties.age),
  mutated("request-body-became-optional", (s) => (s.paths["/users"].post.requestBody.required = false)),
  mutated("response-property-removed", (s) => delete RESP(s).properties.email),
  mutated("response-property-added", (s) => (RESP(s).properties.nickname = { type: "string" })),
  mutated("response-enum-value-added", (s) => RESP(s).properties.status.enum.push("pending")),
  mutated("response-field-no-longer-required", (s) => (RESP(s).required = [])),
  mutated("response-maxlength-widened", (s) => (RESP(s).properties.email.maxLength = 500)),
  mutated(
    "success-status-replaced",
    (s) => (s.paths["/users"].post.responses = { "202": { description: "accepted" } }),
  ),
  mutated("error-status-removed", (s) => delete s.paths["/users"].get.responses["404"]),
  mutated("operation-security-added", (s) => {
    s.components = { securitySchemes: { key: { type: "apiKey", in: "header", name: "X-Key" } } };
    s.paths["/users"].get.security = [{ key: [] }];
  }),
  mutated("global-security-removed", (s) => delete s.security, withSecurity()),
  mutated("description-only", (s) => (s.paths["/users"].get.description = "new words")),
];
