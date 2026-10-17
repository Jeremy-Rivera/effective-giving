// Test-only stand-in for Supabase: runs supabase/schema.sql in PGlite (real
// Postgres compiled to WASM) and exposes the one PostgREST endpoint the app
// calls, plus a few helpers the Playwright tests use to inspect the tables.
//
//   node tests/fake-supabase.mjs            # listens on :54321
//
// Not shipped; only used by `npm run test:e2e`.

import http from "node:http";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54321);
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-service-role-key";

const db = new PGlite();
// Supabase creates these roles; PGlite needs them before the GRANT/REVOKEs.
await db.exec("create role anon; create role authenticated; create role service_role;");
await db.exec(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));

const read = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/rest/v1/rpc/submit_response") {
        if (req.headers.apikey !== KEY || req.headers.authorization !== `Bearer ${KEY}`) return send(res, 401, { code: "PGRST301" });
        const { p_response, p_email } = JSON.parse(await read(req));
        const r = await db.query("select public.submit_response($1::jsonb, $2) as ok", [JSON.stringify(p_response), p_email]);
        return send(res, 200, r.rows[0].ok);
      }
      if (req.method === "GET" && req.url === "/__test/rows") {
        const responses = (await db.query("select * from public.responses order by received_at")).rows;
        const emails = (await db.query("select * from public.contact_emails")).rows;
        const exported = (await db.query("select * from public.responses_export")).rows;
        return send(res, 200, { responses, emails, exported });
      }
      if (req.method === "POST" && req.url === "/__test/reset") {
        await db.exec("truncate public.responses; truncate public.contact_emails;");
        return send(res, 200, { ok: true });
      }
      send(res, 404, { code: "not found" });
    } catch (e) {
      send(res, 500, { code: "fake", message: String(e?.message ?? e) });
    }
  })
  .listen(PORT, () => console.log(`fake supabase on :${PORT}`));
