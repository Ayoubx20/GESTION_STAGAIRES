const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Application = require('../models/Application');

// Route pour servir les CV (protégée - admin seulement)
router.get('/cv/:filename', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    res.sendFile(filepath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;