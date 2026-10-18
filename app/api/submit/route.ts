import { NextResponse } from "next/server";
import { submissionSchema, toResponseRow } from "@/lib/submission";
import { NotConfigured, rpc } from "@/lib/supabase";

// Receives the completed session once, at the end of the flow, and stores it
// in Supabase (supabase/schema.sql) via the submit_response() function, which
// writes the response and the email to separate, unlinked tables in one
// transaction.
//
// Privacy: never read or log request.ip, x-forwarded-for, user-agent, or the
// request body. Errors are logged by status/code only.

export const dynamic = "force-dynamic";

type Outcome = "inserted" | "duplicate";

async function persist(row: ReturnType<typeof toResponseRow>, email: string): Promise<Outcome> {
  try {
    return (await rpc<boolean>("submit_response", { p_response: row, p_email: email })) === true ? "inserted" : "duplicate";
  } catch (e) {
    if (e instanceof NotConfigured && process.env.NODE_ENV === "development") {
      console.warn(
        "\n*** SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. Development only: the response below was NOT saved. ***\n",
      );
      console.log("SUBMISSION (not saved)", JSON.stringify(row));
      return "inserted";
    }
    throw e;
  }
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

  try {
    const outcome = await persist(toResponseRow(parsed.data), parsed.data.email);
    return NextResponse.json({ ok: true, duplicate: outcome === "duplicate" });
  } catch (e) {
    console.error("submit failed:", e instanceof Error ? e.message : "unknown error");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
