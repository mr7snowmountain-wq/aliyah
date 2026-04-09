# Aliyah — Brief Projet Complet

## Concept
App mobile-first pour mères célibataires au Maroc.
Ton : bienveillant, girl power, motivant, jamais condescendant.
Langue : français ou darija selon le contexte.

## Live & Repo
- Production : https://aliyah-eight.vercel.app
- Stack : React + Vite + Supabase + Claude API (Haiku)

## Design — Règles STRICTES
- Font UNIQUE : **Nunito** partout (titres, body, cards, tout)
- JAMAIS : Playfair Display, Inter, Arial, DM Sans
- Couleurs : rose #E8547A, pêche #F7A07A, corail #F4856A
- Background : dégradé chaud #FFF0F5 → #FFE8D6
- Style : glassmorphism, cards arrondies border-radius 20px
- Cards planning : effet stack superposées (nth-child CSS)
- Référence visuelle : app Filo (ronde, girly, chaleureuse)
- Illustrations : SVG style cartoon femme forte marocaine

## Structure Fichiers
```
src/
├── pages/
│   ├── AuthPage.jsx        ✅ Login/inscription
│   ├── OnboardingPage.jsx  ✅ 3 étapes (prénom maman, enfant, âge)
│   ├── HomePage.jsx        ✅ Dashboard principal
│   └── Placeholders.jsx    ⬜ Modules vides à remplir
├── components/
│   └── BottomNav.jsx       ✅ Navigation bas de page
├── hooks/
│   └── useAuth.jsx         ✅ Auth Supabase
├── lib/
│   └── supabase.js         ✅ Client Supabase
├── index.css               ✅ Variables CSS + styles globaux
└── App.jsx                 ✅ Routes React Router
```

## Supabase — Table profiles
```sql
id, mama_name, child_name, child_age, 
onboarding_complete, created_at, updated_at
```

## Ce qui est fait ✅
- Auth Supabase (inscription/connexion/onboarding)
- Dashboard Home avec effet stack cards
- Nunito sur toute l'app
- Déployé sur Vercel + Supabase connecté

## Modules à construire ⬜

### 1. Planning vocal (PRIORITÉ 1)
- Bouton micro → Web Speech API (gratuit, navigateur)
- Transcription temps réel affichée
- Texte → Claude Haiku API
- Prompt : génère planning JSON [{heure, tache, emoji, done:false}]
- Affichage en stack cards dynamiques
- Sauvegarde dans Supabase table plannings

### 2. Juridique (PRIORITÉ 2)
- Photo document → Claude Vision API
- Explication en français simple ou darija
- Lecture audio → Web Speech Synthesis (gratuit)

### 3. Recettes (PRIORITÉ 3)
- JSON statique recettes marocaines pré-générées
- Filtre par ingrédients disponibles
- Budget Maroc, fun avec enfant

### 4. Activités DIY (PRIORITÉ 4)
- JSON statique activités pré-générées
- Filtre par âge enfant
- Faisable à la maison, zéro achat

## Modèle économique
- Gratuit : 3 plannings/mois
- Aliyah+ : 29 DH/mois illimité

## Variables d'environnement Vercel
```
VITE_SUPABASE_URL=https://byescdosblqsfpsjhjud.supabase.co
VITE_SUPABASE_ANON_KEY=***
VITE_ANTHROPIC_API_KEY=***
```

## Claude API
- Modèle simple : claude-haiku-4-5-20251001
- Modèle complexe : claude-sonnet-4-6
- Max tokens : 1000
- Toujours Haiku sauf pour juridique (Sonnet)
