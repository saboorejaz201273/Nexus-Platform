const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendOTPEmail } = require('../config/email');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock 2FA - step 1)
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove old OTPs for this email
    await Otp.deleteMany({ email });

    await Otp.create({ email, otp, expiresAt });
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully (check backend console for mock OTP)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP (mock 2FA - step 2)
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    await Otp.deleteOne({ _id: record._id });

    res.status(200).json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};