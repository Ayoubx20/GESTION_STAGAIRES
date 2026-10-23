const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const fs = require('fs').promises; // Utiliser la version promises pour éviter les blocages
const path = require('path');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../config/email');

// Generate JWT Token
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('📝 Tentative d\'inscription:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Vérification plus robuste de l'email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      // Public registration must never grant a privileged role from client input.
      role: 'intern',
      phone: phone ? phone.trim() : undefined,
      isActive: true,
      isApproved: false
    });

    // Notifier tous les administrateurs
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'Nouveau compte',
        message: `${user.firstName} ${user.lastName} vient de s'inscrire (${user.role}).`,
        type: 'info'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Erreur notification admin:', notifErr);
    }

    console.log('✅ Inscription reçue et en attente d’approbation');

    res.status(201).json({
      success: true,
      message: 'Inscription reçue. Votre compte doit être approuvé avant connexion.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('❌ ERREUR SERVEUR DANS REGISTER:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('📝 Tentative de login:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Recherche avec email normalisé
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).collation({ locale: 'en', strength: 2 }).select('+password');

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('👤 Utilisateur trouvé:', user.email);

    const isMatch = await user.comparePassword(password);
    console.log('🔑 Mot de passe valide:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifications du compte
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Ce compte a été désactivé'
      });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est en attente d\'approbation par un administrateur'
      });
    }

    // Parallelize: update lastLogin + fetch/create settings simultaneously
    const UserSettings = require('../models/UserSettings');
    const token = generateToken(user._id, user.tokenVersion || 0);

    const [, settings] = await Promise.all([
      User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }),
      UserSettings.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      )
    ]);

    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    console.log('✅ Login réussi pour:', email);

    const response = {
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        pageAccess: user.pageAccess || 'all',
        allowedPages: user.allowedPages || [],
        isApproved: user.isApproved,
        isActive: user.isActive,
        settings: {
          language: settings?.language,
          theme: settings?.theme
        }
      }
    };
    // Native Capacitor clients need a bearer token; browsers use only the HttpOnly cookie.
    if (req.get?.('Origin') === 'capacitor://localhost') response.token = token;
    res.status(200).cookie('token', token, cookieOptions).json(response);

  } catch (error) {
    console.error('❌ ERREUR SERVEUR DANS LOGIN:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Fetch user settings (upsert in one round-trip)
    const UserSettings = require('../models/UserSettings');
    const settings = await UserSettings.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { user: user._id } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        pageAccess: user.pageAccess || 'all',
        allowedPages: user.allowedPages || [],
        phone: user.phone,
        isActive: user.isActive,
        isApproved: user.isApproved,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        settings: {
          language: settings.language,
          theme: settings.theme
        }
      }
    });
  } catch (error) {
    console.error('❌ ERREUR SERVEUR DANS GETME:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

// @desc    Register with CV (candidature)
// @route   POST /api/auth/register-with-cv
// @access  Public
exports.registerWithCV = async (req, res) => {
  try {
    console.log('📝 Nouvelle candidature avec CV');

    const { firstName, lastName, email, password, phone,
      appliedFor, education, skills, experience, startDate } = req.body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !password) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être remplis'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CV requis'
      });
    }

    // Vérifier les types de fichiers acceptés
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Format de fichier non supporté. Utilisez PDF ou DOC/DOCX'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'intern',
      phone: phone ? phone.trim() : undefined,
      isActive: false,
      isApproved: false
    });

    // Préparer les données de candidature
    const applicationData = {
      user: user._id,
      cvUrl: `/uploads/${req.file.filename}`,
      cvName: req.file.originalname,
      status: 'pending',
      appliedFor: appliedFor || 'internship',
      startDate: startDate ? new Date(startDate) : undefined,
      skills: skills ? skills.split(',').map(s => s.trim()) : []
    };

    // Ajouter education et experience si fournis
    if (education) {
      try {
        applicationData.education = JSON.parse(education);
      } catch (e) {
        console.warn('Education parsing error:', e);
      }
    }

    if (experience) {
      try {
        applicationData.experience = JSON.parse(experience);
      } catch (e) {
        console.warn('Experience parsing error:', e);
      }
    }

    // Créer la candidature
    const Application = require('../models/Application');
    const application = await Application.create(applicationData);

    // Notifier tous les administrateurs
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'Nouvelle Candidature avec CV',
        message: `${user.firstName} ${user.lastName} a soumis une candidature pour ${appliedFor || 'un stage'}.`,
        type: 'info'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Erreur notification admin (CV):', notifErr);
    }

    console.log('✅ Candidature enregistrée pour:', email);

    res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès. En attente de validation.',
      applicationId: application._id
    });

  } catch (error) {
    console.error('❌ ERREUR DANS REGISTERWITHCV:', error);

    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('❌ Erreur lors de la suppression du fichier:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = { success: true, message: 'Si cette adresse correspond à un compte, un code de réinitialisation sera envoyé.' };
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordRequestedAt');
    if (user) {
      if (user.resetPasswordRequestedAt && Date.now() - user.resetPasswordRequestedAt.getTime() < 60 * 1000) {
        return res.status(200).json(genericResponse);
      }
      const resetCode = crypto.randomInt(100000, 1000000).toString();
      user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      user.resetPasswordAttempts = 0;
      user.resetPasswordRequestedAt = new Date();
      await user.save({ validateBeforeSave: false });

      try {
        const sent = await sendPasswordResetEmail(user.email, resetCode);
        if (!sent) {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          user.resetPasswordRequestedAt = undefined;
          await user.save({ validateBeforeSave: false });
        }
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordRequestedAt = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('Password reset email delivery failed.');
      }
    }
    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Password reset request failed.');
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// @desc    Verify Reset Code
// @route   POST /api/auth/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email et code sont requis' });
    }

    // Obtenir le code haché
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(code.toString().trim())
      .digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
      resetPasswordAttempts: { $lt: 5 }
    }).select('+resetPasswordAttempts');

    if (!user) {
      await User.updateOne(
        { email: email.toLowerCase().trim(), resetPasswordExpires: { $gt: Date.now() }, $or: [{ resetPasswordAttempts: { $lt: 5 } }, { resetPasswordAttempts: { $exists: false } }] },
        { $inc: { resetPasswordAttempts: 1 } }
      );
      await User.updateOne(
        { email: email.toLowerCase().trim(), resetPasswordExpires: { $gt: Date.now() }, resetPasswordAttempts: { $gte: 5 } },
        { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
      );
      return res.status(400).json({ success: false, message: 'Le code de vérification est invalide ou a expiré' });
    }

    res.status(200).json({ success: true, message: 'Code valide' });
  } catch (error) {
    console.error('❌ ERREUR DANS VERIFYRESETCODE:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// @desc    Reset Password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Email, code et nouveau mot de passe sont requis' });
    }

    // Obtenir le code haché
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(code.toString().trim())
      .digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
      resetPasswordAttempts: { $lt: 5 }
    }).select('+resetPasswordAttempts');

    if (!user) {
      await User.updateOne(
        { email: email.toLowerCase().trim(), resetPasswordExpires: { $gt: Date.now() }, $or: [{ resetPasswordAttempts: { $lt: 5 } }, { resetPasswordAttempts: { $exists: false } }] },
        { $inc: { resetPasswordAttempts: 1 } }
      );
      await User.updateOne(
        { email: email.toLowerCase().trim(), resetPasswordExpires: { $gt: Date.now() }, resetPasswordAttempts: { $gte: 5 } },
        { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
      );
      return res.status(400).json({ success: false, message: 'Le code de réinitialisation est invalide ou a expiré' });
    }

    // Atomically consume the reset token so concurrent submissions cannot both succeed.
    const claimedUser = await User.findOneAndUpdate(
      { _id: user._id, resetPasswordToken, resetPasswordExpires: { $gt: Date.now() }, resetPasswordAttempts: { $lt: 5 } },
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1, resetPasswordRequestedAt: 1 }, $set: { resetPasswordAttempts: 0 }, $inc: { tokenVersion: 1 } },
      { returnDocument: 'after' }
    );
    if (!claimedUser) return res.status(400).json({ success: false, message: 'Le code de réinitialisation est invalide ou a expiré' });

    claimedUser.password = password;
    await claimedUser.save();

    res.status(200).json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Password reset failed.');
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
