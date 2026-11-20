/**
 * npm entry (D-041): built by scripts/build-npm.ts into dist/npm/cli.js for plain Node (>= 20).
 * Node has no built-in YAML parser, so the `yaml` package is bundled here (and only here: the Bankr handler
 * keeps Bun's parser and its bundle size).
 */
import { setYamlParser } from "./core/validate";
import { parseYamlForNode } from "./node-yaml";
import { runCli } from "./run-cli";

if (!(globalThis as { Bun?: { YAML?: unknown } }).Bun?.YAML) setYamlParser(parseYamlForNode);

const argv = process.argv.slice(2);
runCli(argv).then((code) => {
  if (argv[0] !== "mcp") process.exit(code);
});
