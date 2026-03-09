const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé - Admin seulement' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};

// @desc    Obtenir tous les stagiaires en attente d'approbation
// @route   GET /api/admin/pending-interns
// @access  Private (Admin only)
router.get('/pending-interns', auth, isAdmin, async (req, res) => {
  try {
    const pendingInterns = await User.find({ 
      role: 'intern', 
      isApproved: false,
      isActive: true 
    }).select('-password');

    const SiteStat = require('../models/SiteStat');
    const monthId = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const currentStats = await SiteStat.findOne({ monthId }) || { approvedCount: 0, rejectedCount: 0 };

    res.json({
      success: true,
      count: pendingInterns.length,
      interns: pendingInterns,
      stats: {
        approvedMonth: currentStats.approvedCount,
        rejectedMonth: currentStats.rejectedCount
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// @desc    Approuver un stagiaire
// @route   PUT /api/admin/approve-intern/:id
// @access  Private (Admin only)
router.put('/approve-intern/:id', auth, isAdmin, async (req, res) => {
  try {
    const intern = await User.findById(req.params.id);
    
    if (!intern) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stagiaire non trouvé' 
      });
    }

    if (intern.role !== 'intern') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet utilisateur n\'est pas un stagiaire' 
      });
    }

    intern.isApproved = true;
    intern.isActive = true;
    await intern.save();

    // Vérifier si le profil de stagiaire existe déjà pour éviter les doublons
    const Intern = require('../models/Intern');
    const existingInternProfile = await Intern.findOne({ user: intern._id });
    
    if (!existingInternProfile) {
      // Créer automatiquement le profil stagiaire
      await Intern.create({
        user: intern._id,
        // On génère un ID étudiant fictif par défaut, il pourra être modifié plus tard
        studentId: `STG-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
        school: 'Non défini',
        major: 'Non défini',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // +3 mois par défaut
        status: 'active'
      });
    }

    // Mettre à jour les statistiques
    const SiteStat = require('../models/SiteStat');
    const monthId = new Date().toISOString().slice(0, 7);
    await SiteStat.findOneAndUpdate(
      { monthId },
      { $inc: { approvedCount: 1 } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Stagiaire approuvé avec succès',
      intern: {
        id: intern._id,
        firstName: intern.firstName,
        lastName: intern.lastName,
        email: intern.email,
        isApproved: intern.isApproved
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// @desc    Rejeter un stagiaire (optionnel)
// @route   DELETE /api/admin/reject-intern/:id
// @access  Private (Admin only)
router.delete('/reject-intern/:id', auth, isAdmin, async (req, res) => {
  try {
    const intern = await User.findByIdAndDelete(req.params.id);
    
    if (!intern) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stagiaire non trouvé' 
      });
    }

    // Mettre à jour les statistiques
    const SiteStat = require('../models/SiteStat');
    const monthId = new Date().toISOString().slice(0, 7);
    await SiteStat.findOneAndUpdate(
      { monthId },
      { $inc: { rejectedCount: 1 } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Stagiaire rejeté et supprimé'
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// @desc    Obtenir tous les stagiaires (approuvés et non approuvés)
// @route   GET /api/admin/all-interns
// @access  Private (Admin only)
router.get('/all-interns', auth, isAdmin, async (req, res) => {
  try {
    const interns = await User.find({ role: 'intern' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: interns.length,
      interns: interns
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

module.exports = router;