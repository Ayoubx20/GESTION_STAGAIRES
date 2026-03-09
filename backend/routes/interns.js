const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Intern = require('../models/Intern');
const User = require('../models/User');

// @desc    Get all interns
// @route   GET /api/interns
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const interns = await Intern.find()
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email');
    
    res.json({
      success: true,
      count: interns.length,
      interns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des stagiaires'
    });
  }
});

// @desc    Get single intern
// @route   GET /api/interns/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email');
    
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé'
      });
    }
    
    res.json({
      success: true,
      intern
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du stagiaire'
    });
  }
});

// @desc    Create new intern
// @route   POST /api/interns
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      studentId,
      school,
      major,
      startDate,
      endDate,
      supervisor
    } = req.body;

    // Create user account for intern
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: 'password123', // Default password, should be changed on first login
      phone,
      role: 'intern'
    });

    // Create intern profile
    const intern = await Intern.create({
      user: user._id,
      studentId,
      school,
      major,
      startDate,
      endDate,
      supervisor: supervisor || req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Stagiaire créé avec succès',
      intern
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du stagiaire'
    });
  }
});

// @desc    Update intern
// @route   PUT /api/interns/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const intern = await Intern.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Stagiaire mis à jour avec succès',
      intern
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du stagiaire'
    });
  }
});

// @desc    Delete intern
// @route   DELETE /api/interns/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé'
      });
    }

    // Delete associated user account
    await User.findByIdAndDelete(intern.user);
    
    // Delete intern
    await intern.deleteOne();

    res.json({
      success: true,
      message: 'Stagiaire supprimé avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du stagiaire'
    });
  }
});

// @desc    Update intern status
// @route   PATCH /api/interns/:id/status
// @access  Private
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const intern = await Intern.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      intern
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

module.exports = router;