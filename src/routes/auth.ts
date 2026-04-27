import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import passport from '../config/passport';
const router = Router();

// Validation middleware
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'core_team', 'praxante', 'student'])
    .withMessage('Invalid role'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

// Public routes
router.post('/register', register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, async (req: any, res: any) => {
  try {
    const { email } = req.body;
    
    // Import User model to check database
    const User = (await import('@/models/User')).default;
    
    // Check if user exists in database
    const user = await User.query().findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Este email não está registado na nossa base de dados.'
      });
    }
    
    // TODO: In a real implementation, you would:
    // 1. Generate reset token
    // 2. Store token in database with expiration
    // 3. Send email with reset link
    
    res.json({
      success: true,
      message: `Email de recuperação enviado para ${email}. Verifique a sua caixa de entrada e spam.`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Ocorreu um erro ao processar o seu pedido. Tente novamente.'
    });
  }
});

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, validate, changePassword);
router.post('/logout', authenticate, logout);

// OAuth routes
router.get('/google', (req: any, res: any) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || 
      !process.env.GOOGLE_CLIENT_SECRET || 
      process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
      process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
    return res.status(503).json({ 
      message: 'Google OAuth não está configurado. Por favor, configure as credenciais do Google OAuth no arquivo .env' 
    });
  }
  
  passport.authenticate('google')(req, res);
  return;
});

router.get('/google/callback', (req: any, res: any) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || 
      !process.env.GOOGLE_CLIENT_SECRET || 
      process.env.GOOGLE_CLIENT_ID === 'your-google-client-id' ||
      process.env.GOOGLE_CLIENT_SECRET === 'your-google-client-secret') {
    return res.status(503).json({ 
      message: 'Google OAuth não está configurado' 
    });
  }
  
  passport.authenticate('google', { failureRedirect: '/login' })(req, res, (err: any) => {
    if (!err) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  });
  return;
});

router.get('/microsoft', (req, res) => {
  res.json({ message: 'Microsoft OAuth endpoint - to be implemented' });
});

export default router;
