"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type Session } from "@/lib/store";

// Sends people back to the consent page if they land mid-flow without consenting.
export default function RequireSession({ children }: { children: (s: Session) => React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s || !s.consent) router.replace("/");
    else setSession(s);
  }, [router]);

  if (!session) return null;
  return <>{children(session)}</>;
}
