// backend/controllers/adminController.js
const User = require('../models/User');

// @desc    Get all pending users (non approuvés)
// @route   GET /api/admin/pending-users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      isApproved: false, 
      role: 'intern',
      isActive: true 
    }).select('-password');
    
    res.json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Approve a user
// @route   POST /api/admin/approve-user/:id
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.isApproved = true;
    user.approvedBy = req.user.id;
    user.approvedAt = Date.now();
    await user.save();

    // Ici vous pourriez envoyer un email au stagiaire pour le prévenir
    // sendEmailToUser('Votre compte a été approuvé', user);

    res.json({
      success: true,
      message: 'Utilisateur approuvé avec succès',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Reject a user (supprime ou désactive)
// @route   POST /api/admin/reject-user/:id
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Option 1: Soft delete - désactiver seulement
    user.isActive = false;
    await user.save();

    // Option 2: Hard delete - supprimer complètement
    // await user.deleteOne();

    res.json({
      success: true,
      message: 'Demande rejetée'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};