"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import { updateSession } from "@/lib/store";
import { useT } from "@/lib/i18n";

const IDS = {
  control: process.env.NEXT_PUBLIC_VIDEO_CONTROL_ID ?? "",
  treatment: process.env.NEXT_PUBLIC_VIDEO_TREATMENT_ID ?? "",
};
const GATE = Number(process.env.NEXT_PUBLIC_VIDEO_GATE ?? "0.9");

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

export default function WatchPage() {
  const router = useRouter();
  return (
    <RequireSession>
      {(s) => <Player videoId={IDS[s.condition]} onDone={(v) => { updateSession({ video: v }); router.push("/give"); }} />}
    </RequireSession>
  );
}

function Player({ videoId, onDone }: { videoId: string; onDone: (v: { watchedFraction: number; secondsOnPage: number }) => void }) {
  const { t } = useT();
  const [fraction, setFraction] = useState(0);
  const started = useRef(Date.now());
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoId) return;
    const init = () => {
      playerRef.current = new window.YT.Player("yt-player", { videoId, playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } });
    };
    if (window.YT?.Player) init();
    else {
      window.onYouTubeIframeAPIReady = init;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const timer = setInterval(() => {
      const p = playerRef.current;
      if (p?.getDuration && p.getDuration() > 0) setFraction((f) => Math.max(f, p.getCurrentTime() / p.getDuration()));
    }, 1000);
    return () => clearInterval(timer);
  }, [videoId]);

  const unlocked = fraction >= GATE || !videoId;

  return (
    <>
      <p className="progress">{t.common.stepOf(2, 4)}</p>
      <h1>{t.watch.title}</h1>
      <p className="lede">{t.watch.lede}</p>
      {videoId ? <div className="video-frame"><div id="yt-player" /></div> : <p className="error">{t.watch.noVideo}</p>}
      <button
        className="primary"
        type="button"
        disabled={!unlocked}
        onClick={() => onDone({ watchedFraction: Math.round(fraction * 100) / 100, secondsOnPage: Math.round((Date.now() - started.current) / 1000) })}
      >
        {t.watch.cont}
      </button>
    </>
  );
}
