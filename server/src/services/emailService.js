import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env variables are loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class EmailService {
  isSmtpConfigured() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    return Boolean(host && user && pass);
  }

  createRealTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465 SSL, false for 587 STARTTLS
        requireTLS: port === 587,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: true,
        },
      });
    }
    return null;
  }

  async getTransporter() {
    if (this.isSmtpConfigured()) {
      return this.createRealTransporter();
    }
    return null;
  }

  async verifySmtpConfig() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;
    const configured = this.isSmtpConfigured();

    logger.info('[EMAIL SERVICE] SMTP Configuration Diagnostic:');
    logger.info('  - SMTP configured: %s', configured);
    logger.info('  - SMTP host: %s', host || 'not set');
    logger.info('  - SMTP port: %s', port);
    logger.info('  - SMTP user configured: %s', Boolean(user));
    logger.info('  - SMTP password configured: %s', Boolean(pass));
    logger.info('  - EMAIL_FROM configured: %s', Boolean(from));

    if (configured) {
      const transporter = this.createRealTransporter();
      try {
        await transporter.verify();
        logger.info('  - SMTP connection: successful (authenticated with %s:%s)', host, port);
      } catch (vErr) {
        logger.error('  - SMTP connection FAILED: %s (code: %s)', vErr.message, vErr.code || 'UNKNOWN');
      }
    } else {
      logger.warn('[EMAIL SERVICE] WARNING: SMTP credentials are not configured in server/.env. Real email delivery will fail.');
    }

    return configured;
  }

  async sendVerificationEmail(toEmail, rawToken, userName = 'Owner') {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}`;
    const smtpUser = process.env.SMTP_USER;
    const fromAddress = process.env.EMAIL_FROM || (smtpUser ? `"AgriBiz Suite" <${smtpUser}>` : '"AgriBiz Suite" <no-reply@agribiz.com>');

    const transporter = await this.getTransporter();

    if (!transporter) {
      logger.error('[EMAIL SERVICE] Unable to send verification email to %s: Real SMTP host/user/pass not configured in server/.env.', toEmail);
      const err = new Error('SMTP server is not configured in server/.env.');
      err.code = 'ESMTPNOTCONFIGURED';
      throw err;
    }

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: 'Verify Your Email Address - AgriBiz Suite',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <h2 style="color: #10b981; margin: 0; font-size: 24px;">🌱 AgriBiz Suite</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Business Management Platform</p>
          </div>
          <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Welcome, ${userName}!</h3>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for registering your business with AgriBiz Suite. Please verify your email address to complete your account setup and activate your workspace.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(16,185,129,0.2);">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
            This link is single-use and time-limited to 24 hours. If you did not register for an AgriBiz account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            If the button above does not work, copy and paste this URL into your web browser:<br />
            <a href="${verifyUrl}" style="color: #10b981; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info('[EMAIL SERVICE] Verification email successfully delivered via Gmail SMTP (%s) to recipient %s. MessageID: %s', process.env.SMTP_HOST, toEmail, info.messageId);
      return { success: true, emailSent: true, messageId: info.messageId };
    } catch (sendErr) {
      logger.error('[EMAIL SERVICE] SMTP sendMail failed for recipient %s: %s (code: %s)', toEmail, sendErr.message, sendErr.code || 'UNKNOWN');
      throw sendErr;
    }
  }

  async sendOwnerPinResetEmail(toEmail, rawToken, ownerName = 'Owner', businessName = 'AgriBiz Suite') {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-owner-pin?token=${rawToken}`;
    const smtpUser = process.env.SMTP_USER;
    const fromAddress = process.env.EMAIL_FROM || (smtpUser ? `"AgriBiz Suite" <${smtpUser}>` : '"AgriBiz Suite" <no-reply@agribiz.com>');

    const transporter = await this.getTransporter();

    if (!transporter) {
      logger.error('[EMAIL SERVICE] Unable to send Owner PIN reset email to %s: Real SMTP host/user/pass not configured.', toEmail);
      const err = new Error('SMTP server is not configured in server/.env.');
      err.code = 'ESMTPNOTCONFIGURED';
      throw err;
    }

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `Reset Owner PIN - ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <h2 style="color: #10b981; margin: 0; font-size: 24px;">🌱 AgriBiz Suite</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Security & Account Management</p>
          </div>
          <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hello ${ownerName},</h3>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset the Owner PIN for <strong>${businessName}</strong>. Click the button below to set a new 4-digit Owner PIN:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(16,185,129,0.2);">
              Reset Owner PIN
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
            This single-use link is valid for <strong>30 minutes</strong>. If you did not request a PIN reset, please ignore this email or contact support.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            If the button above does not work, copy and paste this URL into your web browser:<br />
            <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info('[EMAIL SERVICE] Owner PIN reset email delivered via Gmail SMTP to %s. MessageID: %s', toEmail, info.messageId);
      return { success: true, emailSent: true, messageId: info.messageId };
    } catch (sendErr) {
      logger.error('[EMAIL SERVICE] SMTP sendMail failed for recipient %s: %s (code: %s)', toEmail, sendErr.message, sendErr.code || 'UNKNOWN');
      throw sendErr;
    }
  }
}

export default new EmailService();
