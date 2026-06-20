const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 lookups (fixes Railway IPv6 ENETUNREACH issue with Gmail SMTP)
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
});

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Nexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Nexus OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #2563eb;">Nexus Verification Code</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="letter-spacing: 4px; color: #111;">${otp}</h1>
          <p>This code is valid for <strong>5 minutes</strong>.</p>
          <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw error;
  }
};

module.exports = { sendOTPEmail };