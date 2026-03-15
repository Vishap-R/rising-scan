export const POST = async ({ request }) => {
  try {
    const incomingData = await request.json();
    
    // 1. Configuration via les variables d'environnement
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "Vishap-R";
    const REPO_NAME = process.env.REPO_NAME || "rising-scan";
    const FILE_PATH = "src/data/mangas.json";

    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: "Configuration GITHUB_TOKEN manquante sur le serveur." }), { status: 500 });
    }

    // 2. Récupération du fichier actuel sur GitHub pour obtenir le SHA (nécessaire pour la mise à jour)
    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!getRes.ok) {
      throw new Error(`Erreur GitHub (Lecture): ${getRes.status} ${getRes.statusText}`);
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;
    
    // Décodage du contenu Base64 en JSON (Gestion de l'UTF-8 pour les accents)
    let content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
    
    if (!Array.isArray(content)) content = [];

    let commitMessage = "";

    // 3. Traitement des différentes actions
    if (incomingData.action === "ADD_CHAPTER") {
      // AJOUT D'UN CHAPITRE
      const mangaIndex = content.findIndex(m => m.id === incomingData.mangaId);
      
      if (mangaIndex !== -1) {
        if (!content[mangaIndex].chapters) content[mangaIndex].chapters = [];
        
        // Ajout du nouveau chapitre
        content[mangaIndex].chapters.push(incomingData.chapter);
        
        // Tri automatique des chapitres par numéro (du plus petit au plus grand)
        content[mangaIndex].chapters.sort((a, b) => {
          return parseFloat(a.number) - parseFloat(b.number);
        });
        
        commitMessage = `Admin: Ajout Chapitre ${incomingData.chapter.number} à ${incomingData.mangaId}`;
      } else {
        throw new Error("Manga cible introuvable dans le catalogue.");
      }

    } else if (incomingData.action === "DELETE") {
      // SUPPRESSION D'UN MANGA
      content = content.filter(m => m.id !== incomingData.id);
      commitMessage = `Admin: Suppression de l'œuvre ${incomingData.id}`;

    } else if (incomingData.action === "CREATE_MANGA") {
      // CRÉATION OU MISE À JOUR D'UN MANGA
      const mangaIndex = content.findIndex(m => m.id === incomingData.id);
      
      if (mangaIndex !== -1) {
        // Mise à jour si l'ID existe déjà
        content[mangaIndex] = { 
          ...content[mangaIndex], 
          ...incomingData, 
          chapters: content[mangaIndex].chapters || [] 
        };
        commitMessage = `Admin: Mise à jour des infos de ${incomingData.title}`;
      } else {
        // Création si c'est un nouvel ID
        content.push({
          ...incomingData,
          chapters: []
        });
        commitMessage = `Admin: Création de la nouvelle œuvre ${incomingData.title}`;
      }
    }

    // 4. Encodage du nouveau contenu en Base64 (UTF-8 safe)
    const updatedJsonString = JSON.stringify(content, null, 2);
    const updatedBase64 = btoa(unescape(encodeURIComponent(updatedJsonString)));

    // 5. Envoi de la mise à jour vers GitHub
    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        message: commitMessage,
        content: updatedBase64,
        sha: sha
      })
    });

    if (!putRes.ok) {
      const errorDetail = await putRes.json();
      throw new Error(`Erreur GitHub (Écriture): ${errorDetail.message}`);
    }

    return new Response(JSON.stringify({ message: "Mise à jour réussie sur GitHub" }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("API Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
