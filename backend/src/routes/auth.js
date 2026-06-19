const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../middleware/validators');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/users', authMiddleware, getAllUsers);

module.exports = router;