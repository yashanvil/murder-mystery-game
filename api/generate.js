export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const { mode, difficulty, customLocation, customCharacters, customTwist } = req.body || {};

  const modes = {
    cooperative: "Players work together to solve the mystery.",
    competitive: "Players race to accuse the murderer first.",
    deceptive: "One player secretly knows the killer and must misdirect the others.",
  };

  const diffSettings = {
    elementary: {
      suspects: 4, clues: 5,
      guidance: "Make the clues relatively straightforward. At least 2 clues should clearly point toward the murderer when considered together. Include 1 red herring."
    },
    afoot: {
      suspects: 5, clues: 6,
      guidance: "Make the clues ambiguous. Multiple suspects should seem equally plausible. Include 2 red herrings that point to innocent suspects."
    },
    diabolical: {
      suspects: 6, clues: 7,
      guidance: "Make this extremely challenging. Include 3 deliberate red herrings. Some clues should actively mislead toward innocent suspects. The real killer should only become apparent when ALL clues are considered together. Add contradictory witness statements."
    }
  };

  const diff = diffSettings[difficulty] || diffSettings.afoot;

  // Build custom seeding instructions if provided
  const customSeedLines = [];
  if (customLocation) customSeedLines.push(`- Setting MUST be: ${customLocation}`);
  if (customCharacters && customCharacters.length > 0) {
    const charList = customCharacters.map(c => c.role ? `${c.name} (${c.role})` : c.name).join(", ");
    customSeedLines.push(`- Seed these real characters into your suspects list (you may add more to reach the required count): ${charList}`);
    customSeedLines.push(`- Keep their names exactly as given. Invent their descriptions, backstories and motives.`);
  }
  if (customTwist) customSeedLines.push(`- Incorporate this theme or twist: ${customTwist}`);
  const customBlock = customSeedLines.length > 0
    ? `\nCustom requirements (MUST follow):\n${customSeedLines.join("\n")}\n`
    : "";

  const prompt = `Generate a unique murder mystery scenario for a party game. Return ONLY valid JSON — no markdown fences, no preamble, no explanation.${customBlock}

Schema:
{
  "title": "Short evocative case name",
  "setting": "One sentence vivid setting (e.g. an abandoned space station, a jazz club in 1920s Harlem, a tech billionaire's yacht, a travelling circus in 1890s Vienna)",
  "victim": "Full name and brief description of the victim",
  "discovery": "Two sentences describing how and when the body was found and the initial scene",
  "suspects": [
    { "name": "Full name", "role": "Their role or relation", "description": "One sentence personality or motive hint" }
  ],
  "clues": [
    "Clue text — physical evidence, witness statement, or timeline detail"
  ],
  "murderer": "Exact name of the murderer (must match one suspect name exactly)",
  "motive": "2-3 sentences explaining motive and how it happened"
}

Rules:
- Exactly ${diff.suspects} suspects, exactly ${diff.clues} clues
- ${diff.guidance}
- ${customLocation ? "Use the provided setting exactly as specified" : "Setting should be unusual, vivid, and interesting — avoid cliches like an English manor or a dinner party"}
- Make it fun, dramatic, and slightly theatrical — channel the atmosphere of a Sherlock Holmes mystery
- Game mode: ${modes[mode] || modes.cooperative}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res.status(502).json({ error: "AI generation failed" });
    }

    const data = await response.json();
    // Gemini 2.5 Flash may have "thinking" parts before the text part — find the last text part
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.filter(p => p.text && !p.thought).pop() || parts.pop() || {};
    const text = textPart.text || "";
    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: "AI returned empty response" });
    }
    const clean = text.replace(/```json|```/g, "").trim();
    const scenario = JSON.parse(clean);

    if (!scenario.title || !scenario.suspects || !scenario.clues || !scenario.murderer) {
      return res.status(502).json({ error: "Invalid scenario generated" });
    }

    return res.status(200).json(scenario);
  } catch (err) {
    console.error("Generate error:", err.message, err.stack?.slice(0, 200));
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
