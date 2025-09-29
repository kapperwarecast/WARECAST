# 🎬 Warecast App

Application de streaming vidéo construite avec Next.js 15, React 19, et Supabase.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🛠️ Stack Technique

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **État:** Zustand, React Context
- **Vidéo:** Player vidéo personnalisé avec HLS

## 📁 Structure du Projet

```
warecast-app/
├── app/                    # Routes Next.js (App Router)
│   ├── api/               # API Routes
│   ├── auth/              # Pages d'authentification
│   ├── film/              # Pages de détail des films
│   └── profile/           # Pages de profil utilisateur
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants UI (shadcn)
│   └── sidebar/          # Composants de navigation
├── contexts/             # Contextes React (Auth, Filters, etc.)
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et configuration
│   └── supabase/         # Client Supabase
├── stores/               # Stores Zustand
└── types/                # Types TypeScript

```

## 🔑 Fonctionnalités Principales

- ✅ Authentification utilisateur (Supabase Auth)
- ✅ Catalogue de films avec filtres et tri
- ✅ Scroll infini optimisé
- ✅ Lecteur vidéo personnalisé
- ✅ Gestion des favoris
- ✅ Profil utilisateur
- ✅ Interface responsive
- ✅ Mode sombre

## 🎯 Optimisations Récentes

Voir [README-OPTIMISATIONS.md](./README-OPTIMISATIONS.md) pour les détails sur les dernières améliorations de performance.

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

## 🔧 Configuration

### Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribution

Ce projet est en développement actif. Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue.

## 📄 Licence

Propriétaire - Tous droits réservés
