// Test-only stand-in for Supabase: runs supabase/schema.sql in PGlite (real
// Postgres compiled to WASM) and exposes the two PostgREST endpoints the app
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

// When true, rpc/assign_condition fails, to exercise the client fallback.
let assignDown = false;
// Run statements one at a time, as Postgres would with the row lock held.
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

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
        if (req.headers.apikey !== KEY) return send(res, 401, { code: "PGRST301" });
        const { p_response, p_email } = JSON.parse(await read(req));
        const r = await db.query("select public.submit_response($1::jsonb, $2) as ok", [JSON.stringify(p_response), p_email]);
        return send(res, 200, r.rows[0].ok);
      }
      if (req.method === "POST" && req.url === "/rest/v1/rpc/assign_condition") {
        if (req.headers.apikey !== KEY) return send(res, 401, { code: "PGRST301" });
        if (assignDown) return send(res, 503, { code: "fake-down" });
        const r = await serial(() => db.query("select public.assign_condition() as arm"));
        return send(res, 200, r.rows[0].arm);
      }
      if (req.method === "GET" && req.url === "/__test/counter") {
        return send(res, 200, (await db.query("select n_control, n_treatment from public.assignment_state")).rows[0]);
      }
      if (req.method === "POST" && req.url?.startsWith("/__test/assign-down")) {
        assignDown = req.url.endsWith("=1");
        return send(res, 200, { assignDown });
      }
      if (req.method === "POST" && req.url === "/__test/delete-test-data") {
        await db.exec(readFileSync(new URL("../supabase/delete-test-data.sql", import.meta.url), "utf8"));
        return send(res, 200, { ok: true });
      }
      if (req.method === "POST" && req.url === "/__test/old-row") {
        // A row as the v1 code wrote it (no v2 fields), through the real function.
        const body = JSON.parse(await read(req));
        const r = await db.query("select public.submit_response($1::jsonb, $2) as ok", [JSON.stringify(body), "v1@example.com"]);
        return send(res, 200, r.rows[0].ok);
      }
      if (req.method === "GET" && req.url === "/__test/rows") {
        const responses = (await db.query("select * from public.responses order by received_at")).rows;
        const emails = (await db.query("select * from public.contact_emails")).rows;
        const exported = (await db.query("select * from public.responses_export")).rows;
        return send(res, 200, { responses, emails, exported });
      }
      if (req.method === "POST" && req.url === "/__test/reset") {
        await db.exec("truncate public.responses; truncate public.contact_emails; update public.assignment_state set n_control = 0, n_treatment = 0;");
        assignDown = false;
        return send(res, 200, { ok: true });
      }
      send(res, 404, { code: "not found" });
    } catch (e) {
      send(res, 500, { code: "fake", message: String(e?.message ?? e) });
    }
  })
  .listen(PORT, () => console.log(`fake supabase on :${PORT}`));
