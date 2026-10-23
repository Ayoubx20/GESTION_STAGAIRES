const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const ErrorReport = require('../models/ErrorReport');
const Notification = require('../models/Notification');
const User = require('../models/User');

const privileged = (req, res, next) => {
  if (['admin', 'supervisor'].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: 'Accès réservé à l’équipe de gestion' });
};

const categories = ['timesheet', 'tasks', 'documents', 'account', 'other'];
const severities = ['low', 'medium', 'high', 'critical'];
const statuses = ['open', 'in_progress', 'resolved'];

function validReportInput(body) {
  return Boolean(body && typeof body === 'object' && !Array.isArray(body)) &&
    typeof body.title === 'string' &&
    body.title.trim().length >= 5 &&
    body.title.trim().length <= 120 &&
    categories.includes(body.category) &&
    typeof body.description === 'string' &&
    body.description.trim().length >= 20 &&
    body.description.trim().length <= 3000 &&
    severities.includes(body.severity) &&
    (body.pageUrl === undefined || (typeof body.pageUrl === 'string' && body.pageUrl.length <= 500)) &&
    (body.browser === undefined || (typeof body.browser === 'string' && body.browser.length <= 300));
}

router.post('/', auth, async (req, res) => {
  try {
    if (!validReportInput(req.body)) {
      return res.status(400).json({ success: false, message: 'Vérifiez le titre, la catégorie, la priorité et la description du signalement.' });
    }

    const report = await ErrorReport.create({
      reporter: req.user._id,
      title: req.body.title.trim(),
      category: req.body.category,
      description: req.body.description.trim(),
      severity: req.body.severity,
      pageUrl: (req.body.pageUrl || '').trim(),
      browser: (req.body.browser || '').trim()
    });

    let notificationSent = true;
    try {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
      if (admins.length) {
        await Notification.insertMany(admins.map((admin) => ({
          recipient: admin._id,
          title: 'Nouveau signalement',
          message: `${req.user.firstName} ${req.user.lastName} : ${report.title}`,
          type: report.severity === 'critical' || report.severity === 'high' ? 'error' : 'warning',
          link: '/error-reports'
        })));
      } else {
        console.warn('Error report saved, but no active administrator is available for notification.');
        notificationSent = false;
      }
    } catch (notificationError) {
      console.error('Error report saved, but administrator notification failed:', notificationError.message);
      notificationSent = false;
    }

    res.status(201).json({ success: true, data: report, notificationSent });
  } catch (error) {
    console.error('Error report creation failed:', error.message);
    res.status(500).json({ success: false, message: 'Impossible d’enregistrer le signalement pour le moment.' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const reports = await ErrorReport.find({ reporter: req.user._id })
      .populate('messages.sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('User error report lookup failed:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de charger vos signalements.' });
  }
});

router.get('/', [auth, privileged], async (req, res) => {
  try {
    const reports = await ErrorReport.find()
      .populate('reporter', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName')
      .populate('messages.sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Admin error report lookup failed:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de charger les signalements.' });
  }
});

router.post('/:id/messages', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Identifiant de signalement invalide.' });
    }
    const { content } = req.body || {};
    if (typeof content !== 'string' || content.trim().length < 1 || content.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Le message doit contenir entre 1 et 2000 caractères.' });
    }

    const report = await ErrorReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable.' });
    const isPrivileged = ['admin', 'supervisor'].includes(req.user.role);
    const isReporter = String(report.reporter) === String(req.user._id);
    if (!isPrivileged && !isReporter) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas accéder à cette conversation.' });
    }

    report.messages.push({ sender: req.user._id, content: content.trim() });
    await report.save();

    let notificationSent = true;
    try {
      if (isPrivileged) {
        await Notification.create({
          recipient: report.reporter,
          title: 'Réponse à votre signalement',
          message: `L’équipe a répondu à « ${report.title} ».`,
          type: 'info',
          link: '/error-reports'
        });
      } else {
        const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
        if (admins.length) {
          await Notification.insertMany(admins.map((admin) => ({
            recipient: admin._id,
            title: 'Nouveau message sur un signalement',
            message: `${req.user.firstName} ${req.user.lastName} a répondu à « ${report.title} ».`,
            type: 'info',
            link: '/error-reports'
          })));
        } else {
          notificationSent = false;
        }
      }
    } catch (notificationError) {
      console.error('Report message saved, but notification failed:', notificationError.message);
      notificationSent = false;
    }

    const updatedReport = await ErrorReport.findById(report._id)
      .populate('messages.sender', 'firstName lastName role')
      .lean();
    res.status(201).json({ success: true, data: updatedReport, notificationSent });
  } catch (error) {
    console.error('Error report message creation failed:', error.message);
    res.status(500).json({ success: false, message: 'Impossible d’envoyer le message.' });
  }
});

router.patch('/:id/status', [auth, privileged], async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Identifiant de signalement invalide.' });
    }
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        !statuses.includes(body.status) ||
        (body.resolutionNote !== undefined &&
          (typeof body.resolutionNote !== 'string' || body.resolutionNote.length > 1500))) {
      return res.status(400).json({ success: false, message: 'Statut ou note de suivi invalide.' });
    }

    const report = await ErrorReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable.' });

    report.status = body.status;
    report.resolutionNote = (body.resolutionNote || '').trim();
    report.reviewedBy = req.user._id;
    await report.save();

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error report update failed:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de mettre à jour ce signalement.' });
  }
});

module.exports = router;
