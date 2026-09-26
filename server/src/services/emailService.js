import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import logger from '../config/logger.js';

// Force IPv4 DNS resolution first to prevent ENETUNREACH errors on cloud platforms
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class EmailService {
  reloadEnv() {
    dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
  }

  getResendClient() {
    this.reloadEnv();
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim()) {
      return new Resend(apiKey.trim());
    }
    return null;
  }

  isSmtpConfigured() {
    this.reloadEnv();
    const resendKey = process.env.RESEND_API_KEY;
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    return Boolean((resendKey && resendKey.trim()) || (host && user && pass));
  }

  async verifySmtpConfig() {
    this.reloadEnv();
    const resend = this.getResendClient();
    if (resend) {
      logger.info('[EMAIL SERVICE] Resend API key configured. Primary transport: Resend HTTPS API (Port 443).');
      return true;
    }
    const transporter = await this.createRealTransporter();
    if (transporter) {
      logger.info('[EMAIL SERVICE] Resend API key not configured. Secondary transport: Gmail SMTP prepared.');
      return true;
    }
    logger.warn('[EMAIL SERVICE] No active email credentials found. Dev mode fallback enabled.');
    return false;
  }

  async createRealTransporter() {
    this.reloadEnv();
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
          rejectUnauthorized: true,
          servername: 'smtp.gmail.com',
        },
      });
    }
    return null;
  }

  async sendEmail({ toEmail, subject, htmlContent, linkUrl }) {
    const resend = this.getResendClient();

    // 1. Primary Cloud Delivery: Resend HTTPS API (Port 443 - Unblocked on Render)
    if (resend) {
      const fromAddress = 'AgriBiz Suite <onboarding@resend.dev>';
      logger.info('[EMAIL SERVICE] Dispatching email via Resend HTTPS API (Port 443) to: %s', toEmail);
      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: [toEmail],
          subject: subject,
          html: htmlContent,
        });

        if (error) {
          logger.error('[EMAIL SERVICE] Resend API error: %s', error.message || JSON.stringify(error));
          throw new Error(error.message || 'Resend delivery failed');
        }

        logger.info('[EMAIL SERVICE] Email delivered successfully via Resend HTTPS API to recipient: %s. MessageID: %s', toEmail, data?.id);
        return { success: true, emailSent: true, messageId: data?.id };
      } catch (resendErr) {
        logger.error('[EMAIL SERVICE] Resend delivery failed: %s. Attempting Gmail SMTP fallback...', resendErr.message);
      }
    }

    // 2. Secondary / Local Fallback: Gmail SMTP
    const transporter = await this.createRealTransporter();
    if (transporter) {
      const smtpUser = process.env.SMTP_USER;
      const fromAddress = process.env.EMAIL_FROM || (smtpUser ? `"AgriBiz Suite" <${smtpUser}>` : '"AgriBiz Suite" <no-reply@agribiz.com>');
      logger.info('[EMAIL SERVICE] Dispatching email via Gmail SMTP to: %s', toEmail);
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      logger.info('[EMAIL SERVICE] Email delivered successfully via Gmail SMTP to recipient: %s. MessageID: %s', toEmail, info.messageId);
      return { success: true, emailSent: true, messageId: info.messageId };
    }

    // 3. Dev Mode Console Fallback
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[EMAIL SERVICE] Email service credentials not configured. [DEV LINK LOGGED]: %s', linkUrl);
      return { success: true, emailSent: false, devLink: linkUrl, message: 'Link logged to server console.' };
    }

    throw new Error('No working email transport service (Resend or SMTP) is configured.');
  }

  async sendPasswordResetEmail(toEmail, rawToken, userName = 'User') {
    const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
          <h2 style="color: #10b981; margin: 0; font-size: 24px;">🌱 AgriBiz Suite</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Account Security & Recovery</p>
        </div>
        <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hello ${userName},</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          We received a request to reset the password for your account associated with <strong>${toEmail}</strong>. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(16,185,129,0.2);">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
          This single-use link is valid for <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          If the button above does not work, copy and paste this URL into your web browser:<br />
          <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    `;

    return await this.sendEmail({ toEmail, subject: 'Reset Your Password - AgriBiz Suite', htmlContent, linkUrl: resetUrl });
  }

  async sendVerificationEmail(toEmail, rawToken, userName = 'Owner') {
    const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/$/, '');
    const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}`;
    const htmlContent = `
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
    `;

    return await this.sendEmail({ toEmail, subject: 'Verify Your Email Address - AgriBiz Suite', htmlContent, linkUrl: verifyUrl });
  }

  async sendOwnerPinResetEmail(toEmail, rawToken, ownerName = 'Owner', businessName = 'AgriBiz Suite') {
    const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-owner-pin?token=${rawToken}`;
    const htmlContent = `
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
    `;

    return await this.sendEmail({ toEmail, subject: `Reset Owner PIN - ${businessName}`, htmlContent, linkUrl: resetUrl });
  }
}

export default new EmailService();
