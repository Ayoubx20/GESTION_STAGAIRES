const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Ce compte a été désactivé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
    }
    
    // Pour une erreur de base de données ou autre, on renvoie une 500
    // pour éviter de déconnecter l'utilisateur par erreur
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification de l\'authentification' 
    });
  }
};