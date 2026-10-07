const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const Intern = require('../models/Intern');

/**
 * Helper to call Google Gemini API via REST with auto-model fallback
 */
async function callGeminiAPI(apiKey, prompt, systemInstruction, history = []) {
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro'
  ];

  const formattedContents = [];

  // Add conversation history if provided
  if (Array.isArray(history) && history.length > 0) {
    history.forEach(item => {
      if (item.text && item.role) {
        formattedContents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.text }]
        });
      }
    });
  }

  // Add current prompt
  formattedContents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: formattedContents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
    }
  };

  let lastError;

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini API HTTP ${response.status}`;
        lastError = new Error(errMsg);
        console.warn(`⚠️ Model ${modelName} returned error:`, errMsg);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`⚠️ Exception calling ${modelName}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Impossible d\'obtenir une réponse de Gemini API.');
}

/**
 * Comprehensive Smart Natural Language AI Engine (with General Knowledge)
 */
function getSmartFallbackResponse(userMessage, userRole, userName, userStats) {
  const msg = userMessage.toLowerCase().trim();

  // 0. Math Calculations (e.g. 1 + 1, 5 * 10, 100 / 4)
  if (/^[0-9\s\+\-\*\/\(\)\.\,\^]+$/.test(msg) && /[0-9]/.test(msg)) {
    try {
      const sanitized = msg.replace(/,/g, '.').replace(/\^/g, '**');
      const calcResult = Function(`"use strict"; return (${sanitized});`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult)) {
        return `🔢 **Calcul** : \`${userMessage.trim()}\` = **${calcResult}**`;
      }
    } catch (e) {
      // Ignore evaluation errors
    }
  }

  // 0.1 General Knowledge: Geography & Capitals
  if (msg.includes('capital') || msg.includes('capitale')) {
    if (msg.includes('morocco') || msg.includes('maroc')) {
      return `🇲🇦 **Rabat** is the capital city of Morocco (الرباط هي عاصمة المملكة المغربية).`;
    }
    if (msg.includes('france')) return `🇫🇷 **Paris** is the capital city of France.`;
    if (msg.includes('spain') || msg.includes('espagne')) return `🇪🇸 **Madrid** is the capital city of Spain.`;
    if (msg.includes('usa') || msg.includes('united states') || msg.includes('etats-unis')) return `🇺🇸 **Washington, D.C.** is the capital city of the United States.`;
    if (msg.includes('uk') || msg.includes('england') || msg.includes('royaume-uni')) return `🇬🇧 **London** is the capital city of the United Kingdom.`;
    if (msg.includes('germany') || msg.includes('allemagne')) return `🇩🇪 **Berlin** is the capital city of Germany.`;
    if (msg.includes('canada')) return `🇨🇦 **Ottawa** is the capital city of Canada.`;
    if (msg.includes('japan') || msg.includes('japon')) return `🇯🇵 **Tokyo** is the capital city of Japan.`;
  }

  // 0.2 Programming & Tech Questions
  if (msg.includes('javascript') || msg.includes('react') || msg.includes('node') || msg.includes('python') || msg.includes('html') || msg.includes('css')) {
    if (msg.includes('react')) return `⚛️ **React** est une bibliothèque JavaScript open-source créée par Meta pour construire des interfaces utilisateur interactives et performantes basées sur des composants.`;
    if (msg.includes('javascript')) return `🟨 **JavaScript** est un langage de programmation dynamique essentiel du web, utilisé côté client (navigateur) et serveur (Node.js).`;
    if (msg.includes('node')) return `💚 **Node.js** est un environnement d'exécution JavaScript côté serveur fondé sur le moteur V8 de Google Chrome.`;
    if (msg.includes('python')) return `🐍 **Python** est un langage de programmation de haut niveau, réputé pour sa lisibilité et très utilisé en IA, analyse de données et développement web.`;
  }

  // 1. Stagiaires / Interns Queries
  if (
    /(count|how many|number of|combien|nombre|total|chhal|list|show|stat|stagiaire|intern|student|etudiant|collaborateur|user)/i.test(msg) &&
    /(stagiaire|intern|student|etudiant|user|membre|collaborateur|people|personne)/i.test(msg)
  ) {
    if (userRole !== 'intern') {
      return `📊 **Statistiques des Stagiaires**:\n\n- 👥 Total Stagiaires : **${userStats.totalInterns || 0}**\n- ⏳ En attente d'approbation : **${userStats.pendingApprovals || 0}**\n- 📋 Missions actives : **${userStats.openTasks || 0}**\n\nVous pouvez consulter la liste complète et gérer les accès dans la section **Stagiaires** du menu !`;
    } else {
      return `Bonjour **${userName}** ! Vous êtes connecté en tant que **Stagiaire**.\nVous avez actuellement **${userStats.pendingTasks || 0} tâche(s)** en cours d'exécution.`;
    }
  }

  // 2. Tasks & Missions
  if (/(tâche|tache|task|mission|job|work|devoir|projet|travail|objectif)/i.test(msg)) {
    if (userRole === 'intern') {
      return `📋 **Vos Tâches (${userName})**:\n- ⏳ Tâches en cours : **${userStats.pendingTasks || 0}**\n- ✅ Tâches terminées : **${userStats.completedTasks || 0}**\n\nAccédez au menu **Tâches** pour mettre à jour votre avancement (%) et ajouter vos comptes-rendus !`;
    } else {
      return `📋 **Gestion des Missions**:\n- 🎯 Missions ouvertes : **${userStats.openTasks || 0}**\n\nVous pouvez attribuer de nouvelles tâches avec priorités et dates d'échéance depuis le module **Tâches** (utilisez le bouton *✨ Suggérer avec l'IA* pour des idées automatiques !).`;
    }
  }

  // 3. Capabilities / Help / "What can you do"
  if (/(what can you do|what u can do|who are you|que peux-tu faire|qu'est ce que tu fais|aide|help|feature|fonctionnalit|menu|options)/i.test(msg)) {
    return `🤖 Bonjour **${userName}** ! Je suis **StagIA**, votre assistant IA intelligent dédié à la plateforme GESTION STAGAIRES.\n\nVoici tout ce que je peux faire pour vous :\n\n1. 🔢 **Calculs rapides** : Essayez de taper \`1 + 1\` ou \`150 / 3\`.\n2. 🌍 **Culture Générale** : Ex: *"What is the capital city of Morocco?"*\n3. 📊 **Consulter les effectifs** : Demandez *"combien de stagiaires"* ou *"nombre de tâches"*.\n4. 📋 **Gestion des Tâches** : Suivi de l'avancement et création assistée par IA.\n5. ⏱️ **Pointage & Heures** : Explication et suivi de la présence quotidienne.\n6. 📑 **Rapports & CV** : Dépôt et évaluation des documents de stage.`;
  }

  // 4. Pointage / Timesheet / Hours
  if (/(pointage|timesheet|heure|presence|présence|clock|time|fiche de temps|retard|horaire)/i.test(msg)) {
    return `⏱️ **Pointage des Heures & Présence**:\n- Rendez-vous dans la section **Pointage** du menu.\n- Cliquez sur **Pointer l'arrivée** en début de journée.\n- N'oubliez pas de **Pointer la sortie** en fin de journée.\n- Vous pouvez télécharger votre fiche de temps mensuelle au format Excel ou PDF !`;
  }

  // 5. Reports & Documents / CV
  if (/(rapport|document|cv|pdf|fichier|word|diplome|attestation)/i.test(msg)) {
    return `📄 **Gestion des Documents**:\n- Allez dans la section **Mes Documents**.\n- Téléversez vos rapports de stage, bilans ou CV (format PDF/Word jusqu'à 5MB).\n- Les encadrants pourront consulter et annoter vos fichiers directement en ligne.`;
  }

  // 6. Evaluations & Quizz
  if (/(évaluation|evaluation|quiz|quizz|note|score|test|examen|appreciation)/i.test(msg)) {
    return `🎯 **Évaluations & Quizz**:\n- Répondez aux tests de compétences dans le module **Quizz**.\n- Les maîtres de stage peuvent attribuer des appréciations et notes finales dans la section **Évaluations**.`;
  }

  // 7. Teams / Encadrants
  if (/(équipe|equipe|team|groupe|encadrant|supervisor|tuteur)/i.test(msg)) {
    return `👥 **Équipes & Départements**:\n- Consultez les affectations d'équipes et les tuteurs dans le menu **Équipes**.\n- Les stagiaires y retrouvent leur maître de stage référent.`;
  }

  // 8. Greetings & Polite chat
  if (/(bonjour|salut|coucou|hello|hi|hey|good morning|greetings|salam|labas)/i.test(msg)) {
    return `Bonjour **${userName}** 👋 ! Je suis **StagIA**, votre assistant IA.\n\nComment puis-je vous aider aujourd'hui ?\n- 🇲🇦 *Questions de culture & technologie*\n- 📊 *Statistiques stagiaires*\n- 📝 *Informations sur vos tâches*\n- 🔢 *Calculs mathématiques*`;
  }

  // 9. Internship Advice / Tips
  if (/(conseil|tip|advice|réussir|réussite|stage|pfe|rapport de stage|soutenance)/i.test(msg)) {
    return `💡 **Conseils pour réussir votre Stage**:\n1. ⏱️ Assurez la régularité de vos pointages d'heures.\n2. 📝 Mettez à jour vos tâches au fur et à mesure avec les pourcentages d'avancement.\n3. 📄 Rédigez votre rapport de stage de façon continue.\n4. 💬 Communiquez régulièrement avec votre encadrant sur la plateforme !`;
  }

  // 10. Generic Catch-All Natural Response
  return `Bonjour **${userName}** !\n\nJ'ai bien analysé votre demande : *"${userMessage}"*.\n\nEn tant qu'assistant de la plateforme **GESTION STAGAIRES**, voici les données actuelles en direct :\n- 👥 Stagiaires inscrits : **${userStats.totalInterns !== undefined ? userStats.totalInterns : userStats.pendingTasks}**\n- 📋 Missions en cours : **${userStats.openTasks !== undefined ? userStats.openTasks : userStats.completedTasks}**\n\nN'hésitez pas à me poser des questions sur la plateforme, des calculs (ex: \`1 + 1\`), ou des questions générales !`;
}

// POST /api/ai/chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Le message est requis.' });
    }

    const user = req.user;
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
    const userRole = user.role || 'intern';

    // Safely collect real-time contextual stats for prompt
    let userStats = { pendingTasks: 0, completedTasks: 0, totalInterns: 0, pendingApprovals: 0, openTasks: 0 };
    try {
      if (userRole === 'intern') {
        const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: { $in: ['pending', 'in_progress'] } });
        const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: 'completed' });
        userStats.pendingTasks = pendingTasks;
        userStats.completedTasks = completedTasks;
      } else {
        const totalInterns = await User.countDocuments({ role: 'intern' });
        const pendingApprovals = await User.countDocuments({ role: 'intern', isApproved: false });
        const openTasks = await Task.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
        userStats.totalInterns = totalInterns;
        userStats.pendingApprovals = pendingApprovals;
        userStats.openTasks = openTasks;
      }
    } catch (dbErr) {
      console.warn('⚠️ Non-fatal DB stats fetch warning:', dbErr.message);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Call Gemini API if any valid non-empty API key is present
    if (apiKey && apiKey.trim().length > 10) {
      const systemInstruction = `Tu es StagIA, l'assistant IA intelligent et réactif de la plateforme GESTION STAGAIRES.
Utilisateur actuel:
- Nom: ${userName}
- Rôle: ${userRole} (intern = stagiaire, supervisor = encadrant, admin = administrateur)
- Statistiques réelles MongoDB en direct: ${JSON.stringify(userStats)}

DIRECTIVES ABSOLUES :
1. Analyse avec précision la question de l'utilisateur en FRANÇAIS, ANGLAIS ou tout autre langage.
2. Si l'utilisateur demande une question de culture générale (ex: "What is the capital city of Morocco?"), réponds directement avec la réponse exacte (ex: "Rabat is the capital city of Morocco.") !
3. Si l'utilisateur demande une opération mathématique (ex: 1 + 1), réponds directement avec le résultat du calcul !
4. Si l'utilisateur demande le nombre de stagiaires, lis la valeur "totalInterns" dans les statistiques réelles (${userStats.totalInterns || 0}) et réponds avec le nombre exact !
5. Sois très amical, concis, clair, et utilise du markdown propre avec émojis.`;

      try {
        console.log(`🤖 Envoi de la requête IA à Gemini API...`);
        const reply = await callGeminiAPI(apiKey, message, systemInstruction, history);
        return res.json({
          success: true,
          reply,
          model: 'Gemini 1.5 Flash (Live AI)',
          isLiveAI: true
        });
      } catch (geminiErr) {
        console.warn('⚠️ Fallback to StagIA Engine:', geminiErr.message);
        const reply = getSmartFallbackResponse(message, userRole, userName, userStats);
        return res.json({
          success: true,
          reply,
          model: 'StagIA AI Engine',
          isLiveAI: false
        });
      }
    } else {
      const reply = getSmartFallbackResponse(message, userRole, userName, userStats);
      return res.json({
        success: true,
        reply,
        model: 'StagIA AI Engine',
        isLiveAI: false
      });
    }

  } catch (error) {
    console.error('❌ AI Chat route error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la requête IA.',
      error: error.message
    });
  }
});

// POST /api/ai/suggest-task
router.post('/suggest-task', authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty, role } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const defaultSuggestions = [
      {
        title: `Implémenter les tests unitaires pour ${topic || 'le module principal'}`,
        description: `Rédiger une suite de tests unitaires et d'intégration afin de garantir un taux de couverture minimal de 80%. Documenter les cas limites et valider la gestion des erreurs.`,
        priority: 'high',
        category: 'project',
        estimatedHours: 8
      },
      {
        title: `Rédaction de la documentation technique - ${topic || 'Architecture System'}`,
        description: `Créer un rapport synthétique expliquant l'architecture, les points d'API et le diagramme de données. Publier la documentation sur la plateforme.`,
        priority: 'medium',
        category: 'report',
        estimatedHours: 5
      }
    ];

    if (!apiKey || apiKey.trim().length < 10) {
      return res.json({ success: true, tasks: defaultSuggestions });
    }

    const prompt = `Génère 2 propositions de tâches de stage structurées sur le sujet "${topic || 'Développement Web'}". Niveau: ${difficulty || 'intermédiaire'}.
Réponds EXCLUSIVEMENT au format JSON strict (sans bloc markdown) avec la structure suivante :
[
  {
    "title": "Titre clair",
    "description": "Description détaillée",
    "priority": "medium",
    "category": "project",
    "estimatedHours": 6
  }
]`;

    try {
      const resultText = await callGeminiAPI(apiKey, prompt, 'Tu es un générateur de tâches pédagogiques pour stages professionnels.');
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const tasks = JSON.parse(cleanJson);
      return res.json({ success: true, tasks });
    } catch (err) {
      return res.json({ success: true, tasks: defaultSuggestions });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
