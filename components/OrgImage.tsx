"use client";

import { useState } from "react";
import { orgById } from "@/lib/orgs";
import { useT } from "@/lib/i18n";

// Shows /public/orgs/<id>.jpg once it exists; until then (or if it fails to
// load) a neutral block with the organization name, so nothing looks broken.
export default function OrgImage({ id, name, large }: { id: string; name: string; large?: boolean }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const { t } = useT();
  const org = orgById(id);
  const alt = org?.imageAlt ?? "";

  const image = (
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
  if (!large || !org?.credit || state === "failed") return image;
  // Plain text on purpose: a link here would let participants leave the study.
  return (
    <figure className="org-figure">
      {image}
      <figcaption className="credit">{t.give.photo}: {org.credit}</figcaption>
    </figure>
  );
}
