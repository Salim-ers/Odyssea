/* Lire une réponse sans jamais échouer sur son analyse.

   `res.json()` lève quand le corps est vide ou n'est pas du JSON — ce qui
   arrive précisément quand quelque chose s'est mal passé côté serveur : une
   fonction interrompue, une page d'erreur de l'hébergeur, un délai dépassé.
   L'utilisateur voyait alors « unexpected end of data », qui ne dit rien de
   la cause et ressemble à un bogue du navigateur.

   Ici, on lit le texte d'abord. S'il est du JSON, on le rend ; sinon on
   fabrique un message qui nomme ce qui s'est passé. */

export async function readJson(res) {
  const text = await res.text().catch(() => "");

  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      /* Une page d'erreur HTML : on n'en montre pas le balisage. */
    }
  }

  if (res.ok) {
    return { error: "Réponse illisible du serveur." };
  }
  if (res.status === 504 || res.status === 408) {
    return { error: "Le serveur a mis trop de temps à répondre. Réessayez dans un instant." };
  }
  if (res.status >= 500) {
    return {
      error: `Le serveur a rencontré une erreur (${res.status}). Réessayez ; si cela persiste, le journal de déploiement en dira la cause.`,
    };
  }
  return { error: `Requête refusée (${res.status}).` };
}

/** Un appel qui renvoie toujours un objet, jamais une exception d'analyse. */
export async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, data: await readJson(res) };
}
