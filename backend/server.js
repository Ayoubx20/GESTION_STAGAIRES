const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ==================== SÉCURITÉ ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
};

app.use(cors(corsOptions));

// ==================== RATE LIMITING ====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==================== LOGGING ====================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==================== BODY PARSER ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== STATIC FILES ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true
}));

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI is not defined in .env file');
    }

    console.log('🔄 Connecting to MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('\n✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(`📦 Models: ${Object.keys(conn.models).length}\n`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\n💡 Vérifiez que:');
    console.log('   1. Votre URI MongoDB Atlas est correct');
    console.log('   2. Votre IP est autorisée dans MongoDB Atlas');
    console.log('   3. Le mot de passe est correct\n');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing in development mode without database...\n');
      return null;
    }
    
    process.exit(1);
  }
};

connectDB();

// ==================== TEST ROUTES ====================
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

// Health check détaillé
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthData = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development', // CORRIGÉ: ligne dupliquée supprimée
    database: {
      status: dbStatus[dbState] || 'unknown',
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      models: Object.keys(mongoose.connection.models).length
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    }
  };

  res.json(healthData);
});

// ==================== API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/interns', require('./routes/interns'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/settings', require('./routes/settings'));

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n❌ Error:', err.message);
  console.error('📍 Path:', req.originalUrl);
  console.error('📝 Method:', req.method);
  console.error('🔍 Stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Cette valeur existe déjà',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Quelque chose s\'est mal passé!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = async () => {
  console.log('\n🔄 Fermeture gracieuse du serveur...');
  
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Connexion MongoDB fermée');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 SERVEUR DÉMARRÉ`);
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api`);
  console.log(`🔧 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('='.repeat(50) + '\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé`);
  } else {
    console.error('❌ Erreur serveur:', error);
  }
  process.exit(1);
});

module.exports = app;