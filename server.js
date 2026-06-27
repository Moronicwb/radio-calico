const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = 3001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const METADATA_URL = "https://d3d4yli4hf5bmh.cloudfront.net/metadata.json";
const ALBUM_ART_URL = "https://radio3.radio-calico.com/cover.jpg";

app.use(express.json());
app.use(express.static("public"));

// Derive a stable user identifier from IP + User-Agent (no login required)
function getUserId(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip;
  const ua = req.headers["user-agent"] || "";
  // Combine IP + UA so different browsers on the same IP are distinct
  return `${ip}::${ua}`;
}

// ── Now-playing state ──────────────────────────────────────────────────────
let nowPlaying = null;
const previousTracks = [];

async function fetchMetadata() {
  try {
    const res = await fetch(METADATA_URL);
    const data = await res.json();

    const incoming = {
      artist: data.artist,
      title: data.title,
      album: data.album,
      sourceQuality: `${data.bit_depth}-bit ${(data.sample_rate / 1000).toFixed(1)}kHz`,
      streamQuality: "48kHz FLAC / HLS Lossless",
      albumArt: ALBUM_ART_URL,
    };

    if (nowPlaying && (nowPlaying.artist !== incoming.artist || nowPlaying.title !== incoming.title)) {
      previousTracks.unshift({ artist: nowPlaying.artist, title: nowPlaying.title });
      if (previousTracks.length > 10) previousTracks.pop();
    }

    nowPlaying = incoming;
  } catch (err) {
    console.error("Metadata fetch failed:", err.message);
  }
}


// ── Routes ─────────────────────────────────────────────────────────────────
app.get("/api/now-playing", (req, res) => {
  res.json(nowPlaying ?? { artist: "Loading…", title: "", album: "", sourceQuality: "", streamQuality: "", albumArt: null });
});

app.get("/api/previous-tracks", (req, res) => {
  res.json(previousTracks);
});

// GET /api/ratings?trackId=...
// Returns { up, down, userRating } — userRating derived from request IP+UA
app.get("/api/ratings", async (req, res) => {
  const { trackId } = req.query;
  if (!trackId) return res.status(400).json({ error: "trackId required" });

  const userId = getUserId(req);

  const [counts, existing] = await Promise.all([
    pool.query(
      `SELECT rating, COUNT(*) AS count FROM ratings WHERE track_id = $1 GROUP BY rating`,
      [trackId]
    ),
    pool.query(
      `SELECT rating FROM ratings WHERE track_id = $1 AND user_id = $2`,
      [trackId, userId]
    ),
  ]);

  const result = { up: 0, down: 0, userRating: null };
  for (const row of counts.rows) result[row.rating] = parseInt(row.count, 10);
  if (existing.rows.length) result.userRating = existing.rows[0].rating;

  res.json(result);
});

// POST /api/rate  { trackId, rating }
// User identity is derived server-side — no userId needed from client
app.post("/api/rate", async (req, res) => {
  const { trackId, rating } = req.body;
  if (!trackId || !["up", "down"].includes(rating)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const userId = getUserId(req);

  // Upsert — allows the user to change their vote
  await pool.query(
    `INSERT INTO ratings (id, track_id, user_id, rating)
     VALUES (gen_random_uuid(), $1, $2, $3)
     ON CONFLICT ON CONSTRAINT ratings_track_user_unique
     DO UPDATE SET rating = EXCLUDED.rating`,
    [trackId, userId, rating]
  );

  const counts = await pool.query(
    `SELECT rating, COUNT(*) AS count FROM ratings WHERE track_id = $1 GROUP BY rating`,
    [trackId]
  );
  const result = { up: 0, down: 0, userRating: rating };
  for (const row of counts.rows) result[row.rating] = parseInt(row.count, 10);

  res.json(result);
});

if (require.main === module) {
  fetchMetadata();
  setInterval(fetchMetadata, 10_000);
  app.listen(PORT, () => {
    console.log(`Radio Calico running at http://localhost:${PORT}`);
  });
}

module.exports = { app, pool };
