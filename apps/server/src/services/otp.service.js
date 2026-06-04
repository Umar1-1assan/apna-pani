const twilio = require('twilio');

/**
 * Send OTP to phone number via SMS
 */
const sendOtp = async (phone) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: phone,
        channel: 'sms'
      });

    return {
      success: true,
      status: verification.status,
      message: `OTP sent to ${phone}`
    };
  } catch (error) {
    console.error('OTP Send Error:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Verify OTP code
 */
const verifyOtp = async (phone, code) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code
      });

    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status,
      message: verificationCheck.status === 'approved' 
        ? 'OTP verified successfully'
        : 'Invalid or expired OTP'
    };
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Send SMS using Twilio
 */
const sendSms = async (to, message) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    return {
      success: true,
      sid: msg.sid,
      message: 'SMS sent successfully'
    };
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  sendSms
};
