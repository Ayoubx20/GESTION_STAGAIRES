const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Intern = require('../models/Intern');
const User = require('../models/User');
const mongoose = require('mongoose');

function validTeamFields(body, requireName = false) {
  const allowed = new Set(['name', 'description', 'project', 'interns']);
  if (Object.keys(body).some((field) => !allowed.has(field))) return false;
  if (requireName && (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120)) return false;
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120)) return false;
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 2000)) return false;
  if (body.project !== undefined && (typeof body.project !== 'string' || body.project.length > 200)) return false;
  if (body.interns !== undefined && (!Array.isArray(body.interns) || body.interns.length > 100)) return false;
  return true;
}

async function normalizeInternIds(internIds, supervisorId = null) {
  if (!Array.isArray(internIds)) return [];
  const uniqueIds = [...new Set(internIds.map(String))];
  if (uniqueIds.some((id) => !mongoose.isValidObjectId(id))) return null;
  const interns = await Intern.find({ _id: { $in: uniqueIds } }).select('_id user supervisor').lean();
  if (interns.length !== uniqueIds.length) return null;
  const users = await User.find({ _id: { $in: interns.map((intern) => String(intern.user)) }, role: 'intern' }).select('_id').lean();
  if (users.length !== uniqueIds.length) return null;
  if (supervisorId) {
    const existingTeams = await Team.find({ supervisor: supervisorId }).select('interns').lean();
    const scopedIds = new Set([
      ...interns.filter((intern) => String(intern.supervisor) === String(supervisorId)).map((intern) => String(intern._id)),
      ...existingTeams.flatMap((team) => (team.interns || []).map(String))
    ]);
    if (uniqueIds.some((id) => !scopedIds.has(id))) return null;
  }
  return uniqueIds;
}

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (!['admin', 'supervisor', 'intern'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    const query = {};
    if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    } else if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user.id });
      if (intern) {
        query.interns = intern._id;
      } else {
        query.interns = null;
      }
    }
    
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
      
    const Task = require('../models/Task');
    
    // Compute stats for each team
    const teamsWithStats = await Promise.all(teams.map(async (teamDoc) => {
      const team = teamDoc.toObject();
      const userIds = team.interns
        .filter(i => i && i.user)
        .map(i => i.user._id);
        
      if (userIds.length > 0) {
        team.totalTasks = await Task.countDocuments({ assignedTo: { $in: userIds } });
        team.completedTasks = await Task.countDocuments({ assignedTo: { $in: userIds }, status: 'completed' });
        team.pendingValidationTasks = await Task.countDocuments({ assignedTo: { $in: userIds }, status: 'pending_validation' });
      } else {
        team.totalTasks = 0;
        team.completedTasks = 0;
        team.pendingValidationTasks = 0;
      }
      return team;
    }));
      
    res.json({ success: true, teams: teamsWithStats });
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
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    if (!['admin', 'supervisor', 'intern'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
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

    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user.id });
      const isMember = intern && team.interns.some(i => i._id.toString() === intern._id.toString());
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'Non autorisé' });
      }
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
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    if (!validTeamFields(req.body, true)) return res.status(400).json({ success: false, message: 'Données d’équipe invalides' });

    const { name, description, project, interns } = req.body;
    const uniqueInterns = await normalizeInternIds(interns || [], req.user.role === 'supervisor' ? req.user.id : null);
    if (!uniqueInterns) return res.status(400).json({ success: false, message: 'Liste de stagiaires invalide' });

    const team = await Team.create({
      name,
      description,
      project,
      interns: uniqueInterns,
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
    if (!['admin', 'supervisor'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Non autorisé' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    if (!validTeamFields(req.body)) return res.status(400).json({ success: false, message: 'Données d’équipe invalides' });
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Équipe non trouvée' });
    }

    if (req.user.role === 'supervisor' && team.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const update = {};
    for (const field of ['name', 'description', 'project']) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    if (req.body.interns !== undefined) {
      const internIds = await normalizeInternIds(req.body.interns, req.user.role === 'supervisor' ? req.user.id : null);
      if (!internIds) return res.status(400).json({ success: false, message: 'Liste de stagiaires invalide' });
      update.interns = internIds;
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      update,
      { returnDocument: 'after', runValidators: true }
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
    if (!['admin', 'supervisor'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Non autorisé' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
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
