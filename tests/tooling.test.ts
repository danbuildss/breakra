/** Build and benchmark tooling (Socket finding, 2026-11-20): untrusted versions never reach a shell or a path. */
import { describe, expect, it } from "vitest";
import { checkVersion } from "../scripts/lib/github-slice";

describe("scripts/lib/github-slice", () => {
  it("accepts plain semver versions", () => {
    expect(checkVersion("22.0.0")).toBe("22.0.0");
  });
  it.each(["22.0.0; rm -rf /", "../../etc", "22.0.0 && echo x", "$(id)", "latest", ""])("rejects %j", (v) => {
    expect(() => checkVersion(v)).toThrow();
  });
});
