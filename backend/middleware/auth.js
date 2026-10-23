const jwt = require('jsonwebtoken');
const User = require('../models/User');

function clearSessionCookie(res) {
  if (typeof res.clearCookie === 'function') {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
  }
}

module.exports = async (req, res, next) => {
  try {
    let token;
    
    // Support dual modes: Cookie (preferred) or Bearer Token
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')) {
      token = req.header('Authorization').replace('Bearer ', '');
    }
    
    if (!token || token === 'none' || token === 'undefined') {
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
      clearSessionCookie(res);
      return res.status(401).json({ 
        success: false, 
        message: 'Ce compte a été désactivé' 
      });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      clearSessionCookie(res);
      return res.status(403).json({
        success: false,
        message: 'Ce compte est en attente d’approbation'
      });
    }

    // Incrementing tokenVersion revokes all previously issued access tokens.
    if (Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) {
      clearSessionCookie(res);
      return res.status(401).json({ success: false, message: 'Session expirée. Veuillez vous reconnecter.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      clearSessionCookie(res);
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
