const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    const user = await User.create({
      email,
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
      user: { id: user._id, email, firstName, lastName, role }
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

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { firstName, lastName, email, role, phone, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'Non trouvé' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.role = role || user.role;
    user.phone = phone || user.phone;

    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    // Profil stagiaire automatique si le rôle devient stagiaire
    if (user.role === 'intern') {
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
          console.log(`✅ Profil stagiaire crée (update) pour ${user.email}`);
        }
      } catch (err) {
        console.error('Erreur creation profil stagiaire auto (update):', err);
      }
    } else {
      // Si le rôle n'est plus stagiaire, on supprime le profil stagiaire
      try {
        const Intern = require('../models/Intern');
        await Intern.findOneAndDelete({ user: user._id });
        console.log(`🧹 Profil stagiaire retiré pour ${user.email} (nouveau rôle: ${user.role})`);
      } catch (err) {
        console.error('Erreur suppression profil stagiaire:', err);
      }
    }

    res.json({ success: true, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { returnDocument: 'after' }).select('-password');
    
    // Si c'est un stagiaire, on synchronise son statut de stage
    if (user.role === 'intern') {
      const Intern = require('../models/Intern');
      await Intern.findOneAndUpdate(
        { user: user._id },
        { status: isActive ? 'active' : 'terminated' }
      );
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    Get user settings
// @route   GET /api/users/:id/settings
// @access  Private/Admin
router.get('/:id/settings', auth, async (req, res) => {
  try {
    const UserSettings = require('../models/UserSettings');
    let settings = await UserSettings.findOne({ user: req.params.id });
    if (!settings) {
      settings = await UserSettings.create({ user: req.params.id });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    Update user settings
// @route   PUT /api/users/:id/settings
// @access  Private/Admin
router.put('/:id/settings', auth, async (req, res) => {
  try {
    const UserSettings = require('../models/UserSettings');
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.params.id },
      { $set: req.body },
      { returnDocument: 'after', upsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;