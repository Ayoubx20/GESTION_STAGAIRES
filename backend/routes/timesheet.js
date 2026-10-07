const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Timesheet = require('../models/Timesheet');

// ─── Admin guard middleware ────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'supervisor'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
  }
  next();
};

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
      { returnDocument: 'after', upsert: true }
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

// @desc    [ADMIN] Obtenir tous les pointages de tous les utilisateurs
// @route   GET /api/timesheet/admin/all
// @access  Admin / Supervisor
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const timesheets = await Timesheet.find({})
      .populate('user', 'name email role department isActive')
      .lean();

    const result = timesheets.map(ts => ({
      user: ts.user,
      days: ts.days || {},
      updatedAt: ts.updatedAt
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erreur GET admin/all timesheets:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    [ADMIN] Obtenir le pointage d'un utilisateur spécifique
// @route   GET /api/timesheet/admin/:userId
// @access  Admin / Supervisor
router.get('/admin/:userId', auth, adminOnly, async (req, res) => {
  try {
    const timesheet = await Timesheet.findOne({ user: req.params.userId })
      .populate('user', 'name email role department')
      .lean();

    if (!timesheet) {
      return res.json({ success: true, data: { days: {}, user: null } });
    }

    res.json({ success: true, data: { days: timesheet.days || {}, user: timesheet.user, updatedAt: timesheet.updatedAt } });
  } catch (error) {
    console.error('❌ Erreur GET admin/:userId timesheet:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
