const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: 'Nexus <onboarding@resend.dev>',
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