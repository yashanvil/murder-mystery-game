const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok && options.expect !== res.status) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "SUPABASE_URL and SUPABASE_ANON_KEY not configured" });
  }

  const { action } = req.body || {};

  try {
    // ===== CREATE ROOM =====
    if (action === "create") {
      const { scenario, difficulty, mode } = req.body;
      if (!scenario) return res.status(400).json({ error: "No scenario" });

      let code;
      for (let i = 0; i < 5; i++) {
        code = generateCode();
        const existing = await supabase(`rooms?code=eq.${code}&select=code`);
        if (!existing || existing.length === 0) break;
      }

      await supabase("rooms", {
        method: "POST",
        body: { code, scenario, difficulty, mode, created_at: new Date().toISOString() },
      });

      return res.status(200).json({ code });
    }

    // ===== JOIN ROOM =====
    if (action === "join") {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "No code" });

      const rows = await supabase(`rooms?code=eq.${code.toUpperCase()}&select=*&order=created_at.desc&limit=1`);
      if (!rows || rows.length === 0) return res.status(404).json({ error: "Room not found" });

      const room = rows[0];
      return res.status(200).json({ scenario: room.scenario, difficulty: room.difficulty, mode: room.mode });
    }

    // ===== GET LEADERBOARD =====
    if (action === "leaderboard_get") {
      const rows = await supabase("leaderboard?select=*&order=won.desc");
      const lb = {};
      (rows || []).forEach((r) => {
        lb[r.player_name] = { played: r.played, won: r.won, streak: r.streak, bestStreak: r.best_streak };
      });
      return res.status(200).json(lb);
    }

    // ===== UPDATE LEADERBOARD =====
    if (action === "leaderboard_update") {
      const { players, winners } = req.body;
      if (!players || !Array.isArray(players)) return res.status(400).json({ error: "No players" });

      for (const p of players) {
        const isWinner = winners && winners.includes(p);

        // Check if player exists
        const existing = await supabase(`leaderboard?player_name=eq.${encodeURIComponent(p)}&select=*`);

        if (existing && existing.length > 0) {
          const row = existing[0];
          const newStreak = isWinner ? row.streak + 1 : 0;
          await supabase(`leaderboard?player_name=eq.${encodeURIComponent(p)}`, {
            method: "PATCH",
            body: {
              played: row.played + 1,
              won: isWinner ? row.won + 1 : row.won,
              streak: newStreak,
              best_streak: Math.max(row.best_streak, newStreak),
            },
          });
        } else {
          await supabase("leaderboard", {
            method: "POST",
            body: {
              player_name: p,
              played: 1,
              won: isWinner ? 1 : 0,
              streak: isWinner ? 1 : 0,
              best_streak: isWinner ? 1 : 0,
            },
          });
        }
      }

      // Return updated leaderboard
      const rows = await supabase("leaderboard?select=*&order=won.desc");
      const lb = {};
      (rows || []).forEach((r) => {
        lb[r.player_name] = { played: r.played, won: r.won, streak: r.streak, bestStreak: r.best_streak };
      });
      return res.status(200).json(lb);
    }

    // ===== RESET LEADERBOARD =====
    if (action === "leaderboard_reset") {
      await supabase("leaderboard?player_name=neq.", { method: "DELETE", headers: {} });
      return res.status(200).json({});
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Room error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
