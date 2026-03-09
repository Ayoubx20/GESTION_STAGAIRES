const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Evaluation = require('../models/Evaluation');
const Intern = require('../models/Intern');

// Middleware to check if user is admin or supervisor
const isPrivileged = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'supervisor') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Accès refusé' });
  }
};

// @route   GET api/evaluations/intern/:internId
// @desc    Get all evaluations for an intern
// @access  Private
router.get('/intern/:internId', auth, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ intern: req.params.internId })
      .populate('supervisor', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, evaluations });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/evaluations
// @desc    Create a new evaluation
// @access  Private (Admin/Supervisor)
router.post('/', [auth, isPrivileged], async (req, res) => {
  try {
    const { intern, period, ratings, feedback, goals, nextPeriodGoals, status } = req.body;

    const newEvaluation = new Evaluation({
      intern,
      supervisor: req.user.id,
      period,
      ratings,
      feedback,
      goals,
      nextPeriodGoals,
      status
    });

    const evaluation = await newEvaluation.save();
    res.json({ success: true, evaluation });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/evaluations/:id
// @desc    Update an evaluation
// @access  Private (Admin/Supervisor)
router.put('/:id', [auth, isPrivileged], async (req, res) => {
  try {
    const { ratings, feedback, goals, nextPeriodGoals, status } = req.body;

    let evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation non trouvée' });
    }

    // Check if the supervisor is the one who created it or an admin
    if (evaluation.supervisor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    evaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      { $set: { ratings, feedback, goals, nextPeriodGoals, status } },
      { new: true }
    );

    res.json({ success: true, evaluation });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
