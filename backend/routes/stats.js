const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const Department = require('../models/Department');

// @desc    Obtenir des statistiques générales
// @route   GET /api/stats
// @access  Private (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    // Statistiques de base
    const totalUsers = await User.countDocuments();
    const totalInterns = await User.countDocuments({ role: 'intern' });
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          interns: totalInterns,
          admins: totalUsers - totalInterns
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// @desc    Obtenir les données pour la page Rapports
// @route   GET /api/stats/reports
// @access  Private (admin/supervisor)
router.get('/reports', auth, async (req, res) => {
  try {
    if (req.user.role === 'intern') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // 1. General Stats
    const totalInterns = await User.countDocuments({ role: 'intern', isActive: true });
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ status: { $in: ['in_progress', 'pending'] } });
    const totalDepartments = await Department.countDocuments({ isActive: true });

    // 2. Department Data (Distribution)
    const departments = await Department.find({ isActive: true });
    const departmentData = departments.map(d => ({
      name: d.name,
      value: d.currentInterns || 0
    })).filter(d => d.value > 0);

    // If no interns in any dept, fallback string
    if (departmentData.length === 0) {
      departmentData.push({ name: 'Aucun', value: 1 });
    }

    // 3. Task Data (Last 7 days)
    const taskData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      const created = await Task.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
      const completed = await Task.countDocuments({ completedAt: { $gte: startOfDay, $lte: endOfDay } });
      
      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(startOfDay);
      taskData.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        créées: created,
        complétées: completed
      });
    }

    // 4. Intern Data (Last 6 months progression)
    const internData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Set to 1st to avoid rolling over short months (like Feb)
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(startOfMonth);
      
      // Cumulative total interns created up to that month
      const total = await User.countDocuments({ 
        role: 'intern', 
        createdAt: { $lte: endOfMonth } 
      });

      // Active interns means not inactive before the end of the month (simplification: total active up to that month)
      const actifs = await User.countDocuments({
        role: 'intern',
        createdAt: { $lte: endOfMonth },
        isActive: true
      });

      internData.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        actifs,
        total
      });
    }

    res.json({
      success: true,
      stats: {
        totalInterns,
        completedTasks,
        inProgressTasks,
        totalDepartments
      },
      departmentData,
      taskData,
      internData
    });
  } catch (error) {
    console.error('❌ Erreur reports stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;