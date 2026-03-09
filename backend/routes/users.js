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
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
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
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

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
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;