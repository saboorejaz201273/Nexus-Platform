const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['investor', 'entrepreneur'], required: true },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  avatar: { type: String, default: '' },
  startupName: { type: String, default: '' },
  industry: { type: String, default: '' },
  fundingNeed: { type: String, default: '' },
  teamSize: { type: Number, default: 0 },
  investmentFocus: [{ type: String }],
  portfolioSize: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);