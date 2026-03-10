const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const total = await Department.countDocuments(query);
    const departments = await Department.find(query)
      .populate('manager', 'firstName lastName email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json({
      success: true,
      count: departments.length,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
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

    const { name, code, ...otherData } = req.body;

    // Check if name or code exist
    const existing = await Department.findOne({
      $or: [{ name }, { code }]
    });

    if (existing) {
      const field = existing.name === name ? 'nom' : 'code';
      return res.status(400).json({
        success: false,
        message: `Un département avec ce ${field} existe déjà`
      });
    }

    // Clean empty manager field
    if (otherData.manager === '') {
      delete otherData.manager;
    }

    const department = await Department.create({ name, code, ...otherData });

    res.status(201).json({
      success: true,
      message: 'Département créé avec succès',
      department
    });
  } catch (error) {
    console.error('Erreur create department:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du département'
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
      { returnDocument: 'after', runValidators: true }
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

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent supprimer des départements'
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }

    // Check if interns are assigned to this department
    const Intern = require('../models/Intern');
    const internsCount = await Intern.countDocuments({ department: req.params.id });

    if (internsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce département car ${internsCount} stagiaire(s) y sont encore affectés.`
      });
    }

    await department.deleteOne();

    res.json({
      success: true,
      message: 'Département supprimé avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du département'
    });
  }
});

module.exports = router;