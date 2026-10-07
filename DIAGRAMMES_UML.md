# Diagrammes UML — Plateforme GESTION

## 1. Diagramme de Cas d'Utilisation

```mermaid
usecase diagram
    actor Admin as "👤 Administrateur"
    actor Supervisor as "👤 Superviseur"
    actor Intern as "👤 Stagiaire"
    actor System as "🔐 Système"

    rectangle GESTION {
        usecase UC1 as "S'authentifier"
        usecase UC2 as "Gérer Stagiaires"
        usecase UC3 as "Créer Tâches"
        usecase UC4 as "Gérer Équipes"
        usecase UC5 as "Évaluer Stagiaires"
        usecase UC6 as "Approuver Candidatures"
        usecase UC7 as "Gérer Utilisateurs"
        usecase UC8 as "Consulter Rapports"
        usecase UC9 as "Consulter Tâches"
        usecase UC10 as "Gérer Documents"
        usecase UC11 as "Valider Tâches"
        usecase UC12 as "Réinitialiser Mot de Passe"
        usecase UC13 as "Envoyer Notifications"
        usecase UC14 as "Consulter Tableau de Bord"
    }

    %% Authentification
    Admin --> UC1
    Supervisor --> UC1
    Intern --> UC1

    %% Admin
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC2

    %% Superviseur
    Supervisor --> UC2
    Supervisor --> UC3
    Supervisor --> UC4
    Supervisor --> UC5
    Supervisor --> UC11
    Supervisor --> UC8

    %% Stagiaire
    Intern --> UC9
    Intern --> UC10

    %% Tous
    Admin --> UC14
    Supervisor --> UC14
    Intern --> UC14

    %% Système
    System --> UC12
    System --> UC13

    %% Include relationships
    UC1 ..|> UC14 : <<include>>
    UC6 ..|> UC2 : <<include>>
    UC5 ..|> UC2 : <<include>>
    UC11 ..|> UC3 : <<include>>
```

---

## 2. Diagramme de Classes

```mermaid
classDiagram
    class User {
        -ObjectId _id
        -string firstName
        -string lastName
        -string email
        -string password
        -enum role
        -boolean isActive
        -boolean isApproved
        +authenticate()
        +updateProfile()
        +changePassword()
    }

    class Intern {
        -ObjectId _id
        -ObjectId userId
        -string studentId
        -string school
        -string major
        -Date startDate
        -Date endDate
        -ObjectId supervisorId
        -enum status
        -Document[] documents
        +getProgress()
        +updateStatus()
    }

    class Task {
        -ObjectId _id
        -string title
        -string description
        -ObjectId assignedToId
        -ObjectId assignedById
        -Date dueDate
        -enum priority
        -enum status
        -int progress
        -Comment[] comments
        +updateProgress()
        +changeStatus()
        +addComment()
    }

    class Team {
        -ObjectId _id
        -string name
        -string project
        -ObjectId supervisorId
        -ObjectId[] internIds
        -Task[] tasks
        +addIntern()
        +removeIntern()
        +getTeamStats()
    }

    class Evaluation {
        -ObjectId _id
        -ObjectId internId
        -ObjectId supervisorId
        -Rating[] ratings
        -string feedback
        -enum status
        -Date evaluationDate
        +submitEvaluation()
        +approveEvaluation()
    }

    class Application {
        -ObjectId _id
        -ObjectId userId
        -string cvUrl
        -enum status
        -ObjectId reviewedById
        -Date submittedDate
        -Date reviewedDate
        +approve()
        +reject()
    }

    class Notification {
        -ObjectId _id
        -ObjectId userId
        -string message
        -enum type
        -boolean isRead
        -Date createdDate
        +markAsRead()
    }

    class Timesheet {
        -ObjectId _id
        -ObjectId userId
        -Map days
        -Date month
        -enum status
        +submit()
        +approve()
    }

    class Rating {
        -string category
        -int score
        -string comments
    }

    class Comment {
        -ObjectId _id
        -ObjectId authorId
        -string text
        -Date createdDate
    }

    %% Relations
    User "1" --> "0..*" Intern : supervise
    User "1" --> "1" Evaluation : réalise
    User "1" --> "1" Timesheet : possède
    User "1" --> "0..*" Notification : reçoit

    Intern "1" --> "1" User : appartient à
    Intern "1" --> "0..*" Task : assigné à
    Intern "1" --> "0..*" Evaluation : évalué
    Intern "0..*" --> "1" Team : appartient à

    Task "1" --> "0..*" Comment : possède
    Task "1" --> "1" User : créé par
    Task "0..*" --> "1" Team : appartient à

    Team "1" --> "1" User : supervisé par
    Team "1" --> "0..*" Intern : contient

    Evaluation "1" --> "0..*" Rating : contient
    Evaluation "1" --> "1" Intern : évalue

    Application "1" --> "1" User : candidature

    Timesheet "1" --> "1" User : enregistre
```

---

## 3. Diagramme de Séquence — Flux de Connexion

```mermaid
sequenceDiagram
    actor User as "👤 Utilisateur"
    participant Browser as "🌐 Navigateur"
    participant Frontend as "⚛️ React Frontend"
    participant API as "🔌 Express API"
    participant DB as "🗄️ MongoDB"

    User->>Browser: Accède à /login
    Browser->>Frontend: Charge page Login
    Frontend->>User: Affiche formulaire

    User->>Frontend: Saisit email + mdp
    User->>Frontend: Clique "Connexion"
    
    Frontend->>API: POST /api/auth/login
    API->>DB: Recherche utilisateur
    DB-->>API: Utilisateur trouvé
    
    alt Utilisateur valide
        API->>API: Vérification bcrypt
        API->>API: Génération JWT (30j)
        API-->>Frontend: 200 + token + user
        Frontend->>Frontend: localStorage.setItem('token')
        Frontend->>Browser: Redirection /dashboard
        Browser->>Frontend: Charge Dashboard
        Frontend->>User: Affiche tableau de bord
    else Identifiants invalides
        API-->>Frontend: 401 Unauthorized
        Frontend->>User: Affiche message erreur
    end
```

---

## 4. Diagramme de Séquence — Workflow Candidature

```mermaid
sequenceDiagram
    actor Stagiaire as "👤 Stagiaire"
    actor Admin as "👤 Admin"
    participant Frontend as "⚛️ Frontend"
    participant API as "🔌 API"
    participant Email as "📧 Email"
    participant DB as "🗄️ MongoDB"

    Stagiaire->>Frontend: Accède /register
    Frontend->>Stagiaire: Affiche formulaire + CV
    
    Stagiaire->>Frontend: Remplit formulaire + upload CV
    Frontend->>API: POST /api/auth/register-with-cv
    API->>DB: Crée User (isApproved=false)
    API->>DB: Crée Application (status=pending)
    API->>Email: Envoie confirmation email
    Email-->>Stagiaire: Email reçu
    API-->>Frontend: 201 Created
    Frontend->>Stagiaire: Redirection vers attente
    
    rect rgb(200, 150, 255)
    Note over Admin: Admin examine la candidature
    Admin->>Frontend: Accède /approvals
    Frontend->>API: GET /api/admin/pending-interns
    API->>DB: Liste des candidatures
    DB-->>API: Retourne candidatures
    API-->>Frontend: Affiche liste
    Frontend->>Admin: Affiche interface approbation
    
    Admin->>Frontend: Clique "Approuver"
    Frontend->>API: PUT /api/admin/approve-intern/:id
    API->>DB: Update User (isApproved=true)
    API->>DB: Crée Intern profile
    API->>DB: Update Application (status=approved)
    API->>Email: Envoie email approbation
    Email-->>Stagiaire: Approbation reçue
    API-->>Frontend: 200 OK
    end
    
    Stagiaire->>Frontend: Accède /login
    Frontend->>API: POST /api/auth/login
    API->>DB: Vérification (maintenant approuvé)
    API-->>Frontend: 200 + token
    Frontend->>Stagiaire: Redirection /dashboard
```

---

## 5. Diagramme de Séquence — Création et Validation de Tâche

```mermaid
sequenceDiagram
    actor Superviseur as "👤 Superviseur"
    actor Stagiaire as "👤 Stagiaire"
    participant Frontend as "⚛️ Frontend"
    participant API as "🔌 API"
    participant DB as "🗄️ MongoDB"
    participant Notif as "🔔 Notifications"

    rect rgb(200, 220, 255)
    Note over Superviseur: Création de tâche
    Superviseur->>Frontend: Accède /tasks/new
    Frontend->>Superviseur: Affiche formulaire
    
    Superviseur->>Frontend: Remplit titre, desc, assigné à...
    Frontend->>API: POST /api/tasks
    API->>DB: Crée Task (status=pending)
    API->>Notif: Ajoute notification
    API-->>Frontend: 201 Created
    Frontend->>Superviseur: Confirmation création
    end

    rect rgb(255, 220, 200)
    Note over Stagiaire: Stagiaire traite tâche
    Stagiaire->>Frontend: Consulte ses tâches
    Frontend->>API: GET /api/tasks (assignedTo=me)
    API->>DB: Récupère tâches
    API-->>Frontend: Affiche liste
    
    Stagiaire->>Frontend: Clique sur tâche
    Frontend->>Stagiaire: Affiche détail
    
    Stagiaire->>Frontend: Clique "Commencer"
    Frontend->>API: PATCH /api/tasks/:id/status
    API->>DB: Update status = in_progress
    API-->>Frontend: 200 OK
    Frontend->>Stagiaire: Tâche en cours
    
    Stagiaire->>Frontend: Ajoute commentaire + progress
    Frontend->>API: PUT /api/tasks/:id
    API->>DB: Update progress, commentaires
    API-->>Frontend: 200 OK
    
    Stagiaire->>Frontend: Clique "Soumettre"
    Frontend->>API: PATCH /api/tasks/:id/status
    API->>DB: Update status = pending_validation
    API->>Notif: Notifie superviseur
    API-->>Frontend: 200 OK
    end

    rect rgb(200, 255, 200)
    Note over Superviseur: Validation de tâche
    Superviseur->>Frontend: Consulte tâches en validation
    Frontend->>API: GET /api/tasks (status=pending_validation)
    API->>DB: Récupère tâches
    API-->>Frontend: Affiche liste
    
    Superviseur->>Frontend: Examine tâche
    Frontend->>Superviseur: Affiche détail complet
    
    alt Tâche validée
        Superviseur->>Frontend: Clique "Approuver"
        Frontend->>API: PATCH /api/tasks/:id/validate
        API->>DB: Update status = approved
        API->>Notif: Notifie stagiaire (approuvée)
        API-->>Frontend: 200 OK
    else Tâche rejetée
        Superviseur->>Frontend: Clique "Rejeter" + commentaire
        Frontend->>API: PATCH /api/tasks/:id/validate
        API->>DB: Update status = rejected + feedback
        API->>Notif: Notifie stagiaire (rejetée)
        API-->>Frontend: 200 OK
    end
    end
```

---

## 6. Diagramme de Séquence — Système de Notifications

```mermaid
sequenceDiagram
    actor User as "👤 Utilisateur"
    participant Frontend as "⚛️ Frontend"
    participant API as "🔌 API"
    participant DB as "🗄️ MongoDB"

    User->>Frontend: Accède dashboard
    Frontend->>Frontend: Démarre polling (60s)
    
    loop Tous les 60 secondes
        Frontend->>API: GET /api/notifications
        API->>DB: Récupère notifications non lues
        DB-->>API: Retourne notifications
        API-->>Frontend: Liste notifications
        Frontend->>Frontend: Met à jour cloche
    end

    alt Événement système
        Note over API: Task créée, candidature approuvée, etc.
        API->>DB: Crée Notification
        API->>Frontend: Prochaine vérification (60s max)
    end

    User->>Frontend: Clique cloche
    Frontend->>User: Affiche dropdown notifications
    
    User->>Frontend: Clique notification
    Frontend->>API: PUT /api/notifications/:id (isRead=true)
    API->>DB: Update notification
    API-->>Frontend: 200 OK
    Frontend->>Frontend: Barre notification disparaît
```

---

## 7. Diagramme de Séquence — Flux d'Évaluation

```mermaid
sequenceDiagram
    actor Superviseur as "👤 Superviseur"
    actor Stagiaire as "👤 Stagiaire"
    participant Frontend as "⚛️ Frontend"
    participant API as "🔌 API"
    participant DB as "🗄️ MongoDB"

    Superviseur->>Frontend: Accède /interns/:id/evaluations
    Frontend->>API: GET /api/evaluations?intern=:id
    API->>DB: Récupère évaluations
    API-->>Frontend: Affiche liste

    Superviseur->>Frontend: Crée nouvelle évaluation
    Frontend->>Superviseur: Affiche formulaire notation

    Superviseur->>Frontend: Note catégories (1-5)
    Superviseur->>Frontend: Ajoute feedback texte
    Superviseur->>Frontend: Clique "Soumettre"
    
    Frontend->>API: POST /api/evaluations
    API->>DB: Crée Evaluation (status=submitted)
    API->>API: Envoie email au stagiaire
    API-->>Frontend: 201 Created
    
    Frontend->>Superviseur: Confirmation

    rect rgb(255, 220, 200)
    Note over Stagiaire: Stagiaire consulte son évaluation
    Stagiaire->>Frontend: Accède /interns/:id/evaluations
    Frontend->>API: GET /api/evaluations (my evaluations)
    API->>DB: Récupère ses évaluations
    API-->>Frontend: Affiche
    Frontend->>Stagiaire: Consulte notation et feedback
    end
```

---

## 8. Diagramme de Classe — Détail Authentification

```mermaid
classDiagram
    class AuthService {
        -string jwtSecret
        -number jwtExpire
        +login(email, password) Pair~token, user~
        +register(userData) User
        +registerWithCV(userData, cvFile) Application
        +validateToken(token) User
        +refreshToken(token) Token
        +forgotPassword(email) void
        +resetPassword(token, password) void
    }

    class JWTManager {
        -string secret
        -number expireTime
        +generateToken(userId, role) string
        +verifyToken(token) Payload
        +decodeToken(token) Payload
        -signPayload(payload) string
    }

    class PasswordManager {
        +hashPassword(password) string
        +verifyPassword(password, hash) boolean
        +generateResetCode() string
    }

    class EmailService {
        -string smtpUser
        -string smtpPass
        +sendConfirmation(email) void
        +sendResetCode(email, code) void
        +sendApprovalNotification(email) void
        +sendTaskNotification(email, task) void
    }

    class RBACValidator {
        -Map permissions
        +hasPermission(role, action) boolean
        +canAccess(user, resource) boolean
        +validate(token, requiredRole) boolean
    }

    AuthService --> JWTManager : utilise
    AuthService --> PasswordManager : utilise
    AuthService --> EmailService : utilise
    AuthService --> RBACValidator : utilise
```

---

## Légende

| Symbole | Signification |
|---------|---------------|
| 👤 | Acteur (utilisateur) |
| ⚛️ | Frontend React |
| 🔌 | API Express |
| 🗄️ | Base de données MongoDB |
| 📧 | Service d'email |
| 🔔 | Système de notifications |
| ✅ | Succès |
| ❌ | Erreur |
| `<<include>>` | Relation d'inclusion |
| `<<extend>>` | Relation d'extension |

---

**Fin des diagrammes UML — Plateforme GESTION**
