const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get user notifications and messages for Navbar
// @route   GET /api/notifications/navbar
// @access  Private
router.get('/navbar', auth, async (req, res) => {
  try {
    const notifCount = await Notification.countDocuments({ recipient: req.user.id });
    if (notifCount === 0) {
      await Notification.create({
        recipient: req.user.id,
        title: 'Bienvenue !',
        message: 'Bienvenue sur votre nouvel espace de gestion.',
        type: 'success'
      });
    }

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const unreadNotifications = await Notification.countDocuments({ recipient: req.user.id, read: false });

    const recentMessagesQuery = Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }]
    })
      .populate('sender', 'firstName lastName')
      .populate('recipient', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    const [unreadIncomingMessages, recentMessages] = await Promise.all([
      Message.find({ recipient: req.user.id, read: false })
        .populate('sender', 'firstName lastName')
        .populate('recipient', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10),
      recentMessagesQuery
    ]);
    const unreadIds = new Set(unreadIncomingMessages.map((message) => String(message._id)));
    const messages = [
      ...unreadIncomingMessages,
      ...recentMessages.filter((message) => !unreadIds.has(String(message._id)))
    ].slice(0, 10);

    const unreadMessages = await Message.countDocuments({ recipient: req.user.id, read: false });

    res.json({
      success: true,
      notifications,
      unreadNotifications,
      messages,
      unreadMessages
    });
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/contacts', auth, async (req, res) => {
  try {
    const contacts = await User.find({ _id: { $ne: req.user.id } })
      .select('firstName lastName email role')
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    res.json({ success: true, users: contacts });
  } catch (error) {
    console.error('Erreur chargement contacts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/messages', auth, async (req, res) => {
  try {
    const recipientId = req.query.with;
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ success: false, message: 'Destinataire invalide' });
    }

    const conversation = await Message.find({
      $or: [
        { sender: req.user.id, recipient: recipientId },
        { sender: recipientId, recipient: req.user.id }
      ]
    })
      .populate('sender', 'firstName lastName role')
      .populate('recipient', 'firstName lastName role')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: recipientId, recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true, messages: conversation });
  } catch (error) {
    console.error('Erreur conversation messages:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/messages', auth, async (req, res) => {
  try {
    const { recipient, subject, content } = req.body || {};
    if (!mongoose.isValidObjectId(recipient)) {
      return res.status(400).json({ success: false, message: 'Destinataire invalide' });
    }
    if (String(recipient) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous envoyer un message à vous-même.' });
    }
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Message invalide. 1 à 2000 caractères.' });
    }

    const targetUser = await User.findById(recipient);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Destinataire introuvable' });
    }

    const message = await Message.create({
      sender: req.user.id,
      recipient: targetUser._id,
      subject: typeof subject === 'string' ? subject.trim().slice(0, 120) : '',
      content: content.trim(),
      read: false
    });

    const sender = await User.findById(req.user.id).select('firstName lastName');
    await Notification.create({
      recipient: targetUser._id,
      title: 'Nouveau message',
      message: `${sender?.firstName || 'Un utilisateur'} ${sender?.lastName || ''}: ${content.trim().slice(0, 80)}`,
      type: 'info',
      link: '/messages'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName role')
      .populate('recipient', 'firstName lastName role');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { returnDocument: 'after' }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
