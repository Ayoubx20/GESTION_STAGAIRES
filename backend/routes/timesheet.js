const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Timesheet = require('../models/Timesheet');

// @desc    Obtenir la feuille de temps de l'utilisateur connecté
// @route   GET /api/timesheet
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const timesheet = await Timesheet.findOne({ user: req.user.id });
    res.json({
      success: true,
      data: timesheet ? timesheet.days : {}
    });
  } catch (error) {
    console.error('❌ Erreur GET timesheet:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération du pointage' });
  }
});

// @desc    Enregistrer la feuille de temps de l'utilisateur connecté
// @route   POST /api/timesheet
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { days } = req.body;
    const timesheet = await Timesheet.findOneAndUpdate(
      { user: req.user.id },
      { days },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      data: timesheet.days
    });
  } catch (error) {
    console.error('❌ Erreur POST timesheet:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la sauvegarde du pointage' });
  }
});

module.exports = router;
