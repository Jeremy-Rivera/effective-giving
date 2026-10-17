"use client";

import { useState } from "react";
import { orgById } from "@/lib/orgs";

// Shows /public/orgs/<id>.jpg once it exists; until then (or if it fails to
// load) a neutral block with the organization name, so nothing looks broken.
export default function OrgImage({ id, name, large }: { id: string; name: string; large?: boolean }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const alt = orgById(id)?.imageAlt ?? "";

  return (
    <div className={`org-image${large ? " large" : ""}`}>
      {state !== "loaded" && <div className="placeholder" aria-hidden="true">{name}</div>}
      {state !== "failed" && (
        // eslint-disable-next-line @next/next/no-img-element -- plain img so a missing file falls back cleanly
        <img
          src={`/orgs/${id}.jpg`}
          alt={alt}
          aria-hidden={alt ? undefined : true}
          className={state === "loaded" ? "" : "pending"}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      )}
    </div>
  );
}
