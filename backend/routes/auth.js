const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Triq (Route) dyal tsjal m3a CV
router.post('/register-with-cv', upload.single('cv'), authController.registerWithCV);

// Lqawa3id dyal l'validation
const registerValidation = [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email invalide')
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const verifyCodeValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres')
];

// Ttorqan (Routes)
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/verify-reset-code', verifyCodeValidation, authController.verifyResetCode);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;