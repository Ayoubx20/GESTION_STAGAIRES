const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');

const rolePageAccess = {
  intern: ['dashboard', 'teams', 'tasks', 'timesheet', 'my-documents', 'search', 'binary', 'profile', 'settings'],
  supervisor: ['dashboard', 'interns', 'teams', 'tasks', 'timesheet', 'admin-timesheet', 'reports', 'search', 'binary', 'profile', 'settings']
};

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Admin creation route
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Non autorisé' });
    const { email, password, firstName, lastName, role, phone } = req.body;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Email ou mot de passe invalide' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      role,
      phone,
      isActive: true,
      isApproved: true
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: { id: user._id, email: normalizedEmail, firstName, lastName, role }
    });

    // Profil stagiaire automatique si le rôle est stagiaire
    if (role === 'intern') {
      try {
        const Intern = require('../models/Intern');
        const existingProfile = await Intern.findOne({ user: user._id });
        if (!existingProfile) {
          await Intern.create({
            user: user._id,
            studentId: `STG-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
            school: 'Non défini',
            major: 'Non défini',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            status: 'active'
          });
          console.log(`✅ Profil stagiaire créé pour ${user.email}`);
        }
      } catch (err) {
        console.error('Erreur creation profil stagiaire auto:', err);
      }
    }
  } catch (error) {
    console.error('Erreur creation utilisateur:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
      if (req.user.role !== 'supervisor') return res.status(403).json({ success: false, message: 'Accès non autorisé' });
      const Intern = require('../models/Intern');
      const Team = require('../models/Team');
      const profile = await Intern.findOne({ user: req.params.id });
      const scoped = profile && (String(profile.supervisor) === String(req.user.id) || await Team.exists({ supervisor: req.user.id, interns: profile._id }));
      if (!scoped) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Update profile fields. Role and account-control changes use admin-only routes.
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Identifiant utilisateur invalide' });
    }
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, message: 'Données utilisateur invalides' });
    }
    const isSelf = req.user.id === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const protectedFields = ['role', 'isApproved', 'isActive', 'pageAccess', 'allowedPages', 'lastLogin', 'resetPasswordToken', 'resetPasswordExpires'];
    if (protectedFields.some((field) => Object.prototype.hasOwnProperty.call(body, field)) ||
        (isSelf && Object.prototype.hasOwnProperty.call(body, 'password'))) {
      return res.status(400).json({ success: false, message: 'Profile updates cannot change role or account controls' });
    }

    for (const field of ['firstName', 'lastName']) {
      if (body[field] !== undefined &&
          (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 100)) {
        return res.status(400).json({ success: false, message: `${field} invalide` });
      }
    }
    if (body.email !== undefined &&
        (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) {
      return res.status(400).json({ success: false, message: 'Adresse email invalide' });
    }
    if (body.phone !== undefined &&
        (typeof body.phone !== 'string' || body.phone.length > 40)) {
      return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide' });
    }
    if (body.password !== undefined &&
        (typeof body.password !== 'string' || body.password.length < 6 || body.password.length > 128)) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir entre 6 et 128 caractères' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    for (const field of ['firstName', 'lastName', 'email', 'phone']) {
      if (body[field] !== undefined) user[field] = field === 'email' ? body[field].trim().toLowerCase() : body[field].trim();
    }

    // Keep the existing administrator ability to set another user's password.
    if (isAdmin && !isSelf && body.password !== undefined) {
      user.password = body.password;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();
    res.json({ success: true, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Un utilisateur avec cette adresse email existe déjà' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Informations utilisateur invalides' });
    }
    console.error('User update failed:', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l’utilisateur' });
  }
});

// Change a user's role through a separate administrator-only operation.
router.patch('/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { role } = req.body;
    if (!['admin', 'supervisor', 'intern'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousRole = user.role;
    user.role = role;
    if (role !== previousRole) user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (user.role !== previousRole && user.pageAccess === 'custom') {
      const rolePages = rolePageAccess[user.role] || [];
      user.allowedPages = user.allowedPages.filter((page) => rolePages.includes(page));
      if (user.allowedPages.length === 0) user.pageAccess = 'all';
    }

    await user.save();

    if (user.role !== previousRole) {
      try {
        const Intern = require('../models/Intern');
        if (user.role === 'intern') {
          const existingProfile = await Intern.findOne({ user: user._id });
          if (!existingProfile) {
            await Intern.create({
              user: user._id,
              studentId: `STG-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
              school: 'Non d\u00e9fini',
              major: 'Non d\u00e9fini',
              startDate: new Date(),
              endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
              status: 'active'
            });
          }
        } else {
          await Intern.findOneAndDelete({ user: user._id });
        }
      } catch (err) {
        console.error('Failed to synchronize intern profile after role change:', err);
      }
    }

    res.json({ success: true, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
// Toggle user status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'Statut invalide' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    user.isActive = isActive;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    
    // Si c'est un stagiaire, on synchronise son statut de stage
    if (user.role === 'intern') {
      const Intern = require('../models/Intern');
      await Intern.findOneAndUpdate(
        { user: user._id },
        { status: isActive ? 'active' : 'terminated' }
      );
    }
    
    res.json({ success: true, user: user.toObject({ transform: (_, ret) => { delete ret.password; delete ret.resetPasswordToken; delete ret.resetPasswordAttempts; return ret; } }) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.patch('/:id/page-access', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { pageAccess, allowedPages = [] } = req.body;
    if (!['all', 'custom', 'dashboard', 'timesheet'].includes(pageAccess)) {
      return res.status(400).json({ success: false, message: 'Accès de page invalide' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Les administrateurs gardent l’accès à toutes les pages' });
    }

    let pagesToSave = [];
    if (pageAccess === 'custom') {
      const rolePages = rolePageAccess[user.role] || [];
      if (!Array.isArray(allowedPages) || allowedPages.length === 0 || allowedPages.some((page) => !rolePages.includes(page))) {
        return res.status(400).json({ success: false, message: 'Sélection de pages invalide pour ce rôle' });
      }
      pagesToSave = [...new Set(allowedPages)];
    }

    user.pageAccess = pageAccess;
    user.allowedPages = pagesToSave;
    await user.save();
    res.json({ success: true, user: { _id: user._id, pageAccess: user.pageAccess, allowedPages: user.allowedPages } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    Get user settings
// @route   GET /api/users/:id/settings
// @access  Private/Admin
router.get('/:id/settings', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant utilisateur invalide' });
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    const UserSettings = require('../models/UserSettings');
    const userExists = await User.exists({ _id: req.params.id });
    if (!userExists) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.params.id },
      { $setOnInsert: { user: req.params.id } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    console.error('User settings lookup failed:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    Update user settings
// @route   PUT /api/users/:id/settings
// @access  Private/Admin
router.put('/:id/settings', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant utilisateur invalide' });
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    const UserSettings = require('../models/UserSettings');
    const allowedFields = ['language', 'theme', 'timezone', 'dateFormat', 'timeFormat', 'emailNotifications', 'pushNotifications', 'taskReminders', 'internUpdates', 'reportAlerts'];
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({ success: false, message: 'Champ de paramètre non autorisé' });
    }
    const stringFields = ['language', 'theme', 'timezone', 'dateFormat', 'timeFormat'];
    const booleanFields = ['emailNotifications', 'pushNotifications', 'taskReminders', 'internUpdates', 'reportAlerts'];
    if (stringFields.some((field) => body[field] !== undefined &&
          (typeof body[field] !== 'string' || body[field].length > 100)) ||
        booleanFields.some((field) => body[field] !== undefined && typeof body[field] !== 'boolean')) {
      return res.status(400).json({ success: false, message: 'Valeur de paramètre invalide' });
    }
    const userExists = await User.exists({ _id: req.params.id });
    if (!userExists) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const update = Object.fromEntries(allowedFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.params.id },
      { $set: update },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
