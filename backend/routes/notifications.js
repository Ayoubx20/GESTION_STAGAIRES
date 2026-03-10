const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// @desc    Get user notifications and messages for Navbar
// @route   GET /api/notifications/navbar
// @access  Private
router.get('/navbar', auth, async (req, res) => {
  try {
    // Check if user has zero notifications, create a welcome one
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

    // Messages
    const messages = await Message.find({ recipient: req.user.id })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

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
