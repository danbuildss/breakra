#!/usr/bin/env sh
# Step 1 of the x402 flow with plain curl: see Breakra's payment terms (free, nothing is signed).
# The terms are in the base64-encoded `payment-required` response header and in the JSON body.
# Paying needs an x402 client that signs a USDC authorization: see examples/client.ts.
curl -sS -i -X POST \
  -H 'content-type: application/json' \
  --data @examples/request.json \
  https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze
