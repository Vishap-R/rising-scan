export const prerender = false;

export async function POST({ request }) {
  const incomingData = await request.json();
  
  // Le manga envoyé depuis admin.astro (on extrait mangaData si présent)
  const newManga = incomingData.mangaData || incomingData;

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER;
  const REPO_NAME = process.env.REPO_NAME;
  const FILE_PATH = "src/data/mangas.json";

  try {
    // 1. Récupérer le fichier actuel sur GitHub pour avoir le contenu et le SHA
    const getFile = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    let currentMangas = [];
    let sha = null;

    if (getFile.ok) {
      const fileData = await getFile.json();
      sha = fileData.sha;
      // Décoder le contenu Base64 existant
      const content = decodeURIComponent(escape(atob(fileData.content)));
      const parsed = JSON.parse(content);
      
      // On s'assure que c'est un tableau
      currentMangas = Array.isArray(parsed) ? parsed : [parsed];
    }

    // 2. Fusionner les données : Ajouter le nouveau ou mettre à jour s'il existe
    const index = currentMangas.findIndex(m => m.id === newManga.id);
    if (index !== -1) {
      currentMangas[index] = newManga; // Mise à jour si l'ID existe déjà
    } else {
      currentMangas.push(newManga); // Ajout à la liste
    }

    // 3. Préparer le nouveau contenu en JSON propre
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentMangas, null, 2))));

    // 4. Envoyer la mise à jour à GitHub
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Mise à jour : ${newManga.title}`,
        content: newContent,
        sha: sha // Obligatoire pour mettre à jour un fichier existant
      })
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const errorDetail = await response.json();
      return new Response(JSON.stringify({ error: "GitHub Error", detail: errorDetail }), { status: 500 });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
