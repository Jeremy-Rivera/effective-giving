// Accepts either a bare YouTube id or any common YouTube link, so the env vars
// can hold whatever was copied from YouTube's Share button:
//   NIOSrCD-yIM
//   https://youtu.be/NIOSrCD-yIM?si=abc
//   https://www.youtube.com/watch?v=NIOSrCD-yIM&t=10s
//   https://www.youtube.com/embed/NIOSrCD-yIM
//   https://www.youtube.com/shorts/NIOSrCD-yIM
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youTubeId(input: string | undefined): string {
  const s = (input ?? "").trim();
  if (ID.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^(www\.|m\.)/, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com")
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1] ?? "";
    return ID.test(id) ? id : "";
  } catch {
    return "";
  }
}
