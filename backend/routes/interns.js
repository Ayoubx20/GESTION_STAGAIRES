const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Intern = require('../models/Intern');
const User = require('../models/User');
const upload = require('../middleware/upload');
const validateUploadedDocument = require('../middleware/validateUploadedDocument');
const Team = require('../models/Team');
const crypto = require('crypto');
const mongoose = require('mongoose');

const internStatuses = new Set(['pending', 'active', 'completed', 'terminated']);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function canAccessIntern(user, intern) {
  if (user.role === 'admin') return true;
  if (user.role === 'intern') return String(intern.user?._id || intern.user) === String(user.id || user._id);
  if (user.role !== 'supervisor') return false;
  if (String(intern.supervisor?._id || intern.supervisor) === String(user.id || user._id)) return true;
  return Boolean(await Team.exists({ supervisor: user.id || user._id, interns: intern._id }));
}

// @desc    Get all interns
// @route   GET /api/interns
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', school = '' } = req.query;
    if (!['admin', 'supervisor', 'intern'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
    if (status && !internStatuses.has(status)) return res.status(400).json({ success: false, message: 'Statut invalide' });
    if (typeof search !== 'string' || search.length > 100 || typeof school !== 'string' || school.length > 100) return res.status(400).json({ success: false, message: 'Filtre invalide' });
    const query = {};

    // Filter by status
    if (status) query.status = status;

    // Filter by school
    if (school) query.school = new RegExp(escapeRegex(school), 'i');


    // Baseline: only return interns whose underlying User role is 'intern' (including explicitly inactive ones)
    let userFilter = { role: 'intern', isApproved: true };

    // Search by name/email
    if (search) {
      userFilter.$or = [
        { firstName: new RegExp(escapeRegex(search), 'i') },
        { lastName: new RegExp(escapeRegex(search), 'i') },
        { email: new RegExp(escapeRegex(search), 'i') }
      ];
    }

    const validUsers = await User.find(userFilter).select('_id');
    let userIds = validUsers.map(u => u._id);
    if (req.user.role === 'intern') userIds = userIds.filter((id) => String(id) === String(req.user.id));
    if (req.user.role === 'supervisor') {
      const teams = await Team.find({ supervisor: req.user.id }).select('interns').lean();
      const scopedInternIds = [...new Set(teams.flatMap((team) => team.interns || []).map(String))];
      const scopedProfiles = await Intern.find({ $or: [{ supervisor: req.user.id }, { _id: { $in: scopedInternIds } }] }).select('user').lean();
      const allowedUsers = new Set(scopedProfiles.map((profile) => String(profile.user)));
      userIds = userIds.filter((id) => allowedUsers.has(String(id)));
    }
    query.user = { $in: userIds };

    const total = await Intern.countDocuments(query);
    let internQuery = Intern.find(query);
    if (req.user.role === 'supervisor') internQuery = internQuery.select('user studentId school major startDate endDate supervisor status skills createdAt updatedAt');
    if (req.user.role === 'intern') internQuery = internQuery.select('user studentId school major startDate endDate supervisor status skills documents address emergencyContact evaluation createdAt updatedAt');
    const interns = await internQuery
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip((pageNumber - 1) * pageSize)
      .exec();

    res.json({
      success: true,
      count: interns.length,
      total,
      pages: Math.ceil(total / pageSize),
      page: pageNumber,
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
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    let internQuery = Intern.findById(req.params.id);
    if (req.user.role === 'supervisor') internQuery = internQuery.select('user studentId school major startDate endDate supervisor status skills createdAt updatedAt');
    const intern = await internQuery
      .populate('user', 'firstName lastName email phone')
      .populate('supervisor', 'firstName lastName email');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé'
      });
    }

    if (!await canAccessIntern(req.user, intern)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });

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
    if (!['admin', 'supervisor'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
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
      supervisor: requestedSupervisor
    } = req.body;

    // 1. Check if user already exists
    if (!firstName || !lastName || !email || !studentId || !school || !major || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Tous les champs requis doivent être fournis' });
    }
    if ([firstName, lastName, email, studentId, school, major].some((value) => typeof value !== 'string') ||
        firstName.length > 100 || lastName.length > 100 || email.length > 254 || studentId.length > 100 || school.length > 200 || major.length > 200 ||
        !/^\S+@\S+\.\S+$/.test(email.trim()) || (phone !== undefined && typeof phone !== 'string')) {
      return res.status(400).json({ success: false, message: 'Données de stagiaire invalides' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ success: false, message: 'Période de stage invalide' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
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
    if (requestedSupervisor && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Un superviseur ne peut pas assigner un autre superviseur' });
    let assignedSupervisor = req.user.role === 'supervisor' ? req.user.id : requestedSupervisor;
    if (assignedSupervisor) {
      if (!mongoose.isValidObjectId(assignedSupervisor)) return res.status(400).json({ success: false, message: 'Superviseur invalide' });
      const supervisorUser = await User.findById(assignedSupervisor).select('role isActive');
      if (!supervisorUser || supervisorUser.role !== 'supervisor' || !supervisorUser.isActive) return res.status(400).json({ success: false, message: 'Superviseur invalide' });
    }

    const approved = req.user.role === 'admin';
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: crypto.randomBytes(32).toString('hex'),
      phone,
      role: 'intern',
      isApproved: approved,
      isActive: approved
    });

    let intern;
    try {
      intern = await Intern.create({
        user: user._id,
        studentId,
        school,
        major,
        startDate,
        endDate,
        supervisor: assignedSupervisor,
        status: approved ? 'active' : 'pending'
      });
    } catch (profileError) {
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    res.status(201).json({
      success: true,
      message: approved ? 'Stagiaire créé. Il peut définir son mot de passe via la procédure de réinitialisation.' : 'Profil créé en attente d’approbation par un administrateur.',
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
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    const intern = await Intern.findById(req.params.id);
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Stagiaire non trouvé'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isSupervisor = req.user.role === 'supervisor';
    const isOwner = req.user.role === 'intern' && String(intern.user) === String(req.user.id);
    if (!isOwner && !(isSupervisor && await canAccessIntern(req.user, intern)) && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const userFields = ['firstName', 'lastName', 'email', 'phone'];
    const adminFields = ['studentId', 'school', 'major', 'startDate', 'endDate', 'supervisor', 'address', 'emergencyContact', 'skills', 'status'];
    const supervisorFields = ['studentId', 'school', 'major', 'startDate', 'endDate', 'address', 'emergencyContact', 'skills'];
    const ownerFields = ['address', 'emergencyContact', 'skills'];
    const permittedFields = new Set([...(isOwner ? ownerFields : [...userFields, ...(isAdmin ? adminFields : supervisorFields)])]);
    if (Object.keys(req.body).some((field) => !permittedFields.has(field))) {
      return res.status(400).json({ success: false, message: 'Champ de profil non autorisé' });
    }
    for (const field of ['firstName', 'lastName', 'email', 'phone', 'studentId', 'school', 'major']) {
      if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || req.body[field].length > 254)) {
        return res.status(400).json({ success: false, message: 'Données de profil invalides' });
      }
    }
    if (req.body.email !== undefined && !/^\S+@\S+\.\S+$/.test(req.body.email.trim())) return res.status(400).json({ success: false, message: 'Adresse e-mail invalide' });
    if (req.body.skills !== undefined && (!Array.isArray(req.body.skills) || req.body.skills.length > 100)) return res.status(400).json({ success: false, message: 'Liste de compétences invalide' });
    if (req.body.status !== undefined && !internStatuses.has(req.body.status)) return res.status(400).json({ success: false, message: 'Statut invalide' });

    let supervisorToAssign;
    if (req.body.supervisor !== undefined) {
      if (!mongoose.isValidObjectId(req.body.supervisor)) return res.status(400).json({ success: false, message: 'Superviseur invalide' });
      supervisorToAssign = await User.findById(req.body.supervisor).select('role isActive');
      if (!supervisorToAssign || supervisorToAssign.role !== 'supervisor' || !supervisorToAssign.isActive) return res.status(400).json({ success: false, message: 'Superviseur invalide' });
    }

    const userUpdate = {};
    for (const field of userFields) {
      if (!isOwner && req.body[field] !== undefined) userUpdate[field] = field === 'email' ? String(req.body[field]).toLowerCase().trim() : req.body[field];
    }
    if (Object.keys(userUpdate).length) {
      const user = await User.findById(intern.user);
      if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      Object.assign(user, userUpdate);
      await user.save();
    }

    for (const field of permittedFields) {
      if (req.body[field] !== undefined && !userFields.includes(field)) intern[field] = req.body[field];
    }
    if (supervisorToAssign) intern.supervisor = supervisorToAssign._id;
    if (req.body.status !== undefined) {
      const linkedUser = await User.findById(intern.user);
      if (!linkedUser) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      linkedUser.isActive = req.body.status !== 'terminated';
      linkedUser.tokenVersion = (linkedUser.tokenVersion || 0) + 1;
      await linkedUser.save();
    }
    await intern.save();

    await intern.populate('user', 'firstName lastName email phone');

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
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
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
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    const { status } = req.body;
    if (!internStatuses.has(status)) return res.status(400).json({ success: false, message: 'Statut invalide' });

    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Stagiaire non trouvé' });
    intern.status = status;
    await intern.save();

    // Synchronize User isActive status based on new intern status
    const linkedUser = await User.findById(intern.user);
    if (linkedUser) {
      linkedUser.isActive = status !== 'terminated';
      linkedUser.tokenVersion = (linkedUser.tokenVersion || 0) + 1;
      await linkedUser.save();
    }

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
    if (req.user.role !== 'intern') return res.status(403).json({ success: false, message: 'Accès réservé aux stagiaires' });
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
router.post('/me/documents', auth, upload.single('document'), validateUploadedDocument, async (req, res) => {
  try {
    if (req.user.role !== 'intern') return res.status(403).json({ success: false, message: 'Accès réservé aux stagiaires' });
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
      name: typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 200) : req.file.originalname.slice(0, 200),
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
    if (req.user.role !== 'intern') return res.status(403).json({ success: false, message: 'Accès réservé aux stagiaires' });
    if (!mongoose.isValidObjectId(req.params.docId)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
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
