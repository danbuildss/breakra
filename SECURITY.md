# Security policy

## Reporting a vulnerability

Please **don't open a public issue**. Report privately through GitHub: the repository's **Security** tab → **Report a vulnerability**.

Include what you found, how to reproduce it (a minimal request body if relevant), and the impact you expect. Please don't include real private API specifications; a minimal synthetic example is enough.

You'll get an acknowledgement as soon as the maintainer sees it. Please allow time for a fix and redeploy before disclosing publicly.

## In scope

- The analysis engine and handler in this repository (`src/`).
- The hosted endpoint `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/breakra-analyze`, as far as Breakra's own code is concerned: input handling, resource limits, error responses, logging of submitted content.

## Out of scope

- Bankr x402 Cloud itself (hosting, payment facilitation, gateway): report those to Bankr.
- The x402 protocol and its client libraries.
- Denial-of-service by volume: every analysis is paid.

## Design notes

- Requests to `https://breakra.dev/api/analyze` are forwarded by Vercel, unchanged, to the Bankr endpoint (D-038); Breakra does not store them there either.
- Submitted specifications are never stored or logged; logs hold only outcome, size, change count, duration and the paying address.
- External `$ref`s are never fetched. Inputs are bounded (1 MB, nesting, node, operation and `$ref`-expansion limits).
- Every error is a non-2xx response, so it is never charged.
