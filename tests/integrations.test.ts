/** Partner proof kits (integrations/): expected results match the engine, and the kits quote exactly those files. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { CASES, expected, fixture } from "../scripts/integration-kits";
import { analyze } from "../src/analyze";
import { parseSpecText } from "../src/core/validate";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const pkg = JSON.parse(read("package.json"));
const result = (c: string) => JSON.parse(read(`integrations/fixtures/${c}/expected.json`));

describe("shared fixtures", () => {
  it("expected.json is exactly what the engine returns", async () => {
    for (const c of CASES)
      expect(read(`integrations/fixtures/${c}/expected.json`), c).toBe(await expected(c));
    expect(result("breaking").verdict).toBe("block");
    expect(result("safe").verdict).toBe("safe");
  });

  it("the analysis_id is the same for YAML text, JSON text and objects (what the kits promise)", async () => {
    for (const c of CASES) {
      const [b, a] = [fixture(c, "before"), fixture(c, "after")];
      const asObjects = await analyze({ before: parse(b), after: parse(a) });
      const asJsonText = await analyze({
        before: parseSpecText(JSON.stringify(parse(b)), "before"),
        after: parseSpecText(JSON.stringify(parse(a), null, 2), "after"),
      });
      expect(asObjects.analysis_id).toBe(result(c).analysis_id);
      expect(asJsonText.analysis_id).toBe(result(c).analysis_id);
    }
  });
});

describe("Bankr kit", () => {
  const readme = read("integrations/bankr/README.md");
  it("message 2 carries the fixtures verbatim and the table shows the expected ids", () => {
    for (const c of CASES) {
      expect(readme).toContain(fixture(c, "before").trimEnd());
      expect(readme).toContain(fixture(c, "after").trimEnd());
      expect(readme).toContain(result(c).analysis_id);
    }
    expect(readme).toContain("install the skill at https://github.com/danbuildss/breakra");
    expect(readme).toContain(`npx -y breakra@${pkg.version}`);
    expect(readme).toMatch(/not\*\* in the Bankr skills catalog/); // never claim catalog approval
  });
});

describe("Aeon pack", () => {
  const manifest = JSON.parse(read("integrations/aeon/skills-pack.json"));
  const skill = read("integrations/aeon/skills/breakra-check/SKILL.md");
  it("bundles the shared fixtures unchanged", () => {
    for (const c of CASES)
      for (const side of ["before", "after"] as const)
        expect(read(`integrations/aeon/skills/breakra-check/fixtures/${c}/${side}.yaml`)).toBe(
          fixture(c, side),
        );
  });

  it("is pinned to the published package and declared read-only with no secrets", () => {
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.skills).toHaveLength(1);
    const [s] = manifest.skills;
    expect(s.slug).toBe("breakra-check");
    expect(s.path).toBe("skills/breakra-check");
    expect(s.default_enabled).toBe(false);
    expect(s.secrets_required).toEqual([]);
    expect(s.capabilities).toEqual(["read_only", "sends_notifications"]);
    const front = parse(skill.split("---")[1] ?? "");
    expect(front.name).toBe("breakra-check");
    expect(front.metadata.mode).toBe("read-only");
    const pins = [...skill.matchAll(/breakra@([0-9.]+)/g)].map((m) => m[1]);
    expect(pins.length).toBeGreaterThan(0);
    expect(new Set(pins)).toEqual(new Set([pkg.version]));
  });
});
