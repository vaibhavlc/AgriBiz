import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import logger from '../config/logger.js';

// Force IPv4 DNS resolution first to prevent ENETUNREACH errors on cloud platforms (Render/AWS) without IPv6 routes
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

// Custom DNS lookup that strictly forces family = 4 (IPv4) for Nodemailer sockets
const customIpv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const lookupOptions = typeof options === 'object' && options ? { ...options, family: 4 } : { family: 4 };
  return dns.lookup(hostname, lookupOptions, (err, address, family) => {
    if (err) return callback(err, address, family);
    callback(null, address, 4);
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env variables are loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class EmailService {
  reloadEnv() {
    dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
  }

  isSmtpConfigured() {
    this.reloadEnv();
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    return Boolean(host && user && pass);
  }

  async resolveIpv4Host(rawHost) {
    if (!rawHost) return 'smtp.gmail.com';
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(rawHost)) {
      return rawHost;
    }
    try {
      const address = await new Promise((resolve, reject) => {
        dns.lookup(rawHost, { family: 4 }, (err, addr) => {
          if (err || !addr) reject(err);
          else resolve(addr);
        });
      });
      return address;
    } catch (e) {
      return rawHost;
    }
  }

  async createRealTransporter() {
    const rawHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    let port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // For Gmail on cloud hosting (Render/AWS), Port 465 Direct SSL is required because Port 587 STARTTLS is blocked/throttled by cloud firewalls
    if (rawHost.includes('gmail.com')) {
      port = 465;
    }

    if (rawHost && user && pass) {
      const targetHostIp = await this.resolveIpv4Host(rawHost);
      const isSecure = port === 465;

      return nodemailer.createTransport({
        host: targetHostIp,
        port,
        family: 4, // Force IPv4 socket connection to prevent ENETUNREACH on IPv6-less cloud hosts like Render
        lookup: customIpv4Lookup,
        secure: isSecure, // true for 465 SSL (Direct TLS), false for 587 STARTTLS
        auth: { user, pass },
        connectionTimeout: 15000, // 15 seconds connection timeout
        greetingTimeout: 15000,   // 15 seconds greeting timeout
        socketTimeout: 20000,     // 20 seconds socket timeout
        tls: {
          rejectUnauthorized: true,
          servername: rawHost,
        },
      });
    }
    return null;
  }

  async getTransporter() {
    if (this.isSmtpConfigured()) {
      return await this.createRealTransporter();
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
      const transporter = await this.createRealTransporter();
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
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[EMAIL SERVICE] SMTP not configured in server/.env. [DEV FALLBACK] Verification link for %s: %s', toEmail, verifyUrl);
        return {
          success: true,
          emailSent: false,
          devLink: verifyUrl,
          message: 'SMTP is not configured in server/.env. Verification link logged to server console for local testing.'
        };
      }
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
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[EMAIL SERVICE] SMTP not configured in server/.env. [DEV FALLBACK] Owner PIN reset link for %s: %s', toEmail, resetUrl);
        return {
          success: true,
          emailSent: false,
          devLink: resetUrl,
          message: 'SMTP is not configured in server/.env. PIN reset link logged to server console for local testing.'
        };
      }
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

  async sendPasswordResetEmail(toEmail, rawToken, userName = 'User') {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    const smtpUser = process.env.SMTP_USER;
    const fromAddress = process.env.EMAIL_FROM || (smtpUser ? `"AgriBiz Suite" <${smtpUser}>` : '"AgriBiz Suite" <no-reply@agribiz.com>');

    const transporter = await this.getTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[EMAIL SERVICE] SMTP not configured in server/.env. [DEV FALLBACK] Password reset link for %s: %s', toEmail, resetUrl);
        return {
          success: true,
          emailSent: false,
          devLink: resetUrl,
          message: 'SMTP is not configured in server/.env. Password reset link logged to server console for local testing.'
        };
      }
      logger.error('[EMAIL SERVICE] Unable to send Password Reset email to %s: Real SMTP host/user/pass not configured.', toEmail);
      const err = new Error('SMTP server is not configured in server/.env.');
      err.code = 'ESMTPNOTCONFIGURED';
      throw err;
    }

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: 'Reset Your Password - AgriBiz Suite',
      html: `
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
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info('[EMAIL SERVICE] Password reset email delivered via Gmail SMTP to %s. MessageID: %s', toEmail, info.messageId);
      return { success: true, emailSent: true, messageId: info.messageId };
    } catch (sendErr) {
      logger.error('[EMAIL SERVICE] SMTP sendMail failed for recipient %s: %s (code: %s)', toEmail, sendErr.message, sendErr.code || 'UNKNOWN');
      throw sendErr;
    }
  }
}

export default new EmailService();
