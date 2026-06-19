const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { transactionValidation } = require('../middleware/validators');
const {
  deposit,
  withdraw,
  transfer,
  getTransactions,
  getBalance
} = require('../controllers/transactionController');

router.post('/deposit', auth, transactionValidation, validate, deposit);
router.post('/withdraw', auth, transactionValidation, validate, withdraw);
router.post('/transfer', auth, transactionValidation, validate, transfer);
router.get('/', auth, getTransactions);
router.get('/balance', auth, getBalance);

module.exports = router;