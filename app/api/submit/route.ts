import { NextResponse } from "next/server";

// Receives the completed session once, at the end of the flow.
// Storage is intentionally not wired yet. Swap the body of `persist` for your
// database of choice (Supabase, Neon, Google Sheets via Apps Script, Sanity).
// Do not log request.ip or headers: the consent text says IP is not recorded.

async function persist(record: unknown) {
  if (process.env.SUBMIT_WEBHOOK_URL) {
    const r = await fetch(process.env.SUBMIT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!r.ok) throw new Error(`webhook ${r.status}`);
    return;
  }
  // Fallback for local development only.
  console.log("SUBMISSION", JSON.stringify(record));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.id || !body?.consent) return NextResponse.json({ error: "incomplete" }, { status: 400 });
    await persist({ ...body, receivedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
