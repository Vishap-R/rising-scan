export const prerender = false; // Dit à Astro de ne pas essayer de générer cette page à l'avance
export async function POST({ request }) {
  const data = await request.json();
  
  // Ces variables seront configurées dans l'interface de Vercel
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER;
  const REPO_NAME = process.env.REPO_NAME;
  const FILE_PATH = "src/data/mangas.json";

  try {
    // Récupérer le SHA actuel
    const getFile = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const fileData = await getFile.json();

    // Envoyer la mise à jour
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Mise à jour via Online Admin Space",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        sha: fileData.sha
      })
    });

    if (response.ok) return new Response(JSON.stringify({ success: true }), { status: 200 });
    return new Response(JSON.stringify({ error: "GitHub Error" }), { status: 500 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

}
