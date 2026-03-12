const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Intern = require('../models/Intern');
const User = require('../models/User');
const upload = require('../middleware/upload');

// @desc    Get all interns
// @route   GET /api/interns
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // 🔥 AUTO-REPAIR: Ensure all approved users with role 'intern' have a profile
    // This solves the issue where some interns appear in Users but not in Interns list
    try {
      const allInternProfiles = await Intern.find().select('user').lean();
      const profileUserIds = allInternProfiles.map(p => p.user.toString());
      
      const orphanedUsers = await User.find({
        role: 'intern',
        isApproved: true,
        _id: { $nin: profileUserIds }
      }).lean();

      if (orphanedUsers.length > 0) {
        console.log(`🛠️ Reparation : ${orphanedUsers.length} profils stagiaires manquants trouvés.`);
        for (const user of orphanedUsers) {
          await Intern.create({
            user: user._id,
            studentId: `STG-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
            school: 'Non défini',
            major: 'Non défini',
            startDate: user.createdAt || new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            status: 'active'
          });
        }
      }
    } catch (repairErr) {
      console.error('⚠️ Auto-repair failed:', repairErr);
    }

    const { page = 1, limit = 10, search = '', status = '', school = '' } = req.query;
    const query = {};

    // Filter by status
    if (status) query.status = status;

    // Filter by school
    if (school) query.school = new RegExp(school, 'i');


    // Search by name/email (requires joining with User)
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    // Role-based filtering: Supervisors only see their own interns
    if (req.user.role === 'supervisor') {
      query.supervisor = req.user.id;
    }

    const total = await Intern.countDocuments(query);
    const interns = await Intern.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.json({
      success: true,
      count: interns.length,
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
      interns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' });
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
      endDate
    } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // 2. Check if studentId already exists
    const existingIntern = await Intern.findOne({ studentId });
    if (existingIntern) {
      return res.status(400).json({
        success: false,
        message: 'Ce numéro étudiant est déjà utilisé'
      });
    }

    // 3. Create user account for intern
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: 'password123', // Default password
      phone,
      role: 'intern',
      isApproved: true,
      isActive: true
    });

    // 4. Create intern profile
    const intern = await Intern.create({
      user: user._id,
      studentId,
      school,
      major,
      startDate,
      endDate,
      supervisor: supervisor || req.user.id,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Stagiaire créé avec succès',
      intern
    });
  } catch (error) {
    console.error('Erreur creation stagiaire:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du stagiaire'
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
      { returnDocument: 'after', runValidators: true }
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
      { returnDocument: 'after' }
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

// @desc    Get current intern profile
// @route   GET /api/interns/me/profile
// @access  Private
router.get('/me/profile', auth, async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Profil stagiaire non trouvé'
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
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @desc    Add document to intern profile
// @route   POST /api/interns/me/documents
// @access  Private
router.post('/me/documents', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const intern = await Intern.findOne({ user: req.user.id });
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Profil stagiaire non trouvé'
      });
    }

    const newDocument = {
      name: req.body.name || req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    intern.documents.push(newDocument);
    await intern.save();

    res.json({
      success: true,
      message: 'Document ajouté avec succès',
      document: intern.documents[intern.documents.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du document'
    });
  }
});

// @desc    Delete document from intern profile
// @route   DELETE /api/interns/me/documents/:docId
// @access  Private
router.delete('/me/documents/:docId', auth, async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user.id });
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Profil stagiaire non trouvé'
      });
    }

    intern.documents = intern.documents.filter(
      doc => doc._id.toString() !== req.params.docId
    );

    await intern.save();

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du document'
    });
  }
});

module.exports = router;