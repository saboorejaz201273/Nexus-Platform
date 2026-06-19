const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw', 'transfer'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // for transfer
  description: { type: String, default: '' },
  paymentMethod: { type: String, default: 'card' },
  transactionRef: { type: String, default: '' }, // mock stripe-like ref id
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);