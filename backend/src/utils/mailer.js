import nodemailer from "nodemailer";
import env from "#config/env";

/**
 * @description Email utility using Nodemailer.
 * @module utils/mailer
 */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

/**
 * Sends a generic email.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML content.
 * @returns {Promise<Object>} Transporter response.
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent: ${info.response}`);
    return info;
  } catch (error) {
    console.error("✗ Email sending failed:", error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Sends a password reset email.
 * @param {string} email - Recipient email.
 * @param {string} resetUrl - Password reset URL.
 * @returns {Promise<Object>} Transporter response.
 */
export const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = "Password Reset Request";
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Reset Password
    </a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  return sendEmail(email, subject, html);
};

export default { sendEmail, sendPasswordResetEmail };
