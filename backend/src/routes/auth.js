const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/users', authMiddleware, getAllUsers);

module.exports = router;