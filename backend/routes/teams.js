const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Intern = require('../models/Intern');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    }
    
    // Admins see all teams
    const teams = await Team.find(query)
      .populate('supervisor', 'firstName lastName email')
      .populate({
        path: 'interns',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 });
      
    res.json({ success: true, teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes' });
  }
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('supervisor', 'firstName lastName email')
      .populate({
        path: 'interns',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Équipe non trouvée' });
    }

    if (req.user.role === 'supervisor' && team.supervisor._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    res.json({ success: true, team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'équipe' });
  }
});

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin & Supervisor)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'intern') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const { name, description, interns } = req.body;

    const team = await Team.create({
      name,
      description,
      interns: interns || [],
      supervisor: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Équipe créée avec succès',
      team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'équipe' });
  }
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Équipe non trouvée' });
    }

    if (req.user.role === 'supervisor' && team.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Équipe mise à jour avec succès',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'équipe' });
  }
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Équipe non trouvée' });
    }

    if (req.user.role === 'supervisor' && team.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await team.deleteOne();

    res.json({ success: true, message: 'Équipe supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'équipe' });
  }
});

module.exports = router;
