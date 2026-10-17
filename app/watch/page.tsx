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
const TICK_MS = 500;

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

export default function WatchPage() {
  const router = useRouter();
  return (
    <RequireSession>
      {(s) => {
        const videoId = IDS[s.condition];
        return (
          <Player
            videoId={videoId}
            onDone={(v) => { updateSession({ video: v, videoId }); router.push("/give"); }}
          />
        );
      }}
    </RequireSession>
  );
}

function Player({ videoId, onDone }: { videoId: string; onDone: (v: { watchedFraction: number; secondsOnPage: number }) => void }) {
  const { t } = useT();
  const [fraction, setFraction] = useState(0);
  const started = useRef(Date.now());
  const playerRef = useRef<any>(null);
  // Furthest point reached by continuous playback. Seeking back keeps it;
  // seeking ahead past it does not count until playback actually gets there.
  const frontier = useRef(0);

  useEffect(() => {
    if (!videoId) return;
    const init = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        // rel: 0 keeps end-of-video suggestions to the same channel; nothing autoplays.
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 0 },
      });
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
      const duration = p?.getDuration?.() ?? 0;
      if (duration <= 0) return;
      const now = p.getCurrentTime();
      // Allow one tick of playback at the current speed, plus slack for timer jitter.
      const reach = (TICK_MS / 1000) * (p.getPlaybackRate?.() ?? 1) + 1;
      if (now >= frontier.current && now <= frontier.current + reach) frontier.current = now;
      if (p.getPlayerState?.() === window.YT?.PlayerState?.ENDED && frontier.current >= duration - reach) frontier.current = duration;
      setFraction(Math.min(1, frontier.current / duration));
    }, TICK_MS);
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
