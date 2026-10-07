# Rapport de Projet de Fin d'Études

## Plateforme Web de Gestion des Stagiaires — GESTION

---

## Page de garde

| Champ | Valeur |
|-------|--------|
| **Titre** | Conception et développement d'une plateforme web de gestion des stagiaires |
| **Projet** | GESTION (Gestion Stagiaire) |
| **Type** | Projet de fin d'études |
| **Établissement** | [À compléter] |
| **Filière** | [À compléter] |
| **Réalisé par** | [Votre nom] |
| **Encadré par** | [Nom de l'encadrant] |
| **Année** | 2025–2026 |

---

## Résumé

GESTION est une application web full-stack destinée à digitaliser le cycle de vie des stagiaires au sein d'une organisation. Elle couvre la candidature avec CV, la validation administrative, l'assignation de tâches, la gestion d'équipes, les évaluations, les documents et les rapports statistiques.

L'application repose sur une architecture MERN-like : React (frontend), Node.js / Express (backend) et MongoDB (base de données). Elle propose trois rôles utilisateurs — Administrateur, Superviseur et Stagiaire — avec des permissions adaptées à chaque profil.

Le système est déployé en production sur Vercel (frontend) et Render (backend), avec une variante mobile Android pour le pointage.

**Mots-clés :** Gestion de stagiaires, MERN, React, Node.js, MongoDB, JWT, RBAC, Full-stack

---

## Table des matières

1. Introduction
2. Contexte et problématique
3. Analyse des besoins
4. Architecture du système
5. Modèle de données
6. Fonctionnalités principales
7. Technologies utilisées
8. Sécurité
9. Déploiement
10. Structure du projet
11. Pages de l'application
12. Conclusion et perspectives
13. Annexes

---

## 1. Introduction

La gestion des stagiaires dans les entreprises et centres de formation implique souvent des processus manuels : feuilles Excel, emails dispersés, suivi de tâches non centralisé. Ces méthodes entraînent des pertes d'information, un manque de traçabilité et une charge administrative importante.

GESTION répond à ce besoin en proposant une plateforme centralisée accessible via navigateur web, permettant à chaque acteur (RH, encadrant, stagiaire) d'interagir avec le système selon son rôle.

---

## 2. Contexte et problématique

### 2.1 Contexte

Les organisations accueillant des stagiaires doivent gérer :

- Les candidatures et leur validation
- L'assignation de superviseurs
- Le suivi des tâches et de la progression
- Les évaluations périodiques
- Les documents administratifs
- Les statistiques et rapports de suivi

### 2.2 Problématique

Comment concevoir et développer une solution web centralisée, sécurisée et multi-rôles pour gérer l'ensemble du parcours d'un stagiaire, de sa candidature à son évaluation finale ?

### 2.3 Objectifs

| Objectif | Description |
|----------|-------------|
| **O1** | Digitaliser le processus de candidature et d'approbation |
| **O2** | Permettre le suivi des tâches et des équipes en temps réel |
| **O3** | Offrir des tableaux de bord et rapports pour la prise de décision |
| **O4** | Sécuriser l'accès par rôles et authentification JWT |
| **O5** | Déployer une solution accessible en production (cloud) |

---

## 3. Analyse des besoins

### 3.1 Acteurs du système

| Acteur | Rôle | Responsabilités |
|--------|------|-----------------|
| **👤 Administrateur** | RH / Direction | Gère utilisateurs, approbations, rapports |
| **👤 Superviseur** | Encadrant | Gère équipes, tâches, évaluations |
| **👤 Stagiaire** | Intern | Consulte tâches, documents, profil |

### 3.2 Cas d'utilisation

**Administrateur :**
- S'authentifier
- Approuver candidatures
- Gérer utilisateurs
- Consulter rapports

**Superviseur :**
- Gérer stagiaires
- Créer tâches
- Gérer équipes
- Évaluer stagiaires
- Valider tâches

**Stagiaire :**
- S'authentifier
- Consulter ses tâches
- Gérer ses documents
- Mettre à jour progression

### 3.3 Matrice des permissions

| Fonctionnalité | Admin | Superviseur | Stagiaire |
|---|---|---|---|
| Tableau de bord | ✅ | ✅ | ✅ |
| Gestion stagiaires | ✅ | ✅ | ❌ |
| Équipes | ✅ | ✅ | ✅ (lecture) |
| Tâches | ✅ | ✅ | ✅ (assignées) |
| Rapports | ✅ | ✅ | ❌ |
| Évaluations | ✅ | ✅ | ❌ |
| Utilisateurs | ✅ | ❌ | ❌ |
| Approbations | ✅ | ❌ | ❌ |
| Mes documents | ❌ | ❌ | ✅ |
| Profil / Paramètres | ✅ | ✅ | ✅ |

---

## 4. Architecture du système

### 4.1 Architecture globale (3 tiers)

```
┌─────────────────────────────────────────────────────┐
│        🖥️ Couche Présentation                      │
│  - Application React Vite + Tailwind CSS           │
│  - App Android Capacitor / WebView                 │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS / Axios
┌─────────────────▼───────────────────────────────────┐
│       ⚙️ Couche Métier                             │
│  - API REST Express.js Node.js ≥ 20               │
│  - Middleware JWT + RBAC                          │
│  - Multer - Upload fichiers                       │
│  - Nodemailer - Emails                            │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS / Axios
┌─────────────────▼───────────────────────────────────┐
│      🗄️ Couche Données                             │
│  - MongoDB                                        │
│  - Mongoose ODM                                   │
│  - Stockage fichiers (uploads/)                   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Architecture frontend

```
Frontend React
├── Pages
│   ├── Dashboard
│   ├── Interns / Tasks / Teams
│   ├── Reports / Settings
│   ├── Login / Register
│   └── ...
├── Composants
│   ├── Layout
│   ├── Sidebar
│   ├── Navbar
│   └── ProtectedRoute
├── Contextes
│   ├── AuthContext
│   ├── ThemeContext
│   └── LanguageContext
└── Services
    ├── api.js (Axios)
    ├── interns.js
    ├── tasks.js
    └── teams.js
```

### 4.3 Architecture backend

```
Express Server
├── Routes
│   ├── /api/auth
│   ├── /api/interns
│   ├── /api/tasks
│   ├── /api/teams
│   ├── /api/admin
│   ├── /api/stats
│   ├── /api/evaluations
│   ├── /api/timesheet
│   ├── /api/notifications
│   └── ...
├── Middleware
│   ├── auth.js
│   ├── upload.js
│   ├── helmet + cors
│   └── rate-limit
├── Controllers
│   ├── authController
│   ├── adminController
│   └── ...
└── Models
    ├── User
    ├── Intern
    ├── Task
    ├── Team
    └── ...
```

### 4.4 Flux d'authentification

1. **Saisie des identifiants** : L'utilisateur saisit email + mot de passe
2. **POST /api/auth/login** : Envoi vers le serveur
3. **Recherche et vérification** : 
   - Recherche utilisateur dans BD
   - Vérification hash bcrypt du mot de passe
4. **Réponse serveur** :
   - ✅ Si valide : Génération JWT (30 jours), cookie HttpOnly, stockage localStorage
   - ❌ Si invalide : Erreur 403 ou message d'erreur
5. **Redirection** : Utilisateur redirigé vers `/dashboard`
6. **À chaque requête protégée** : 
   - `Authorization: Bearer token` envoyé
   - Vérification JWT côté serveur
   - Chargement utilisateur et données

### 4.5 Flux de candidature et approbation

```
Stagiaire s'inscrit avec CV
         ↓
Compte créé (isApproved = false)
Candidature Application (status = pending)
         ↓
Page attente validation
         ↓
Admin examine
    ↙        ↘
  Approuve   Rejette
    ↓          ↓
Compte       Notification
activé        envoyée
Profil Intern créé
Superviseur assigné
    ↓
Tâches et équipes
configurées
    ↓
Stagiaire accède
au dashboard
```

### 4.6 Workflow des tâches

```
Tâche créée
    ↓
Stagiaire commence (in_progress)
    ↓
Stagiaire termine (completed)
    ↓
Soumission superviseur (pending_validation)
    ↓
Superviseur examine
    ↙                ↘
  Valide             Rejette
    ↓                  ↓
approved            rejected
                       ↓
                   Correction
                       ↓
                  (pending_validation)
```

---

## 5. Modèle de données

### 5.1 Collections MongoDB

| Collection | Rôle |
|---|---|
| **users** | Comptes utilisateurs (auth, rôles) |
| **interns** | Profils stagiaires détaillés |
| **tasks** | Tâches assignées |
| **teams** | Équipes de projet |
| **evaluations** | Évaluations périodiques |
| **applications** | Candidatures en attente |
| **timesheets** | Feuilles de temps |
| **notifications** | Notifications système |
| **settings** | Paramètres globaux |
| **usersettings** | Préférences personnelles |

### 5.2 Schémas principaux

#### User
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed bcrypt),
  role: Enum ['admin', 'supervisor', 'intern'],
  isActive: Boolean,
  isApproved: Boolean
}
```

#### Intern
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  studentId: String (unique),
  school: String,
  major: String,
  startDate: Date,
  endDate: Date,
  supervisor: ObjectId (ref: User),
  status: Enum ['active', 'completed', 'suspended']
}
```

#### Task
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId (ref: Intern),
  assignedBy: ObjectId (ref: User),
  dueDate: Date,
  priority: Enum ['low', 'medium', 'high'],
  status: Enum ['pending', 'in_progress', 'completed', 'pending_validation', 'approved', 'rejected'],
  progress: Number (0-100)
}
```

#### Team
```javascript
{
  _id: ObjectId,
  name: String,
  project: String,
  supervisor: ObjectId (ref: User),
  interns: [ObjectId] (ref: Intern)
}
```

#### Evaluation
```javascript
{
  _id: ObjectId,
  intern: ObjectId (ref: Intern),
  supervisor: ObjectId (ref: User),
  ratings: Array,
  feedback: String,
  status: Enum ['draft', 'submitted', 'approved']
}
```

---

## 6. Fonctionnalités principales

### 6.1 Module Authentification
- ✅ Inscription standard et avec CV (PDF/DOC)
- ✅ Connexion sécurisée JWT
- ✅ Réinitialisation mot de passe par code email (6 chiffres)
- ✅ Gestion des sessions (cookie HttpOnly + Bearer)

### 6.2 Module Gestion des Stagiaires
- ✅ CRUD complet des profils stagiaires
- ✅ Filtres par école, statut, superviseur
- ✅ Upload et gestion de documents
- ✅ Suivi des compétences et contacts d'urgence

### 6.3 Module Tâches
- ✅ Création et assignation par superviseur/admin
- ✅ Suivi de progression (0–100 %)
- ✅ Commentaires et pièces jointes
- ✅ Validation hiérarchique (workflow)

### 6.4 Module Équipes
- ✅ Regroupement de stagiaires par projet
- ✅ Statistiques de tâches par équipe
- ✅ Assignation de superviseur

### 6.5 Module Évaluations
- ✅ Notation par catégories (1–5)
- ✅ Feedback textuel et objectifs
- ✅ Historique par période

### 6.6 Module Rapports
- ✅ Graphiques Chart.js / Recharts
- ✅ Statistiques stagiaires, tâches, écoles
- ✅ Filtrage par superviseur (pour les superviseurs)

### 6.7 Module Notifications
- ✅ Cloche dans la navbar
- ✅ Polling toutes les 60 secondes
- ✅ Marquage lu/non lu

### 6.8 Module Paramètres
- ✅ Thème clair/sombre
- ✅ Langue (FR / EN / AR)
- ✅ Paramètres SMTP et sécurité (admin)

---

## 7. Technologies utilisées

### 7.1 Stack technique

| Frontend | Backend | Infrastructure |
|---|---|---|
| React 18 | Node.js ≥ 20 | MongoDB |
| Vite 5 | Express 5 | Vercel |
| Tailwind CSS 3 | Mongoose 9 | Render |
| React Router 6 | jsonwebtoken | MongoDB Atlas |
| Axios | bcryptjs | |
| Chart.js / Recharts | Multer | |
| Capacitor 8 | Nodemailer | |

### 7.2 Détail des dépendances

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| UI | React | 18.3 | Interface utilisateur |
| Build | Vite | 5.4 | Bundler et dev server |
| Style | Tailwind CSS | 3.4 | Design responsive |
| Routing | React Router | 6.26 | Navigation SPA |
| HTTP | Axios | 1.7 | Client API |
| Graphiques | Chart.js / Recharts | 4.4 / 2.12 | Visualisations |
| Serveur | Express | 5.2 | API REST |
| BDD | Mongoose | 9.2 | ODM MongoDB |
| Auth | JWT + bcrypt | — | Sécurité |
| Upload | Multer | 2.1 | Fichiers CV/docs |
| Email | Nodemailer | 8.0 | Reset password |

---

## 8. Sécurité

### 8.1 Mesures implémentées

| Mesure | Implémentation |
|---|---|
| **Mots de passe** | Hash bcrypt (salt 10), jamais stockés en clair |
| **Sessions** | JWT signé, expiration 30 jours |
| **CORS** | Origines autorisées (Vercel, Render, localhost) |
| **Headers** | Helmet (CSP, XSS protection) |
| **Rate limiting** | Protection contre brute force |
| **Upload** | Types autorisés (PDF, DOC, DOCX), max 5 Mo |
| **RBAC** | Vérification rôle à chaque route sensible |
| **HTTPS** | Connexions chiffrées en production |

---

## 9. Déploiement

### 9.1 Architecture de déploiement

```
Internet
    ↓
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│  - Build statique Vite              │
│  - Proxy API /api                   │
│  - HTTPS                            │
└────────────┬────────────────────────┘
             │
        /api/* proxy
             ↓
┌─────────────────────────────────────┐
│    Render (Backend)                 │
│  - Express API                      │
│  - Node.js                          │
│  - HTTPS                            │
└────────────┬────────────────────────┘
             │
        MONGODB_URI
             ↓
┌─────────────────────────────────────┐
│   MongoDB Atlas (BDD)               │
│  - Cloud Database                   │
└─────────────────────────────────────┘
```

### 9.2 Variables d'environnement

#### Backend

| Variable | Description |
|---|---|
| `MONGODB_URI` | URI de connexion MongoDB |
| `JWT_SECRET` | Clé secrète JWT |
| `JWT_EXPIRE` | Durée du token (30d) |
| `EMAIL_USER` | Email SMTP (Gmail) |
| `EMAIL_PASS` | Mot de passe SMTP |
| `FRONTEND_URL` | URL frontend (CORS) |
| `PORT` | Port serveur (5000) |

#### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de l'API backend |

### 9.3 Scripts de lancement

```bash
# Backend
npm run dev      # Développement (nodemon)
npm start        # Production

# Frontend
npm run dev      # Serveur Vite (port 5173)
npm run build    # Build production
npm run preview  # Prévisualisation build
```

---

## 10. Structure du projet

```
GESTION/
├── backend/
│   ├── server.js              # Point d'entrée Express
│   ├── models/                # Schémas Mongoose
│   │   ├── User.js
│   │   ├── Intern.js
│   │   ├── Task.js
│   │   ├── Team.js
│   │   ├── Evaluation.js
│   │   └── ...
│   ├── routes/                # Routes API REST
│   │   ├── auth.js
│   │   ├── interns.js
│   │   ├── tasks.js
│   │   └── ...
│   ├── controllers/           # Logique métier
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   └── ...
│   ├── middleware/            # Auth, upload
│   │   ├── auth.js
│   │   └── upload.js
│   ├── config/                # Configuration
│   │   └── email.js
│   └── uploads/               # Fichiers uploadés
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Routes et protection
│   │   ├── pages/             # Écrans (20+ pages)
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Interns.jsx
│   │   │   └── ...
│   │   ├── components/        # UI réutilisable
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── contexts/          # État global
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── services/          # Couche API
│   │   │   ├── api.js
│   │   │   ├── interns.js
│   │   │   └── ...
│   │   └── assets/
│   ├── android/               # App Capacitor Android
│   ├── public/
│   └── vite.config.js
├── android_pointage/          # App Android pointage offline
│   ├── app/
│   ├── build.gradle.kts
│   └── ...
├── package.json               # Scripts racine
└── vercel.json                # Config déploiement Vercel
```

---

## 11. Pages de l'application

| Route | Page | Accès |
|---|---|---|
| `/login` | Connexion | Public |
| `/register` | Inscription + CV | Public |
| `/registration-pending` | Attente validation | Utilisateurs non approuvés |
| `/forgot-password` | Réinitialisation mot de passe | Public |
| `/dashboard` | Tableau de bord | Authentifié |
| `/interns` | Liste stagiaires | Admin, Superviseur |
| `/interns/new` | Créer stagiaire | Admin, Superviseur |
| `/interns/:id` | Détail stagiaire | Admin, Superviseur |
| `/interns/:id/edit` | Modifier stagiaire | Admin, Superviseur |
| `/interns/:id/evaluations` | Évaluations | Admin, Superviseur |
| `/tasks` | Gestion tâches | Tous |
| `/tasks/new` | Créer tâche | Admin, Superviseur |
| `/tasks/:id` | Détail tâche | Tous |
| `/tasks/:id/edit` | Modifier tâche | Admin, Superviseur |
| `/teams` | Équipes | Tous |
| `/teams/new` | Créer équipe | Admin, Superviseur |
| `/teams/:id/edit` | Modifier équipe | Admin, Superviseur |
| `/reports` | Rapports | Admin, Superviseur |
| `/users` | Utilisateurs | Admin |
| `/approvals` | Approbations candidatures | Admin |
| `/my-documents` | Mes documents | Stagiaire |
| `/profile` | Profil | Authentifié |
| `/settings` | Paramètres | Authentifié |
| `/search` | Recherche globale | Authentifié |

---

## 12. Conclusion

### 12.1 Bilan

Le projet GESTION atteint les objectifs fixés :

✅ **Digitalisation complète** du parcours stagiaire  
✅ **Interface moderne et responsive** (Tailwind CSS)  
✅ **Sécurité par rôles** et authentification JWT  
✅ **Déploiement cloud fonctionnel** (Vercel + Render)  
✅ **Architecture modulaire et maintenable**  

### 12.2 Compétences acquises

- Développement **full-stack JavaScript** (React + Node.js)
- Conception d'**API REST** et modélisation MongoDB
- Gestion de l'**authentification et des autorisations** (RBAC)
- **Déploiement** d'applications web en production
- Intégration de **graphiques et tableaux de bord**
- Gestion de **fichiers** et envoi d'**emails**
- Gestion de **formulaires complexes** et validation
- **Responsive design** avec Tailwind CSS

### 12.3 Perspectives d'évolution

| Évolution | Priorité | Description |
|---|---|---|
| WebSockets | Haute | Notifications en temps réel |
| Tests automatisés | Haute | Jest (backend) + Cypress (frontend) |
| Stockage cloud | Moyenne | AWS S3 pour les fichiers |
| API documentation | Moyenne | Swagger / OpenAPI |
| PWA | Basse | Application installable |
| Multi-tenant | Basse | Plusieurs organisations |
| Amélioration performance | Moyenne | Caching, optimisation requêtes |

---

## Annexes

### Annexe A — Endpoints API principaux

#### Authentification
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/register-with-cv
GET    /api/auth/me
POST   /api/auth/forgot-password
```

#### Stagiaires
```
GET    /api/interns
POST   /api/interns
PUT    /api/interns/:id
DELETE /api/interns/:id
```

#### Tâches
```
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id/status
PATCH  /api/tasks/:id/validate
```

#### Équipes
```
GET    /api/teams
POST   /api/teams
```

#### Administration
```
GET    /api/admin/pending-interns
PUT    /api/admin/approve-intern/:id
GET    /api/stats/reports
```

#### Autres
```
GET    /api/timesheet
POST   /api/timesheet
GET    /api/notifications
GET    /api/users
POST   /api/evaluations
```

### Annexe B — Captures d'écran suggérées

Pour compléter le rapport imprimé, ajoutez des captures de :

1. Page de connexion
2. Tableau de bord admin
3. Liste des stagiaires avec filtres
4. Détail d'une tâche et workflow
5. Page des rapports (graphiques)
6. Page d'approbation des candidatures
7. Interface mobile (sidebar responsive)
8. Formulaire de création stagiaire
9. Feuille de temps
10. Paramètres utilisateur

---

**Fin du rapport**

*Document généré pour le projet GESTION — Année 2025–2026*
