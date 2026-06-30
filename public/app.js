/* global Hls */

const STREAM_URL = "https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8";
const TRACK_CHANGE_DELAY_MS = 4000; // wait for audio stream to catch up

let currentTrackId = null;
let playing = false;

// ── Ratings ───────────────────────────────────────────────────────────────────

export function currentTrackIdStr() {
  return `${document.getElementById("artist").textContent}|||${document.getElementById("title").textContent}`;
}

export function applyRatingState({ up, down, userRating }) {
  document.getElementById("count-up").textContent   = up;
  document.getElementById("count-down").textContent = down;

  const btnUp   = document.getElementById("rate-up");
  const btnDown = document.getElementById("rate-down");

  btnUp.classList.toggle("active",  userRating === "up");
  btnDown.classList.toggle("active", userRating === "down");

  // Dim the unchosen button when voted, but keep both clickable for changes
  btnUp.style.opacity   = userRating && userRating !== "up"   ? "0.45" : "1";
  btnDown.style.opacity = userRating && userRating !== "down" ? "0.45" : "1";
}

export async function loadRatings() {
  const trackId = currentTrackIdStr();
  const data = await fetch(`/api/ratings?trackId=${encodeURIComponent(trackId)}`).then(r => r.json());
  applyRatingState(data);
}

export async function rate(val) {
  const trackId = currentTrackIdStr();
  const res = await fetch("/api/rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId, rating: val }),
  });
  const data = await res.json();
  if (res.ok) applyRatingState(data);
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function applyNowPlaying(data) {
  document.getElementById("artist").textContent         = data.artist;
  document.getElementById("title").textContent          = data.title;
  document.getElementById("source-quality").textContent = data.sourceQuality;
  document.getElementById("stream-quality").textContent = data.streamQuality;

  const showAlbum = data.album && data.album.toLowerCase() !== data.artist.toLowerCase();
  document.getElementById("album").textContent = showAlbum ? data.album : "";

  if (data.albumArt) {
    const img = document.getElementById("album-art-img");
    const placeholder = document.getElementById("album-art-placeholder");
    img.onload = () => {
      placeholder.style.display = "none";
      img.style.display = "block";
    };
    img.src = data._artCacheBust ? `${data.albumArt}?t=${data._artCacheBust}` : data.albumArt;
  }

  loadRatings();
}

export async function loadNowPlaying() {
  const data = await fetch("/api/now-playing").then(r => r.json());
  const trackId = `${data.artist}|||${data.title}`;

  if (trackId !== currentTrackId) {
    currentTrackId = trackId;
    // Bust the album art cache only when the track changes, not every poll
    data._artCacheBust = Date.now();
    // Delay UI update so the audio stream has time to switch tracks
    setTimeout(() => applyNowPlaying(data), TRACK_CHANGE_DELAY_MS);
  } else {
    applyNowPlaying(data);
  }
}

export async function loadPreviousTracks() {
  const tracks = await fetch("/api/previous-tracks").then(r => r.json());
  document.getElementById("track-list").innerHTML = tracks.length
    ? tracks.map(t =>
        `<div class="track-row">
          <span class="t-title">${t.title}</span>
          <span class="t-artist">${t.artist}</span>
        </div>`
      ).join("")
    : `<div class="track-row"><span class="t-artist">Waiting for the next track…</span></div>`;
}

// ── Browser initialization — skipped during Vitest runs ──────────────────────
if (!import.meta.env?.TEST) {
  const html      = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const saved     = localStorage.getItem("theme") || "light";
  html.setAttribute("data-theme", saved);

  toggleBtn.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  const audio   = document.getElementById("stream");
  const playBtn = document.getElementById("play-btn");
  const volume  = document.getElementById("volume");

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
  } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
    audio.src = STREAM_URL;
  }

  audio.volume = volume.value;

  playBtn.addEventListener("click", () => {
    if (playing) {
      audio.pause();
      playBtn.textContent = "▶";
    } else {
      audio.play();
      playBtn.textContent = "⏸";
    }
    playing = !playing;
  });

  volume.addEventListener("input", () => { audio.volume = volume.value; });

  document.getElementById("rate-up").addEventListener("click",   () => rate("up"));
  document.getElementById("rate-down").addEventListener("click", () => rate("down"));

  loadNowPlaying();
  loadPreviousTracks();
  setInterval(loadNowPlaying, 10_000);
  setInterval(loadPreviousTracks, 10_000);
}
