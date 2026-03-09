const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Settings = require('../models/Settings');
const UserSettings = require('../models/UserSettings');

// @desc    Get all combined settings (Global + Personal)
// @route   GET /api/settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // 1. Get Global Settings
    let globalSettings = await Settings.findOne();
    if (!globalSettings) {
      globalSettings = await Settings.create({});
    }

    // 2. Get User Personal Settings
    let personalSettings = await UserSettings.findOne({ user: req.user.id });
    if (!personalSettings) {
      personalSettings = await UserSettings.create({ user: req.user.id });
    }

    // Combined settings for the frontend
    const settings = {
      ...globalSettings.toObject(),
      ...personalSettings.toObject(),
      _id: personalSettings._id // Use personal ID for the combined object
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// @desc    Update settings (Personal for all, Global for Admin)
// @route   PUT /api/settings
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const settingsData = req.body;

    // Fields that are global (Admin only)
    const globalFields = [
      'companyName', 'companyLogo', 'primaryColor', 'itemsPerPage',
      'twoFactorAuth', 'sessionTimeout', 'passwordExpiry',
      'smtpServer', 'smtpPort', 'smtpUsername', 'smtpPassword',
      'senderEmail', 'senderName'
    ];

    // 1. If Admin, update Global Settings
    if (isAdmin) {
      const globalData = {};
      globalFields.forEach(field => {
        if (settingsData[field] !== undefined) {
          globalData[field] = settingsData[field];
        }
      });

      if (Object.keys(globalData).length > 0) {
        await Settings.findOneAndUpdate({}, globalData, { 
          new: true, 
          upsert: true 
        });
      }
    }

    // 2. Update Personal User Settings (Available to all users)
    const personalFields = [
      'language', 'theme', 'timezone', 'dateFormat', 'timeFormat',
      'emailNotifications', 'pushNotifications', 'taskReminders',
      'internUpdates', 'reportAlerts'
    ];

    const personalData = {};
    personalFields.forEach(field => {
      if (settingsData[field] !== undefined) {
        personalData[field] = settingsData[field];
      }
    });

    const personalSettings = await UserSettings.findOneAndUpdate(
      { user: req.user.id },
      { $set: personalData },
      { new: true, upsert: true, runValidators: true }
    );

    // Get fresh global settings to return combined object
    const finalGlobal = await Settings.findOne();

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings: {
        ...finalGlobal.toObject(),
        ...personalSettings.toObject()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

module.exports = router;
