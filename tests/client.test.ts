/** examples/client.ts must enforce every term in SKILL.md's table and never call an ambiguous failure "free". */
import { describe, expect, it } from "vitest";
import { acceptableTerms, paidOutcome } from "../examples/client";

const good = {
  scheme: "exact",
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: "20000",
  payTo: "0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0",
  maxTimeoutSeconds: 60,
  extra: { name: "USD Coin", version: "2" },
};
const terms = (over: Record<string, unknown> = {}, version = 2) => ({
  x402Version: version,
  accepts: [{ ...good, ...over }],
});

describe("acceptableTerms (checked before anything is signed)", () => {
  it("accepts Breakra's live terms", () => {
    expect(acceptableTerms(terms())).toEqual(good);
    expect(acceptableTerms(terms({ extra: { assetTransferMethod: "eip3009" } }))).not.toBeNull();
    expect(acceptableTerms(terms({ amount: "10000", maxTimeoutSeconds: 30 }))).not.toBeNull();
  });

  it.each([
    ["another recipient", { payTo: "0x0000000000000000000000000000000000000001" }],
    ["a longer signature validity", { maxTimeoutSeconds: 3600 }],
    ["no signature validity", { maxTimeoutSeconds: undefined }],
    ["a Permit2 transfer", { extra: { assetTransferMethod: "permit2" } }],
    ["a higher amount", { amount: "20001" }],
    ["another asset", { asset: "0x0000000000000000000000000000000000000002" }],
    ["another network", { network: "eip155:1" }],
    ["another scheme", { scheme: "upto" }],
    ["a non-numeric amount", { amount: "0.02" }],
  ])("refuses %s", (_, over) => {
    expect(acceptableTerms(terms(over))).toBeNull();
  });

  it("refuses anything but x402 v2", () => {
    expect(acceptableTerms(terms({}, 1))).toBeNull();
  });
});

describe("paidOutcome (after the signed request)", () => {
  it("only Breakra's success is charged", () => {
    expect(paidOutcome(200, { status: "success", analysis_id: "sha256:…" })).toBe("charged");
  });

  it("Breakra's own JSON errors and x402 rejections are not charged", () => {
    expect(paidOutcome(422, { status: "error", error: { code: "INVALID_SPECIFICATION" } })).toBe(
      "not_charged",
    );
    expect(paidOutcome(500, { status: "error", error: { code: "ANALYSIS_FAILED" } })).toBe("not_charged");
    expect(paidOutcome(402, { x402Version: 2, error: "Payment already used" })).toBe("not_charged");
  });

  it("gateway errors and unparseable bodies are unknown, never 'free'", () => {
    expect(paidOutcome(504, null)).toBe("unknown"); // HTML/text from a proxy
    expect(paidOutcome(502, { error: { code: "ROUTER_EXTERNAL_TARGET_ERROR" } })).toBe("unknown");
    expect(paidOutcome(500, { status: "error", error: { code: "SOMETHING_ELSE" } })).toBe("unknown");
    expect(paidOutcome(200, null)).toBe("unknown");
  });
});
