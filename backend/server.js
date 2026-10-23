const express = require('express');
// Deployment fix: 2026-03-09T18:05:00Z
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { createTrustedOrigins, isAllowedOrigin } = require('./utils/originPolicy');

// ============================================
// 1. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
// ============================================
// On charge .env s'il existe (utile en local). Sur Render, les variables sont injectées directement.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const isProd = process.env.NODE_ENV === 'production';
console.log(`🌍 Mode: ${isProd ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);

// ============================================
// 2. VÉRIFICATION DES VARIABLES CRITIQUES
// ============================================
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
    if (isProd) {
        console.error('❌ Arrêt du serveur : variables critiques manquantes en production.');
        process.exit(1);
    }
}

// ============================================
// 3. INITIALISATION DE L'APPLICATION
// ============================================
const app = express();

// ============================================
// 4. MIDDLEWARES DE SÉCURITÉ ET PERFORMANCE
// ============================================
app.use(helmet({
    hsts: { maxAge: 31536000, includeSubDomains: false },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            formAction: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: [
                "'self'",
                "https://quizzapi.jomoreschi.fr",
                 "https://gestion-brown.vercel.app",
                "https://gestion-stagiaire-backend.onrender.com"
            ],
            frameAncestors: ["'self'"], // Same as X-Frame-Options SAMEORIGIN
        },
    },
    xFrameOptions: { action: 'sameorigin' }, // Aligns with requested X-Frame-Options: SAMEORIGIN
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Set Permissions-Policy header
app.use((req, res, next) => {
    res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );
    next();
});
app.use(compression());

// Parser le JSON et les données URL-encodées
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// 5. CONFIGURATION CORS DYNAMIQUE
// ============================================
const allowedOrigins = [
    'https://frontend-five-drab-18.vercel.app',
    'https://gestion-brown.vercel.app',
    'https://gestion-stagiaire-backend.onrender.com',
    'capacitor://localhost',
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL
].filter(Boolean);

const trustedOrigins = createTrustedOrigins(allowedOrigins, isProd);

// CORS alone does not stop a browser from sending simple cross-site form requests.
app.use((req, res, next) => {
    if (!isProd || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('Origin');
    const fetchSite = req.get('Sec-Fetch-Site');
    const cookieSessionWithoutSameOriginContext = Boolean(req.cookies?.token) && !origin && fetchSite !== 'same-origin';
    if ((origin && !isAllowedOrigin(origin, trustedOrigins, isProd)) || (!origin && fetchSite === 'cross-site') || cookieSessionWithoutSameOriginContext) {
        return res.status(403).json({ success: false, message: 'Origine non autorisée' });
    }
    next();
});

const corsOptions = {
    origin: function (origin, callback) {
        const isAllowed = isAllowedOrigin(origin, trustedOrigins, isProd);

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('⚠️ Origine bloquée par CORS:', origin);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
};

app.use(cors(corsOptions));

// ============================================
// 6. CONNEXION À MONGODB
// ============================================
const connectDB = async () => {
    try {
        console.log('🔄 Connexion à MongoDB...');

        // Mongoose 6+ n'a plus besoin de useNewUrlParser ou useUnifiedTopology
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB connecté : ${conn.connection.name}`);

        mongoose.connection.on('error', err => console.error('❌ Erreur MongoDB:', err));
        mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB déconnecté.'));

    } catch (error) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        if (isProd) {
            console.error('❌ Arrêt critique du serveur en production');
            process.exit(1);
        }
    }
};

connectDB();

// ============================================
// 7. ROUTES DE BASE ET SANTÉ
// ============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Gestion Stagiaire opérationnelle',
        version: '1.0.1',
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        render: !!process.env.RENDER
    });
});

// ============================================
// 8. ROUTES API
// ============================================
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/interns', require('./routes/interns'));
    app.use('/api/tasks', require('./routes/tasks'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/stats', require('./routes/stats'));
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/error-reports', require('./routes/errorReports'));
    app.use('/api/evaluations', require('./routes/evaluations'));
    app.use('/api/settings', require('./routes/settings'));
    app.use('/api/teams', require('./routes/teams'));
    app.use('/api/timesheet', require('./routes/timesheet'));
    app.use('/api/ai', require('./routes/ai'));

    // CVs and personal documents are served only by authenticated API routes.
    app.use('/api/uploads', require('./routes/uploads'));

    console.log('✅ Routes chargées');
} catch (error) {
    console.error('❌ Erreur routes:', error.message);
}

// ============================================
// 9. GESTION DES ERREURS
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Erreur application:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur interne du serveur',
        error: isProd ? undefined : err.stack
    });
});

// ============================================
// 10. DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 SERVEUR PRÊT SUR LE PORT ${PORT}`);
    console.log(`🌍 URL Render: ${process.env.RENDER_EXTERNAL_URL || 'Local'}`);
    console.log('--------------------------------------------------');
});

// ============================================
// 11. ARRÊT GRACIEUX
// ============================================
const gracefulShutdown = () => {
    console.log('🔄 Fermeture du serveur...');
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            console.log('✅ Connexions fermées');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
