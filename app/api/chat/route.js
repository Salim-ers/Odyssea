/* Route Handler — relais vers l'API Anthropic.
   La clé reste côté serveur : elle n'atteint jamais le navigateur.
   Variable d'environnement : ANTHROPIC_API_KEY */

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ error: "ANTHROPIC_API_KEY absente des variables d'environnement" }, { status: 500 });
  }
  try {
    const { system, messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages manquants" }, { status: 400 });
    }
    /* Bornes : on limite ce que le client peut demander. */
    const safe = messages.slice(-12).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content || "").slice(0, 4000),
    }));

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ODYSSEA_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
        system: String(system || "").slice(0, 12000),
        messages: safe,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return Response.json({ error: data?.error?.message || "Erreur du fournisseur" }, { status: upstream.status });
    }
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "Relais indisponible : " + e.message }, { status: 502 });
  }
}
