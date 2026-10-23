const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { getTaskUserScope, canAccessTask, canAssignTaskTo } = require('../utils/taskAuthorization');

const managerRoles = new Set(['admin', 'supervisor']);
const editableFields = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'category'];
const validStatuses = new Set(['pending', 'in_progress', 'pending_validation', 'completed', 'overdue', 'cancelled']);

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function pickFields(source, fields) {
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

async function loadAuthorizedTask(req, res) {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Identifiant invalide' });
    return null;
  }
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    return null;
  }
  if (!await canAccessTask(req.user, task)) {
    res.status(403).json({ success: false, message: 'Accès non autorisé' });
    return null;
  }
  return task;
}

// @route GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', status = '', priority = '', assignedTo = '' } = req.query;
    const filters = [];
    const scope = await getTaskUserScope(req.user);
    if (scope !== null) filters.push({ assignedTo: { $in: [...scope] } });

    if (status) {
      if (typeof status !== 'string' || !validStatuses.has(status)) return res.status(400).json({ success: false, message: 'Statut invalide' });
      filters.push({ status });
    }
    if (priority) {
      if (typeof priority !== 'string' || !['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ success: false, message: 'Priorité invalide' });
      filters.push({ priority });
    }
    if (assignedTo) {
      const targetId = assignedTo === 'me' ? String(req.user.id) : assignedTo;
      if (!isValidId(targetId)) return res.status(400).json({ success: false, message: 'Destinataire invalide' });
      filters.push({ assignedTo: targetId });
    }
    if (search) {
      if (typeof search !== 'string') return res.status(400).json({ success: false, message: 'Recherche invalide' });
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.push({ $or: [{ title: new RegExp(escapedSearch, 'i') }, { description: new RegExp(escapedSearch, 'i') }] });
    }

    const query = filters.length ? { $and: filters } : {};
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json({ success: true, count: tasks.length, total, pages: Math.ceil(total / limit), page: parseInt(page), tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
  }
});

// @route GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');
    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    if (!await canAccessTask(req.user, task)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la tâche' });
  }
});

// @route POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    if (!managerRoles.has(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    if (!await canAssignTaskTo(req.user, req.body.assignedTo)) return res.status(403).json({ success: false, message: 'Stagiaire hors de votre périmètre' });

    const task = await Task.create({
      ...pickFields(req.body, ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'category']),
      assignedBy: req.user.id,
      status: 'pending',
      progress: 0
    });
    res.status(201).json({ success: true, message: 'Tâche créée avec succès', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la tâche' });
  }
});

// @route PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!managerRoles.has(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    const task = await loadAuthorizedTask(req, res);
    if (!task) return;

    const update = pickFields(req.body, editableFields);
    if (update.assignedTo !== undefined && !await canAssignTaskTo(req.user, update.assignedTo)) {
      return res.status(403).json({ success: false, message: 'Stagiaire hors de votre périmètre' });
    }
    Object.assign(task, update);
    await task.save();
    res.json({ success: true, message: 'Tâche mise à jour avec succès', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la tâche' });
  }
});

// @route PATCH /api/tasks/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await loadAuthorizedTask(req, res);
    if (!task) return;
    const { status, progress } = req.body;

    if (!validStatuses.has(status) || status === 'pending_validation') {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    if (req.user.role === 'intern') {
      if (String(task.assignedTo) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
      if (['pending_validation', 'completed', 'cancelled'].includes(task.status)) return res.status(403).json({ success: false, message: 'Cette tâche ne peut plus être modifiée par le stagiaire' });
      if (!['pending', 'in_progress', 'completed'].includes(status)) return res.status(403).json({ success: false, message: 'Statut non autorisé' });
      if (status === 'completed') task.status = 'pending_validation';
      else task.status = status;
    } else if (!managerRoles.has(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    } else {
      task.status = status;
    }

    if (progress !== undefined) {
      if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 100) {
        return res.status(400).json({ success: false, message: 'Progression invalide' });
      }
      task.progress = progress;
    }
    if (task.status === 'completed') {
      task.completedAt = Date.now();
      task.progress = 100;
    }
    await task.save();
    res.json({ success: true, message: task.status === 'pending_validation' ? 'Tâche envoyée pour validation au superviseur' : `Statut mis à jour: ${task.status}`, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
  }
});

// @route PATCH /api/tasks/:id/validate
router.patch('/:id/validate', auth, async (req, res) => {
  try {
    if (!managerRoles.has(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    const task = await loadAuthorizedTask(req, res);
    if (!task) return;
    const { decision, feedback } = req.body;
    if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ success: false, message: 'Décision invalide' });
    if (task.status !== 'pending_validation') return res.status(409).json({ success: false, message: 'Cette tâche n’est pas en attente de validation' });

    if (decision === 'approve') {
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = Date.now();
    } else {
      task.status = 'in_progress';
      task.progress = Math.min(task.progress, 90);
    }
    if (feedback) {
      if (typeof feedback !== 'string' || feedback.length > 2000) return res.status(400).json({ success: false, message: 'Commentaire invalide' });
      task.comments.push({ user: req.user.id, text: `[Système] ${decision === 'approve' ? 'Approuvé' : 'Rejeté'} : ${feedback}` });
    }
    await task.save();
    res.json({ success: true, message: decision === 'approve' ? 'Tâche approuvée' : 'Tâche renvoyée pour modification', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la validation' });
  }
});

// @route POST /api/tasks/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await loadAuthorizedTask(req, res);
    if (!task) return;
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim() || text.length > 5000) {
      return res.status(400).json({ success: false, message: 'Commentaire invalide' });
    }
    task.comments.push({ user: req.user.id, text: text.trim() });
    await task.save();
    res.json({ success: true, message: 'Commentaire ajouté', comments: task.comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de l’ajout du commentaire' });
  }
});

// @route DELETE /api/tasks/:id (administrator permission, as in the UI)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    await task.deleteOne();
    res.json({ success: true, message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la tâche' });
  }
});

module.exports = router;
