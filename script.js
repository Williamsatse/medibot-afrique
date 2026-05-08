/* ============================================================
   MediBot Afrique — script.js
   Projet : Concours IA Sino-Africain 2026
   Auteur : [Votre Nom] — Technicien Supérieur en Bâtiment
   Description : Logique IA, gestion du chat et interactions
   ============================================================ */

/* ── ÉTAT GLOBAL ── */
let lang    = 'fr';
let channel = 'whatsapp';
let hist    = [];
let count   = 0;
let busy    = false;

/* ── SCÉNARIOS DÉMO ── */
const DEMOS = {
  paludisme: {
    fr:     "J'ai de la fièvre et des frissons depuis 2 jours, j'ai aussi très mal à la tête.",
    dioula: "N bɛ sumaya la ani n bɛ wili-wili. O tuma ye tile fila.",
    baoule: "Kule n'goa ni wili-wili. Awlɔ fɛɛn.",
    wolof:  "Am naa fiiwre ak yàwwu. Ñaar bés la."
  },
  urgence: {
    fr:     "J'ai une douleur très forte dans la poitrine et j'ai du mal à respirer depuis ce matin.",
    dioula: "N dusu bɛ n dimi kosɛbɛ ani n tɛ se ka muɲu.",
    baoule: "M'poto n'goa kosɛbɛ ni ngue kpata.",
    wolof:  "Dëkk bees boo réy ak yàwwu ci jant bi."
  },
  enfant: {
    fr:     "Mon enfant de 3 ans a 39 degrés de fièvre depuis hier et vomit beaucoup.",
    dioula: "N denmisɛn ye san saba. A ka sumaya ye 39. A bɛ furakoli.",
    baoule: "Min bi ye mɔ sɔ anɔ — kule 39 ni furakoli.",
    wolof:  "Doom am 3 an. Am na fiiwre 39 ak wopp."
  },
  rhume: {
    fr:     "J'ai un petit rhume, le nez bouché et un peu de fatigue depuis hier soir, pas de fièvre.",
    dioula: "N bɛ finɲini kɔnɔ, n tɛ se ka muɲu. Sumaya tɛ.",
    baoule: "Trou finɲini, n nɛ kɔɔ. Kule tɛ.",
    wolof:  "Am naa nez bouché ak ñuul sax. Fiiwre amul."
  }
};

/* ── MESSAGES DE BIENVENUE ── */
const WELCOME = {
  fr:     `Bonjour ! 👋 Je suis **MediBot Afrique**, votre assistant santé disponible 24h/24.\n\nJe vais vous aider à comprendre vos symptômes et vous orienter vers le soin adapté — gratuitement, en toute confidentialité.\n\n🩺 **Qu'est-ce qui ne va pas aujourd'hui ?**`,
  dioula: `I ni ce ! 👋 N'tɔgɔ MediBot Afrique ye. N bɛ se k'i dɛmɛ i ka bana kɔnɔ.\n\n🩺 **Mun bɛ i dimi sisan ?**`,
  baoule: `Akwaba ! 👋 MediBot Afrique n'goa. N bɛ se k'i kpata i ka bana.\n\n🩺 **Ngue n'man tie ?**`,
  wolof:  `Na nga def ! 👋 MediBot Afrique la tudd. Dinaa la ndimbal ci sant yi.\n\n🩺 **Loo xam wone ko dafa dem ?**`
};

/* ── RÉPONSES RAPIDES ── */
const QRS = {
  fr:     ["🤒 Fièvre et frissons",  "🤢 Douleurs abdominales", "😮‍💨 Toux persistante",  "🤕 Maux de tête forts",  "👶 Symptômes chez mon enfant"],
  dioula: ["🤒 Sumaya",              "🤢 Kɔnɔ dimi",            "😮‍💨 Kɔsɛ",             "🤕 Kun dimi",            "👶 N denmisɛn bana"],
  baoule: ["🤒 Kule",                "🤢 Kɔnɔ n'goa",           "😮‍💨 Cɔsɛ",             "🤕 Kun n'goa",           "👶 Min bi bana"],
  wolof:  ["🤒 Fiiwre",              "🤢 Biir bu dëkk",          "😮‍💨 Wopp",             "🤕 Bopp bu dëkk",        "👶 Doom bi bana"]
};

/* ── RÉPONSES RAPIDES DE SUIVI ── */
const FOLLOW_UPS = {
  fr:     ["Depuis hier",    "Depuis 2-3 jours", "J'ai aussi de la fièvre", "Douleur intense (8/10)", "Symptômes chez un enfant"],
  dioula: ["Tile kelen",     "Tile 2-3",         "Sumaya fana",             "N bɛ dimi kosɛbɛ",      "N denmisɛn"],
  baoule: ["Awlɔ kɛɛn",     "Awlɔ fɛɛn",        "Kule fana",               "N'goa kosɛbɛ",          "Min bi"],
  wolof:  ["Benn bés",       "Ñaar bés",         "Fiiwre fii",              "Yàwwu bu réy",          "Doom bi"]
};

/* ── CONSTRUCTION DU PROMPT SYSTÈME ── */
function buildSystemPrompt() {
  const langNames = { fr: 'Français', dioula: 'Dioula', baoule: 'Baoulé', wolof: 'Wolof' };
  const channelDesc = {
    sms:       'SMS USSD (réponses TRÈS courtes < 160 caractères, langage ultra-simplifié)',
    whatsapp:  'WhatsApp (réponses modérées, structure claire, quelques emojis)',
    web:       'Application Web (réponses complètes et détaillées)'
  };

  return `Tu es MediBot Afrique, assistant de triage médical pour les populations africaines (Côte d'Ivoire prioritairement).

LANGUE : Réponds TOUJOURS en ${langNames[lang] || 'Français'}. Détecte automatiquement si l'utilisateur écrit dans une autre langue africaine et réponds dans cette langue.

RÔLE : Outil d'aide à l'ORIENTATION uniquement. Tu NE diagnostiques PAS. Tu guides vers le bon niveau de soin.

NIVEAUX DE TRIAGE :
🔴 URGENCE : difficulté respiratoire sévère, douleur thoracique intense, perte de conscience, convulsions, saignement abondant, fièvre > 40°C chez nourrisson → "Appelez le 185 immédiatement"
🟡 CONSULTATION : fièvre 38-40°C, diarrhée persistante > 48h, douleurs intenses, toux avec crachats, vomissements répétés → médecin sous 24-48h
🟢 AUTO-SOIN : symptômes légers gérables à domicile — rhume léger, petite coupure, fatigue sans fièvre

DÉMARCHE EN 5 ÉTAPES :
1. Accueille chaleureusement (max 2 phrases)
2. Pose 3 à 5 questions ciblées : durée des symptômes, intensité (1-10), température, âge, signes associés
3. Synthétise et détermine le niveau de triage
4. Donne l'orientation claire + conseils pratiques adaptés au contexte africain (SRO pour diarrhée, etc.)
5. Rappelle : "Je suis un outil d'orientation. Consultez un médecin pour tout doute."

CONTEXTE AFRICAIN : Pathologies fréquentes = paludisme, typhoïde, choléra, infections respiratoires, diarrhées. Tiens-en compte dans l'évaluation des symptômes.

CANAL : ${channelDesc[channel] || channelDesc.web}

IMPORTANT : À la fin de chaque réponse où tu identifies un niveau de triage, ajoute sur une nouvelle ligne : TRIAGE:URGENT ou TRIAGE:CONSULT ou TRIAGE:OK`;
}

/* ============================================================
   FONCTIONS UTILITAIRES
   ============================================================ */

/** Formate le Markdown basique en HTML */
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/** Échappe les caractères HTML */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ============================================================
   GESTION DES MESSAGES
   ============================================================ */

/** Ajoute un message du bot */
function addBot(text, type = 'normal') {
  const msgs = document.getElementById('msgs');
  const div  = document.createElement('div');
  div.className = 'msg bot';

  const bubbleCls = type === 'urgent' ? 'urgent'
                  : type === 'warn'   ? 'warn-b'
                  : type === 'ok'     ? 'ok-b'
                  : 'bot-b';

  div.innerHTML = `
    <div class="mavt bav">🤖</div>
    <div class="bubble ${bubbleCls}">${formatText(text)}</div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

/** Ajoute un message de l'utilisateur */
function addUser(text) {
  const msgs = document.getElementById('msgs');
  const div  = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="mavt">👤</div>
    <div class="bubble user-b">${escapeHtml(text)}</div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

/** Affiche l'indicateur de saisie */
function showTyping() {
  const msgs = document.getElementById('msgs');
  const div  = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typ';
  div.innerHTML = `
    <div class="mavt bav">🤖</div>
    <div class="typing-dots">
      <div class="td"></div>
      <div class="td"></div>
      <div class="td"></div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

/** Supprime l'indicateur de saisie */
function removeTyping() {
  const t = document.getElementById('typ');
  if (t) t.remove();
}

/** Affiche les réponses rapides */
function showQR(replies) {
  const qr = document.getElementById('qr');
  qr.innerHTML = '';
  replies.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'qrb';
    btn.textContent = r;
    btn.onclick = () => { sendText(r); qr.innerHTML = ''; };
    qr.appendChild(btn);
  });
}

/* ============================================================
   TRIAGE
   ============================================================ */

/** Met à jour l'indicateur de triage */
function setTriage(level) {
  const el = document.getElementById('tbox');

  const configs = {
    URGENT: {
      cls:  'urgent',
      ico:  '🔴',
      lbl:  'URGENCE',
      desc: 'Consultez immédiatement un médecin ou appelez le 185'
    },
    CONSULT: {
      cls:  'consult',
      ico:  '🟡',
      lbl:  'CONSULTATION',
      desc: 'Consultez un médecin dans les 24 à 48 heures'
    },
    OK: {
      cls:  'ok',
      ico:  '🟢',
      lbl:  'AUTO-SOIN',
      desc: 'Gérable à domicile avec les conseils donnés'
    }
  };

  if (!level || !configs[level]) {
    el.className = 'triage-box';
    el.innerHTML = `
      <div class="triage-ico">⏳</div>
      <div class="triage-lbl">En attente</div>
      <div class="triage-desc">Le niveau sera déterminé après analyse de vos symptômes</div>
    `;
    return;
  }

  const c = configs[level];
  el.className = `triage-box ${c.cls}`;
  el.innerHTML = `
    <div class="triage-ico">${c.ico}</div>
    <div class="triage-lbl">${c.lbl}</div>
    <div class="triage-desc">${c.desc}</div>
  `;
}

/* ============================================================
   API CLAUDE
   ============================================================ */

/** Appelle l'API Anthropic et retourne la réponse */
async function callAI(userMessage) {
  hist.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     buildSystemPrompt(),
      messages:   hist
    })
  });

  const data  = await response.json();
  let   reply = data.content?.[0]?.text || 'Désolé, une erreur est survenue. Veuillez réessayer.';

  /* Extrait le niveau de triage de la réponse */
  const triageMatch = reply.match(/TRIAGE:(URGENT|CONSULT|OK)/);
  if (triageMatch) {
    setTriage(triageMatch[1]);
    reply = reply.replace(/\nTRIAGE:(URGENT|CONSULT|OK)/, '').trim();
  }

  hist.push({ role: 'assistant', content: reply });
  return { reply, triage: triageMatch?.[1] };
}

/* ============================================================
   ENVOI DE MESSAGES
   ============================================================ */

/** Envoie un texte au chatbot */
async function sendText(text) {
  if (busy || !text.trim()) return;
  busy = true;

  document.getElementById('qr').innerHTML = '';
  addUser(text);
  showTyping();

  /* Met à jour le compteur */
  count++;
  document.getElementById('sc').textContent = count;

  try {
    const { reply, triage } = await callAI(text);
    removeTyping();

    const msgType = triage === 'URGENT' ? 'urgent'
                  : triage === 'CONSULT' ? 'warn'
                  : triage === 'OK'      ? 'ok'
                  : 'normal';

    addBot(reply, msgType);

    /* Affiche des réponses rapides de suivi si pas encore de triage */
    if (!triage && hist.length < 10) {
      showQR(FOLLOW_UPS[lang] || FOLLOW_UPS.fr);
    }

  } catch (err) {
    removeTyping();
    addBot('⚠️ Connexion interrompue. Vérifiez votre connexion et réessayez.');
    console.error('API error:', err);
  }

  busy = false;
}

/** Déclenché par le bouton Envoyer */
async function send() {
  const input = document.getElementById('inp');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  await sendText(text);
}

/* ============================================================
   ÉVÉNEMENTS CLAVIER & TEXTAREA
   ============================================================ */

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

function resize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 90) + 'px';
}

/* ============================================================
   PARAMÈTRES : LANGUE & CANAL
   ============================================================ */

function setLang(newLang, btn) {
  lang = newLang;
  document.querySelectorAll('.lb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  resetChat();
}

function setCh(newChannel, btn) {
  channel = newChannel;
  document.querySelectorAll('.ch').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');

  const placeholders = {
    whatsapp: 'Décrivez vos symptômes…',
    sms:      'SMS court (160 car. max)…',
    web:      'Décrivez vos symptômes en détail…'
  };
  document.getElementById('inp').placeholder = placeholders[newChannel] || placeholders.web;
}

/* ============================================================
   SCÉNARIOS DÉMO
   ============================================================ */

function runDemo(key) {
  if (busy) return;
  resetChat();
  /* Petit délai pour laisser le chat s'initialiser */
  setTimeout(() => {
    const text = DEMOS[key][lang] || DEMOS[key].fr;
    sendText(text);
  }, 600);
}

/* ============================================================
   INITIALISATION & RESET
   ============================================================ */

function initChat() {
  hist = [];
  document.getElementById('msgs').innerHTML = '';
  addBot(WELCOME[lang] || WELCOME.fr);
  showQR(QRS[lang] || QRS.fr);
  setTriage(null);
}

function resetChat() {
  initChat();
  hist = [];
  setTriage(null);
}

/* ============================================================
   SPLASH SCREEN — Animation de chargement
   ============================================================ */
(function runSplash() {
  let progress = 0;
  const bar    = document.getElementById('prog');

  const interval = setInterval(() => {
    progress += Math.random() * 4 + 2;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('splash').classList.add('gone');
        initChat();
      }, 400);
    }

    bar.style.width = Math.min(progress, 100) + '%';
  }, 60);
})();
