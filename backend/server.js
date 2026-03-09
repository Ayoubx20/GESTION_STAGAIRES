const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet'); // Pour la sécurité (à installer)
const compression = require('compression'); // Pour les performances (à installer)

// ============================================
// 1. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
// ============================================
// En développement, charger le fichier .env
// En production, utiliser les variables système (Render)
if (process.env.NODE_ENV !== 'production') {
  // Nous sommes en développement local
  const envPath = path.join(__dirname, '.env');
  dotenv.config({ path: envPath });
  console.log('📁 Fichier .env chargé (développement)');
} else {
  // Nous sommes sur Render (production)
  console.log('🌍 Mode production: utilisation des variables Render');
  // Pas besoin d'appeler dotenv, les variables sont déjà dans process.env
}

// ============================================
// 2. VÉRIFICATION DES VARIABLES CRITIQUES
// ============================================
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
  console.error('❌ Le serveur ne peut pas démarrer sans ces variables.');
  process.exit(1); // Arrêter le processus si des variables sont manquantes
}

console.log('🔍 Variables d\'environnement:');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ présente' : '❌ manquante');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ présent' : '❌ manquant');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'développement');
console.log('- PORT:', process.env.PORT || '5000 (défaut)');

// ============================================
// 3. INITIALISATION DE L'APPLICATION
// ============================================
const app = express();

// ============================================
// 4. MIDDLEWARES DE SÉCURITÉ ET PERFORMANCE
// ============================================
// Helmet pour la sécurité (protection contre les vulnérabilités courantes)
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour faciliter le développement
}));

// Compression des réponses pour de meilleures performances
app.use(compression());

// ============================================
// 5. CONFIGURATION CORS AMÉLIORÉE
// ============================================
// Définir les origines autorisées
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://frontend-five-drab-18.vercel.app', // Votre frontend Vercel
  'https://gestion-stagiaire-backend.onrender.com', // Votre backend Render
  process.env.FRONTEND_URL, // Pour plus de flexibilité
].filter(Boolean); // Supprimer les valeurs undefined

const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (comme les appels depuis Postman ou curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      // Origine autorisée ou en développement
      callback(null, true);
    } else {
      console.log('❌ Origine bloquée par CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important pour les cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 heures - cache les résultats des requêtes OPTIONS
};

app.use(cors(corsOptions));

// Middleware pour parser le JSON et les données URL-encodées
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 6. CONNEXION À MONGODB AVEC GESTION D'ERREURS
// ============================================
const connectDB = async () => {
  try {
    console.log('🔄 Tentative de connexion à MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
      socketTimeoutMS: 45000, // Timeout socket après 45 secondes
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);

    // Gestion des erreurs de connexion après l'initialisation
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB après connexion:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB déconnecté. Tentative de reconnexion...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnecté avec succès');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('💡 Vérifiez que:');
    console.error('   1. Votre URI MongoDB Atlas est correct');
    console.error('   2. Votre IP est autorisée dans MongoDB Atlas (0.0.0.0/0 pour Render)');
    console.error('   3. Le mot de passe est correct');
    console.error('   4. Le cluster MongoDB Atlas est en ligne');

    // En production, on arrête le processus si la base n'est pas accessible
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Arrêt du serveur en production - impossible de se connecter à MongoDB');
      process.exit(1);
    }
  }
};

// Exécuter la connexion
connectDB();

// ============================================
// 7. ROUTES DE TEST ET SANTÉ
// ============================================
// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue à Gestion Stagiaire API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Route de santé détaillée
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus[dbState] || 'unknown',
      state: dbState,
      name: mongoose.connection.name || null
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

// ============================================
// 8. ROUTES API
// ============================================
// Importer les routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/interns', require('./routes/interns'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/departments', require('./routes/departments'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/admin', require('./routes/admin'));

  // Route pour servir les fichiers uploadés (si vous avez l'upload de CV)
  app.use('/uploads', require('./routes/uploads'));

  console.log('✅ Routes API chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error.message);
}

// ============================================
// 9. GESTION DES ERREURS 404
// ============================================
// Route pour les chemins non trouvés
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// 10. MIDDLEWARE DE GESTION DES ERREURS
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Erreur non gérée:', err.stack);

  const statusCode = err.status || 500;
  const message = err.message || 'Une erreur interne est survenue';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 11. GESTION DES REJETS DE PROMESSE NON GÉRÉS
// ============================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Ne pas arrêter le serveur, mais logger l'erreur
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // En production, on peut vouloir arrêter le processus et redémarrer
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Arrêt du serveur à cause d\'une exception non gérée');
    process.exit(1);
  }
});

// ============================================
// 12. DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS');
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api`);
  console.log(`🔧 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Frontend autorisés:`, allowedOrigins.filter(o => o.includes('vercel')));
  console.log('='.repeat(50) + '\n');
});

// ============================================
// 13. GESTION DE L'ARRÊT GRACIEUX
// ============================================
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('🔄 Réception du signal d\'arrêt, fermeture des connexions...');

  server.close(() => {
    console.log('✅ Serveur HTTP fermé');

    mongoose.connection.close(false, () => {
      console.log('✅ Connexion MongoDB fermée');
      process.exit(0);
    });
  });

  // Forcer l'arrêt après 10 secondes
  setTimeout(() => {
    console.error('❌ Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
}

module.exports = app; // Pour les tests éventuels