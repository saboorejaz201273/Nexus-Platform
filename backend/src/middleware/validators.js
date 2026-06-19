const { body } = require('express-validator');

// Sanitize and validate registration
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .escape(), // prevents XSS by escaping HTML chars
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['investor', 'entrepreneur']).withMessage('Role must be investor or entrepreneur'),
];

// Validate login
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Validate meeting scheduling
exports.meetingValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title too long')
    .escape(),
  body('participant')
    .notEmpty().withMessage('Participant is required')
    .isMongoId().withMessage('Invalid participant ID'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('startTime')
    .notEmpty().withMessage('Start time is required'),
  body('endTime')
    .notEmpty().withMessage('End time is required'),
];

// Validate transactions
exports.transactionValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
];