# Request to Bankr: Bazaar input schema in x402 Cloud 402s (D-038, draft A)

Send to **support@bankr.bot** or the Bankr Help Center (help.bankr.bot). Owner sends; edit freely.

---

**Subject:** x402 Cloud: include `extensions.bazaar` (from `schema`) in 402 responses so endpoints register on x402scan

Hi Bankr team,

I run Breakra on x402 Cloud (`https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`). Hosting and payments work well.

One gap: x402 directories can't fully index x402 Cloud endpoints. x402scan rejects them with **"Missing input schema"**. Its discovery library (`@agentcash/discovery`) looks for the input schema in two places, and neither exists for x402 Cloud endpoints:

1. The 402 challenge's `extensions.bazaar` (`info.input` plus `schema`). Your 402 currently returns only `x402Version`, `error`, `accepts` and `facilitator`.
2. An OpenAPI document at the endpoint's origin (`https://x402.bankr.bot/openapi.json`), which returns nothing.

Discovery's audit (`npx -y @agentcash/discovery <origin> -v`) also reports `COINBASE_SCHEMA_INVALID (resource)`: x402 v2 expects a top-level `resource` object in the 402 (`{ "url", "description", "mimeType" }`), and yours only has `resource` inside `accepts[]`.

You already have the data: every service's `schema.input` / `schema.output` in `bankr.x402.json`. Adding it to the 402 would make every x402 Cloud endpoint indexable. For a POST service it would look like this:

```json
{
  "x402Version": 2,
  "accepts": [ … unchanged … ],
  "extensions": {
    "bazaar": {
      "info": {
        "input": { "type": "http", "method": "POST", "bodyType": "json", "body": { …example… } }
      },
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "input": {
            "type": "object",
            "properties": { "body": { …the service's schema.input… } }
          }
        }
      }
    }
  }
}
```

Reference: x402scan's discovery spec (https://x402scan.com/discovery/spec) and the Bazaar extension docs (https://docs.x402.org/extensions/bazaar). The check is in x402scan's `apps/scan/src/lib/resources.ts`, `validateResource`.

For now I've worked around it by forwarding `https://breakra.dev/api/analyze` to my x402 Cloud endpoint and serving `breakra.dev/openapi.json`. A native fix would help every x402 Cloud seller.

Thanks,
Dan, Breakra (https://breakra.dev)

---

*The shape above matches x402scan's own POST test fixture (`apps/scan/src/lib/x402/v2/schema.test.ts`).*
