const nodemailer = require('nodemailer');

// Mock transporter - logs to console instead of sending real emails
// (since we don't have real SMTP credentials, this simulates the 2FA flow)
const sendOTPEmail = async (email, otp) => {
  console.log('========================================');
  console.log(`📧 MOCK EMAIL SENT TO: ${email}`);
  console.log(`🔑 YOUR OTP CODE IS: ${otp}`);
  console.log(`⏰ Valid for 5 minutes`);
  console.log('========================================');
  
  // In production, you would use real SMTP like this:
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  // });
  // await transporter.sendMail({
  //   from: process.env.EMAIL_USER,
  //   to: email,
  //   subject: 'Your Nexus OTP Code',
  //   text: `Your OTP code is: ${otp}. Valid for 5 minutes.`
  // });

  return true;
};

module.exports = { sendOTPEmail };