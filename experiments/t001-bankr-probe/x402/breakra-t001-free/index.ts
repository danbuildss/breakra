/**
 * T-001 DISPOSABLE probe: is a price-0 (free) Bankr service possible?
 * NOT the Breakra product.
 */
export default async function handler(_req: Request): Promise<Response> {
  return Response.json({ case: "free", ok: true });
}
