const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', status = '', priority = '', assignedTo = '' } = req.query;
    let query = {};

    // Role-based restrictions
    if (req.user.role === 'intern') {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'supervisor') {
      // Les superviseurs peuvent voir les tâches qu'ils ont créées OU assignées à leurs stagiaires (on peut simplifier selon besoin)
      // Ici on va permettre de voir tout, ou filtrer par assignedTo='me' si besoin.
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo === 'me') query.assignedTo = req.user.id;

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
      tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
  }
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la tâche'
    });
  }
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.user.id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche'
    });
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Tâche mise à jour avec succès',
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la tâche'
    });
  }
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, progress } = req.body;

    const updateData = { status };
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (status === 'completed') {
      updateData.completedAt = Date.now();
      updateData.progress = 100;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    task.comments.push({
      user: req.user.id,
      text
    });

    await task.save();

    res.json({
      success: true,
      message: 'Commentaire ajouté',
      comments: task.comments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du commentaire'
    });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la tâche'
    });
  }
});

module.exports = router;