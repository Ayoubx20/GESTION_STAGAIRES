const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Evaluation = require('../models/Evaluation');
const Intern = require('../models/Intern');
const Team = require('../models/Team');

const privileged = (req, res, next) => {
  if (['admin', 'supervisor'].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: 'Accès refusé' });
};

async function mayReadIntern(user, intern) {
  if (user.role === 'admin') return true;
  if (user.role === 'intern') return String(intern.user) === String(user.id);
  if (user.role !== 'supervisor') return false;
  if (String(intern.supervisor) === String(user.id)) return true;
  return Boolean(await Team.exists({ supervisor: user.id, interns: intern._id }));
}

function validEvaluationFields(body) {
  if (body.status !== undefined && !['draft', 'submitted', 'reviewed'].includes(body.status)) return false;
  if (body.ratings !== undefined && (!Array.isArray(body.ratings) || body.ratings.length > 30)) return false;
  for (const field of ['feedback', 'period']) {
    if (body[field] !== undefined && (!body[field] || typeof body[field] !== 'object' || Array.isArray(body[field]))) return false;
  }
  for (const field of ['goals', 'nextPeriodGoals']) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > 50)) return false;
  }
  return true;
}

// An intern may read only their own evaluation; supervisors are scoped to current assignments.
router.get('/intern/:internId', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.internId)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    const intern = await Intern.findById(req.params.internId);
    if (!intern) return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    if (!await mayReadIntern(req.user, intern)) return res.status(403).json({ success: false, message: 'Accès refusé' });

    const evaluations = await Evaluation.find({ intern: intern._id })
      .populate('supervisor', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, evaluations });
  } catch (error) {
    console.error('Evaluation lookup failed:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/', [auth, privileged], async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.body.intern)) return res.status(400).json({ success: false, message: 'Stagiaire invalide' });
    if (!validEvaluationFields(req.body)) return res.status(400).json({ success: false, message: 'Données d’évaluation invalides' });
    const intern = await Intern.findById(req.body.intern);
    if (!intern) return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    if (req.user.role === 'supervisor' && !await mayReadIntern(req.user, intern)) return res.status(403).json({ success: false, message: 'Stagiaire hors de votre périmètre' });

    const { period, ratings, feedback, goals, nextPeriodGoals, status } = req.body;
    const evaluation = await Evaluation.create({
      intern: intern._id,
      supervisor: req.user.id,
      period,
      ratings,
      feedback,
      goals,
      nextPeriodGoals,
      status
    });
    res.status(201).json({ success: true, evaluation });
  } catch (error) {
    console.error('Evaluation creation failed:', error.message);
    res.status(400).json({ success: false, message: 'Données d’évaluation invalides' });
  }
});

router.put('/:id', [auth, privileged], async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    if (!validEvaluationFields(req.body)) return res.status(400).json({ success: false, message: 'Données d’évaluation invalides' });
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Évaluation non trouvée' });
    const intern = await Intern.findById(evaluation.intern);
    if (!intern) return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    if (req.user.role === 'supervisor' && !await mayReadIntern(req.user, intern)) return res.status(403).json({ success: false, message: 'Accès refusé' });

    for (const field of ['period', 'ratings', 'feedback', 'goals', 'nextPeriodGoals', 'status']) {
      if (req.body[field] !== undefined) evaluation[field] = req.body[field];
    }
    await evaluation.save();
    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Evaluation update failed:', error.message);
    res.status(400).json({ success: false, message: 'Données d’évaluation invalides' });
  }
});

module.exports = router;
