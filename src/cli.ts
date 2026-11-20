#!/usr/bin/env bun
/** Bun entry for a clone of the repo: `bun src/cli.ts check …` / `bun src/cli.ts mcp`. See src/run-cli.ts. */
import { runCli } from "./run-cli";

export { runCli } from "./run-cli";

if (import.meta.main) {
  runCli(process.argv.slice(2)).then((code) => {
    if (process.argv[2] !== "mcp") process.exit(code);
  });
}
