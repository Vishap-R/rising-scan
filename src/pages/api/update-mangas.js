import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const incomingData = await request.json();
    
    // Configuration GitHub (Remplace par tes vraies infos si nécessaire)
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "Vishap-R";
    const REPO_NAME = "rising-scan";
    const FILE_PATH = "src/data/mangas.json";

    // 1. Récupérer le fichier actuel et son SHA (nécessaire pour modifier sur GitHub)
    const getFileRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
      }
    );

    if (!getFileRes.ok) {
      return new Response(JSON.stringify({ error: "Impossible de lire le fichier JSON sur GitHub" }), { status: 500 });
    }

    const fileData = await getFileRes.json();
    const sha = fileData.sha;
    // Décodage du contenu Base64 en JSON utilisable
    let currentContent = JSON.parse(atob(fileData.content));

    // S'assurer que c'est un tableau
    if (!Array.isArray(currentContent)) {
      currentContent = [];
    }

    let updatedContent;
    let commitMessage;

    // 2. LOGIQUE DE MISE À JOUR OU SUPPRESSION
    if (incomingData.action === "DELETE") {
      // Action : SUPPRIMER
      updatedContent = currentContent.filter((m: any) => m.id !== incomingData.id);
      commitMessage = `Admin: Suppression du manga ${incomingData.id}`;
    } else {
      // Action : AJOUTER (ou mettre à jour si l'ID existe déjà)
      const index = currentContent.findIndex((m: any) => m.id === incomingData.id);
      
      if (index !== -1) {
        // Si le manga existe déjà, on met à jour ses infos sans toucher aux chapitres existants
        currentContent[index] = { 
          ...currentContent[index], 
          ...incomingData,
          chapters: currentContent[index].chapters || [] 
        };
      } else {
        // Nouveau manga
        currentContent.push(incomingData);
      }
      updatedContent = currentContent;
      commitMessage = `Admin: Mise à jour/Ajout du manga ${incomingData.title}`;
    }

    // 3. Renvoyer le fichier mis à jour vers GitHub
    const putFileRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(updatedContent, null, 2)))),
          sha: sha,
        }),
      }
    );

    if (!putFileRes.ok) {
      const errorText = await putFileRes.text();
      return new Response(JSON.stringify({ error: "Échec de l'écriture sur GitHub", details: errorText }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Succès !" }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
