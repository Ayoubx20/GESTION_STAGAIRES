const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Intern = require('../models/Intern');
const { uploadDir, resolveUploadPath } = require('../utils/privateFiles');
const { getTaskUserScope } = require('../utils/taskAuthorization');

const router = express.Router();

function idOf(value) {
  return String(value?._id || value?.id || value || '');
}

async function canAccessInternDocuments(user, intern) {
  if (user.role === 'admin') return true;
  if (user.role === 'intern') return idOf(user) === idOf(intern.user);
  if (user.role === 'supervisor') {
    const scope = await getTaskUserScope(user);
    return scope.has(idOf(intern.user));
  }
  return false;
}

function sendPrivateFile(res, storedPath) {
  let filepath;
  try {
    filepath = resolveUploadPath(storedPath);
  } catch {
    return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
  }

  try {
    const canonicalRoot = fs.realpathSync(uploadDir);
    filepath = fs.realpathSync(filepath);
    const relativePath = path.relative(canonicalRoot, filepath);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
  } catch {
    return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
  }

  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.download(filepath, path.basename(filepath), (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
  });
}

// Download an application's CV by its database record ID, never by a client filename.
router.get('/cv/:applicationId', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.applicationId)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    let allowed = req.user.role === 'admin' ||
      (req.user.role === 'intern' && idOf(req.user) === idOf(application.user));

    if (!allowed && req.user.role === 'supervisor') {
      const intern = await Intern.findOne({ user: application.user });
      allowed = !!intern && await canAccessInternDocuments(req.user, intern);
    }

    if (!allowed) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    return sendPrivateFile(res, application.cvUrl);
  } catch (error) {
    console.error('Private CV download failed:', error.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Download a personal document by its embedded document ID. The owner profile and
// stored path are resolved server-side before any file is sent.
router.get('/documents/:documentId', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.documentId)) {
      return res.status(400).json({ success: false, message: 'Identifiant invalide' });
    }

    const intern = await Intern.findOne({ 'documents._id': req.params.documentId });
    if (!intern) return res.status(404).json({ success: false, message: 'Document non trouvé' });

    const document = intern.documents.find((item) => idOf(item) === req.params.documentId);
    if (!document) return res.status(404).json({ success: false, message: 'Document non trouvé' });
    if (!await canAccessInternDocuments(req.user, intern)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    return sendPrivateFile(res, document.url);
  } catch (error) {
    console.error('Private document download failed:', error.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
