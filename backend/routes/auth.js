const express = require('express');
const router = express.Router();
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validateUploadedDocument = require('../middleware/validateUploadedDocument');

const resetRequestLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de demandes. Réessayez plus tard.' } });
const resetAttemptLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de tentatives. Réessayez plus tard.' } });
const registrationLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de tentatives. Réessayez plus tard.' } });
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Trop de tentatives. Réessayez plus tard.' } });
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Triq (Route) dyal tsjal m3a CV
const registerWithCvValidation = [
  body('firstName').isString().trim().isLength({ min: 1, max: 100 }),
  body('lastName').isString().trim().isLength({ min: 1, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6, max: 128 })
];

router.post('/register-with-cv', registrationLimit, upload.single('cv'), validateUploadedDocument, registerWithCvValidation, validateRequest, authController.registerWithCV);

// Lqawa3id dyal l'validation
const registerValidation = [
  body('firstName').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Le prénom est requis'),
  body('lastName').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Le nom est requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isString().isLength({ min: 6, max: 128 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isString().notEmpty().withMessage('Le mot de passe est requis')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide')
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('code').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres'),
  body('password').isString().isLength({ min: 6, max: 128 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const verifyCodeValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('code').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres')
];

// Ttorqan (Routes)
router.post('/register', registrationLimit, registerValidation, validateRequest, authController.register);
router.post('/login', loginLimit, loginValidation, validateRequest, authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', resetRequestLimit, forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post('/verify-reset-code', resetAttemptLimit, verifyCodeValidation, validateRequest, authController.verifyResetCode);
router.post('/reset-password', resetAttemptLimit, resetPasswordValidation, validateRequest, authController.resetPassword);

module.exports = router;
