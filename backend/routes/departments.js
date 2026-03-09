const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'firstName lastName email');

    res.json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des départements'
    });
  }
});

// @desc    Create department
// @route   POST /api/departments
// @access  Private (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent créer des départements'
      });
    }

    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Département créé avec succès',
      department
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du département'
    });
  }
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent modifier des départements'
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Département mis à jour avec succès',
      department
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du département'
    });
  }
});

module.exports = router;