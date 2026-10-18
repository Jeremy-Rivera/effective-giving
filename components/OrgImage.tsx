"use client";

import { useState } from "react";
import { orgById } from "@/lib/orgs";

// Shows /public/orgs/<id>.jpg once it exists; until then (or if it fails to
// load) a neutral block with the organization name, so nothing looks broken.
// Spans only, so it can sit inside the card's header button. The box has a
// fixed aspect ratio, so nothing shifts while the photo loads.
export default function OrgImage({ id, name }: { id: string; name: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const alt = orgById(id)?.imageAlt ?? "";

  return (
    <span className="org-image">
      {state !== "loaded" && <span className="placeholder" aria-hidden="true">{name}</span>}
      {state !== "failed" && (
        // eslint-disable-next-line @next/next/no-img-element -- plain img so a missing file falls back cleanly
        <img
          src={`/orgs/${id}.jpg`}
          alt={alt}
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          className={state === "loaded" ? "" : "pending"}
          ref={(el) => { if (el?.complete && el.naturalWidth > 0 && state === "loading") setState("loaded"); }}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      )}
    </span>
  );
}
