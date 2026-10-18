// Calls one Postgres function through Supabase's REST API with the server's
// key. Server-only: never import from a client component.
//
// Privacy: errors carry the HTTP status and PostgREST code only, because
// PostgREST messages can echo the values that were sent.

export class NotConfigured extends Error {}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new NotConfigured("storage not configured");

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    // Legacy service_role keys are JWTs and also go in Authorization; the newer
    // sb_secret_ keys are not JWTs and only go in apikey.
    headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) {
    const code = await res.json().then((b) => b?.code, () => undefined);
    throw new Error(`supabase ${res.status}${code ? ` ${code}` : ""}`);
  }
  return (await res.json()) as T;
}
