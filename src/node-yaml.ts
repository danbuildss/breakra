import { parse } from "yaml";

/**
 * YAML 1.2 (core schema) for Node, with the same safety posture as Bun's parser: data only (no custom tags),
 * duplicate keys rejected, and alias expansion capped (`maxAliasCount`) against "billion laughs". The node,
 * depth and $ref limits in validateSpec still apply to the result.
 */
export function parseYamlForNode(text: string): unknown {
  return parse(text, {
    version: "1.2",
    schema: "core",
    customTags: [],
    uniqueKeys: true,
    maxAliasCount: 100,
    prettyErrors: false,
  });
}
