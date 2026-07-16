export type VimeoVideo = {
  provider: "vimeo";
  videoId: string;
  hash?: string;
  playerUrl: string;
};

const VIMEO_ID_RE = /^\d{6,12}$/;
const VIMEO_HASH_RE = /^[a-zA-Z0-9_-]{6,64}$/;

export function normalizeVimeoUrl(value: string): VimeoVideo {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw invalidVimeoUrl();
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (
    url.protocol !== "https:" ||
    url.port !== "" ||
    (host !== "vimeo.com" && host !== "player.vimeo.com")
  ) throw invalidVimeoUrl();

  const parts = url.pathname.split("/").filter(Boolean);
  const isPlayerUrl = host === "player.vimeo.com";
  if (isPlayerUrl ? parts.length !== 2 || parts[0] !== "video" : parts.length < 1 || parts.length > 2) {
    throw invalidVimeoUrl();
  }
  const videoIndex = isPlayerUrl ? 1 : 0;
  const videoId = parts[videoIndex];
  const pathHash = parts[videoIndex + 1];
  const queryHash = url.searchParams.get("h") ?? undefined;
  if (isPlayerUrl && pathHash) throw invalidVimeoUrl();
  if (!isPlayerUrl && queryHash) throw invalidVimeoUrl();
  const hash = queryHash ?? pathHash;

  if (!videoId || !VIMEO_ID_RE.test(videoId)) throw invalidVimeoUrl();
  if (hash && !VIMEO_HASH_RE.test(hash)) throw invalidVimeoUrl();

  const playerUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
  if (hash) playerUrl.searchParams.set("h", hash);

  return {
    provider: "vimeo",
    videoId,
    ...(hash ? { hash } : {}),
    playerUrl: playerUrl.toString(),
  };
}

export function isVimeoVideoId(value: string | undefined): value is string {
  return Boolean(value && VIMEO_ID_RE.test(value));
}

export function isVimeoHash(value: string | undefined): value is string {
  return Boolean(value && VIMEO_HASH_RE.test(value));
}

function invalidVimeoUrl() {
  return Object.assign(new Error("URL Vimeo không hợp lệ"), { status: 400 });
}
