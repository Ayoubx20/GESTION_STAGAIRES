const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const fs = require('fs').promises; // Utiliser la version promises pour éviter les blocages
const path = require('path');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
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

    const { firstName, lastName, email, password, role, phone } = req.body;

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
      role: role || 'intern',
      phone: phone ? phone.trim() : undefined,
      isActive: true,
      isApproved: role === 'admin'
    });

    const token = generateToken(user._id);

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

    console.log('✅ Inscription réussie pour:', email);

    res.status(201).json({
      success: true,
      token,
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
    }).select('+password');
    
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

    // Mise à jour lastLogin sans hook
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = generateToken(user._id);

    // Fetch user settings
    const UserSettings = require('../models/UserSettings');
    let settings = await UserSettings.findOne({ user: user._id });
    if (!settings) {
      settings = await UserSettings.create({ user: user._id });
    }

    console.log('✅ Login réussi pour:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isActive: user.isActive,
        settings: {
          language: settings.language,
          theme: settings.theme
        }
      }
    });

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

    // Fetch user settings
    const UserSettings = require('../models/UserSettings');
    let settings = await UserSettings.findOne({ user: user._id });
    if (!settings) {
      settings = await UserSettings.create({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
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
      message: 'Erreur serveur' 
    });
  }
};