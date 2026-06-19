const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Helper: simulate a fake payment gateway delay/result
const simulatePaymentGateway = () => {
  // 90% success rate, mimics real payment behavior
  const success = Math.random() < 0.9;
  const ref = 'MOCK_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  return { success, ref };
};

// Deposit
exports.deposit = async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const { success, ref } = simulatePaymentGateway();

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      status: success ? 'completed' : 'failed',
      paymentMethod: paymentMethod || 'card',
      description: description || 'Wallet deposit',
      transactionRef: ref,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Withdraw
exports.withdraw = async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const { success, ref } = simulatePaymentGateway();

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdraw',
      amount,
      status: success ? 'completed' : 'failed',
      paymentMethod: paymentMethod || 'bank',
      description: description || 'Wallet withdrawal',
      transactionRef: ref,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transfer
exports.transfer = async (req, res) => {
  try {
    const { amount, recipientId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const { success, ref } = simulatePaymentGateway();

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'transfer',
      amount,
      status: success ? 'completed' : 'failed',
      recipient: recipientId,
      description: description || `Transfer to ${recipient.name}`,
      transactionRef: ref,
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('user', 'name email role')
      .populate('recipient', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Transaction History
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { user: req.user.id },
        { recipient: req.user.id }
      ]
    })
      .populate('user', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Wallet Balance (sum of completed transactions)
exports.getBalance = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      status: 'completed'
    });

    let balance = 0;
    transactions.forEach((t) => {
      if (t.type === 'deposit') balance += t.amount;
      if (t.type === 'withdraw') balance -= t.amount;
      if (t.type === 'transfer') balance -= t.amount;
    });

    // Add incoming transfers
    const incoming = await Transaction.find({
      recipient: req.user.id,
      status: 'completed'
    });
    incoming.forEach((t) => {
      balance += t.amount;
    });

    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};