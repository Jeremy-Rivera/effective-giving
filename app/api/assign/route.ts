import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";

// Called once, at the consent click, to pick Control or Treatment. The
// assign_condition() function (supabase/schema.sql) locks a single counter
// row and picks the arm with fewer assignments so far, so the split stays
// within one even when many people consent at the same moment. It stores no
// participant data: no id, no timestamp, just two counts.
//
// If this fails, the browser falls back to its own coin flip and records
// assignment_method = "client_fallback".
//
// Privacy: never read or log request.ip, x-forwarded-for, user-agent, or the
// request body.

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const condition = await rpc<string>("assign_condition", {});
    if (condition !== "control" && condition !== "treatment") throw new Error("unexpected arm");
    return NextResponse.json({ condition });
  } catch (e) {
    console.error("assign failed:", e instanceof Error ? e.message : "unknown error");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
