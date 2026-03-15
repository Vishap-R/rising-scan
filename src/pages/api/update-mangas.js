export const POST = async ({ request }) => {
  try {
    const incomingData = await request.json();
    
    // Configuration GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "Vishap-R";
    const REPO_NAME = "rising-scan";
    const FILE_PATH = "src/data/mangas.json";

    // 1. Récupérer le fichier actuel sur GitHub
    const getFileRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
      }
    );

    if (!getFileRes.ok) {
      return new Response(JSON.stringify({ error: "Impossible de lire le JSON sur GitHub" }), { status: 500 });
    }

    const fileData = await getFileRes.json();
    const sha = fileData.sha;
    
    // Décodage Base64 vers JSON (gestion des caractères spéciaux)
    let currentContent = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

    if (!Array.isArray(currentContent)) {
      currentContent = [];
    }

    let updatedContent;
    let commitMessage;

    // 2. LOGIQUE : SUPPRESSION OU AJOUT
    if (incomingData.action === "DELETE") {
      updatedContent = currentContent.filter(m => m.id !== incomingData.id);
      commitMessage = `Admin: Suppression du manga ${incomingData.id}`;
    } else {
      const index = currentContent.findIndex(m => m.id === incomingData.id);
      
      if (index !== -1) {
        // Mise à jour sans écraser les chapitres
        currentContent[index] = { 
          ...currentContent[index], 
          ...incomingData,
          chapters: currentContent[index].chapters || [] 
        };
      } else {
        // Nouvel ajout
        currentContent.push({
            ...incomingData,
            chapters: incomingData.chapters || []
        });
      }
      updatedContent = currentContent;
      commitMessage = `Admin: Mise à jour/Ajout de ${incomingData.title}`;
    }

    // 3. Envoi vers GitHub (Encodage propre)
    const newContentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(updatedContent, null, 2))));

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
          content: newContentBase64,
          sha: sha,
        }),
      }
    );

    if (!putFileRes.ok) {
      return new Response(JSON.stringify({ error: "Erreur d'écriture GitHub" }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Succès !" }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
