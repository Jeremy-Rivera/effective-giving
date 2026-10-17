import { NextResponse } from "next/server";
import { submissionSchema, toResponseRow } from "@/lib/submission";

// Receives the completed session once, at the end of the flow, and stores it
// in Supabase (supabase/schema.sql) via the submit_response() function, which
// writes the response and the email to separate, unlinked tables in one
// transaction.
//
// Privacy: never read or log request.ip, x-forwarded-for, user-agent, or the
// request body. Errors are logged by status/code only.

export const dynamic = "force-dynamic";

type Outcome = "inserted" | "duplicate";

async function persist(row: ReturnType<typeof toResponseRow>, email: string | undefined): Promise<Outcome> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "\n*** SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. Development only: the response below was NOT saved. ***\n",
      );
      console.log("SUBMISSION (not saved)", JSON.stringify(row));
      return "inserted";
    }
    throw new Error("storage not configured");
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/submit_response`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_response: row, p_email: email ?? null }),
    cache: "no-store",
  });
  if (!res.ok) {
    // PostgREST error messages can echo row values, so log the code only.
    const code = await res.json().then((b) => b?.code, () => undefined);
    throw new Error(`supabase ${res.status}${code ? ` ${code}` : ""}`);
  }
  return (await res.json()) === true ? "inserted" : "duplicate";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    // Paths and messages only; never the submitted values.
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    return NextResponse.json({ error: "invalid", issues }, { status: 400 });
  }

  const email = parsed.data.email || undefined;
  try {
    const outcome = await persist(toResponseRow(parsed.data), email);
    return NextResponse.json({ ok: true, duplicate: outcome === "duplicate" });
  } catch (e) {
    console.error("submit failed:", e instanceof Error ? e.message : "unknown error");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
