import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import os from 'os';
import GoogleDriveConfig from '../models/GoogleDriveConfig.js';
import BackupHistory from '../models/BackupHistory.js';
import Company from '../models/Company.js';
import backupService from './backupService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class GoogleDriveService {
  getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/settings/backup/google/callback';
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates Google OAuth Auth URL for connecting Drive.
   */
  getAuthUrl(companyId) {
    const oauth2Client = this.getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: companyId,
    });
  }

  /**
   * Handles OAuth callback code exchange & saves refreshToken securely in GoogleDriveConfig.
   */
  async handleOAuthCallback(code, companyId) {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let googleEmail = '';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      googleEmail = userInfo.data.email || '';
    } catch (err) {
      logger.warn('Failed to fetch Google user email: %s', err.message);
    }

    if (!tokens.refresh_token) {
      const existing = await GoogleDriveConfig.findOne({ companyId }).select('+refreshToken');
      if (!existing || !existing.refreshToken) {
        throw new Error('Google did not return a refresh token. Please revoke access in your Google Account permissions and reconnect.');
      }
      tokens.refresh_token = existing.refreshToken;
    }

    const config = await GoogleDriveConfig.findOneAndUpdate(
      { companyId },
      {
        $set: {
          companyId,
          refreshToken: tokens.refresh_token,
          googleEmail,
          status: 'CONNECTED',
          connectedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logger.info('Google Drive connected successfully for company %s (%s)', companyId, googleEmail);
    return config;
  }

  /**
   * Retrieves authenticated Google OAuth2 Client for company using stored refresh token.
   */
  async getOAuth2ClientForCompany(companyId) {
    const config = await GoogleDriveConfig.findOne({ companyId, status: 'CONNECTED' }).select('+refreshToken');
    if (!config || !config.refreshToken) {
      return null;
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: config.refreshToken });
    return oauth2Client;
  }

  /**
   * Ensures AgriBiz Backups / [Company Name] / Daily | Weekly | Monthly folders exist on Google Drive.
   */
  async ensureBackupFolders(oauth2Client, companyId) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const companyDoc = await Company.findOne({ companyId }).select('businessName').lean();
    const companyName = companyDoc?.businessName || `Company-${companyId}`;

    const config = await GoogleDriveConfig.findOne({ companyId });

    const findOrCreateFolder = async (folderName, parentFolderId = null) => {
      let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
      }

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId ? { parents: [parentFolderId] } : {}),
      };

      const created = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      return created.data.id;
    };

    const rootFolderId = await findOrCreateFolder('AgriBiz Backups');
    const companyFolderId = await findOrCreateFolder(companyName, rootFolderId);
    const dailyFolderId = await findOrCreateFolder('Daily', companyFolderId);
    const weeklyFolderId = await findOrCreateFolder('Weekly', companyFolderId);
    const monthlyFolderId = await findOrCreateFolder('Monthly', companyFolderId);

    const folderIds = { rootFolderId, companyFolderId, dailyFolderId, weeklyFolderId, monthlyFolderId };

    await GoogleDriveConfig.updateOne({ companyId }, { $set: { folderIds } });

    return folderIds;
  }

  /**
   * Unified Single Pipeline: Generates, validates, temporarily stores, uploads, verifies, and applies retention.
   */
  async uploadAndVerifyBackup(companyId, backupType = 'Daily', socketId = null, user = null) {
    const historyId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const startTime = new Date();
    let tempFilePath = null;

    logger.info('Starting %s backup pipeline for company %s (History ID: %s)...', backupType, companyId, historyId);

    try {
      const oauth2Client = await this.getOAuth2ClientForCompany(companyId);
      if (!oauth2Client) {
        throw new Error('Google Drive is not connected for this company.');
      }

      // 1. Generate & Validate Backup
      const backupPayload = await backupService.exportBackup(companyId, user);
      const validation = backupService.validateBackup(backupPayload, companyId);
      if (!validation.valid) {
        throw new Error(`Backup validation failed: ${validation.message}`);
      }

      // 2. Ensure Folder Structure
      const folderIds = await this.ensureBackupFolders(oauth2Client, companyId);
      let targetFolderId = folderIds.dailyFolderId;
      if (backupType === 'Weekly') targetFolderId = folderIds.weeklyFolderId;
      if (backupType === 'Monthly') targetFolderId = folderIds.monthlyFolderId;

      // 3. Formulate Filename & Ephemeral Disk Storage
      const dateStr = startTime.toISOString().split('T')[0];
      const fileName = `agribiz-backup-${companyId}-${backupType.toLowerCase()}-${dateStr}.json`;
      tempFilePath = path.join(os.tmpdir(), `${historyId}.json`);

      fs.writeFileSync(tempFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
      const fileSize = fs.statSync(tempFilePath).size;

      // 4. Upload to Google Drive
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const uploadRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [targetFolderId],
        },
        media: {
          mimeType: 'application/json',
          body: fs.createReadStream(tempFilePath),
        },
        fields: 'id, name, size',
      });

      const driveFileId = uploadRes.data.id;
      if (!driveFileId) {
        throw new Error('Google Drive upload response did not contain a valid file ID.');
      }

      // 5. Verify Upload
      const verifyRes = await drive.files.get({
        fileId: driveFileId,
        fields: 'id, name, size, trashed',
      });

      if (verifyRes.data.trashed || !verifyRes.data.id) {
        throw new Error('Uploaded backup file could not be verified on Google Drive.');
      }

      // 6. Delete Ephemeral Local File
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        tempFilePath = null;
      }

      const endTime = new Date();

      // 7. Record SUCCESS in BackupHistory
      const historyRecord = await BackupHistory.create({
        historyId,
        companyId,
        backupType,
        status: 'SUCCESS',
        fileName,
        driveFileId,
        fileSize,
        createdAt: startTime,
        completedAt: endTime,
        dataSummary: validation.calculatedSummary,
      });

      // Update lastAutoBackupAt in GoogleDriveConfig
      await GoogleDriveConfig.updateOne({ companyId }, { $set: { lastAutoBackupAt: endTime } });

      // 8. Apply Retention Policy (7 Daily, 4 Weekly, 12 Monthly)
      await this.applyRetentionPolicy(oauth2Client, companyId, backupType, targetFolderId);

      await touchCompanyData(companyId, socketId, 'System', 'BACKUP_AUTO');

      logger.info('SUCCESS: %s backup completed and verified for company %s. Drive File ID: %s', backupType, companyId, driveFileId);

      return {
        success: true,
        message: `${backupType} backup successfully uploaded to Google Drive.`,
        historyRecord,
      };
    } catch (error) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
      }

      logger.error('FAILED %s backup pipeline for company %s: %s', backupType, companyId, error.message);

      const historyRecord = await BackupHistory.create({
        historyId,
        companyId,
        backupType,
        status: 'FAILED',
        createdAt: startTime,
        completedAt: new Date(),
        failureReason: error.message,
      });

      return {
        success: false,
        message: `Backup pipeline failed: ${error.message}`,
        historyRecord,
      };
    }
  }

  /**
   * Applies Retention Policy (Deletes older SUCCESSFUL backups past quota limits).
   * Daily: Keep 7, Weekly: Keep 4, Monthly: Keep 12.
   * Failed attempts NEVER trigger retention cleanup.
   */
  async applyRetentionPolicy(oauth2Client, companyId, backupType, targetFolderId) {
    let limit = 7; // Daily
    if (backupType === 'Weekly') limit = 4;
    if (backupType === 'Monthly') limit = 12;

    const successfulBackups = await BackupHistory.find({
      companyId,
      backupType,
      status: 'SUCCESS',
    })
      .sort({ createdAt: -1 })
      .lean();

    if (successfulBackups.length > limit) {
      const backupsToDelete = successfulBackups.slice(limit);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      for (const oldBackup of backupsToDelete) {
        if (oldBackup.driveFileId) {
          try {
            await drive.files.delete({ fileId: oldBackup.driveFileId });
            logger.info('Retention Policy: Deleted old %s backup file %s (ID: %s)', backupType, oldBackup.fileName, oldBackup.driveFileId);
          } catch (err) {
            logger.warn('Retention Policy: Failed to delete Google Drive file %s: %s', oldBackup.driveFileId, err.message);
          }
        }
      }
    }
  }

  /**
   * Disconnects Google Drive for company.
   */
  async disconnectGoogleDrive(companyId) {
    await GoogleDriveConfig.updateOne(
      { companyId },
      { $set: { status: 'DISCONNECTED' } }
    );
    logger.info('Google Drive disconnected for company %s', companyId);
    return { success: true, message: 'Google Drive disconnected successfully. Existing backups in Google Drive remain preserved.' };
  }

  /**
   * Returns Google Drive connection status for company.
   */
  async getStatus(companyId) {
    const config = await GoogleDriveConfig.findOne({ companyId }).lean();
    return {
      connected: config?.status === 'CONNECTED',
      googleEmail: config?.googleEmail || '',
      connectedAt: config?.connectedAt || null,
      lastAutoBackupAt: config?.lastAutoBackupAt || null,
    };
  }

  /**
   * Verifies if a specific Google Drive file ID exists and is active.
   */
  async verifyDriveFile(oauth2Client, driveFileId) {
    if (!oauth2Client || !driveFileId) return false;
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const res = await drive.files.get({
        fileId: driveFileId,
        fields: 'id, name, size, trashed',
      });
      return res.data && !res.data.trashed;
    } catch (err) {
      logger.warn('Drive file verification failed for fileId %s: %s', driveFileId, err.message);
      return false;
    }
  }

  /**
   * On-Demand: Downloads JSON payload for a specific history record from Google Drive.
   */
  async downloadDrivePayload(companyId, historyId) {
    const historyRecord = await BackupHistory.findOne({ historyId, companyId }).lean();
    if (!historyRecord || !historyRecord.driveFileId) {
      throw new Error('Backup history record not found or missing Google Drive reference.');
    }

    const oauth2Client = await this.getOAuth2ClientForCompany(companyId);
    if (!oauth2Client) {
      throw new Error('Google Drive is not connected for this company.');
    }

    const isAvailable = await this.verifyDriveFile(oauth2Client, historyRecord.driveFileId);
    if (!isAvailable) {
      // Mark record as unavailable/failed in history
      await BackupHistory.updateOne(
        { historyId },
        { $set: { failureReason: 'Backup file unavailable or deleted from Google Drive.' } }
      );
      throw new Error('Backup File Unavailable: The file could not be found in your Google Drive account.');
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileRes = await drive.files.get({
      fileId: historyRecord.driveFileId,
      alt: 'media',
    });

    const payload = typeof fileRes.data === 'string' ? JSON.parse(fileRes.data) : fileRes.data;
    return { historyRecord, payload };
  }

  /**
   * Streams a selected Google Drive backup directly to the client HTTP download response.
   */
  async streamDriveFile(companyId, historyId, res) {
    const { historyRecord } = await this.downloadDrivePayload(companyId, historyId);

    const oauth2Client = await this.getOAuth2ClientForCompany(companyId);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileName = historyRecord.fileName || `agribiz-backup-${historyId}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const driveStream = await drive.files.get(
      { fileId: historyRecord.driveFileId, alt: 'media' },
      { responseType: 'stream' }
    );

    driveStream.data.pipe(res);
  }

  /**
   * Returns Backup History list and distinguishes Last Successful Backup vs Latest Attempt.
   */
  async getHistory(companyId) {
    const [history, lastSuccessful, latestAttempt, driveStatus] = await Promise.all([
      BackupHistory.find({ companyId }).sort({ createdAt: -1 }).limit(20).lean(),
      BackupHistory.findOne({ companyId, status: 'SUCCESS' }).sort({ createdAt: -1 }).lean(),
      BackupHistory.findOne({ companyId }).sort({ createdAt: -1 }).lean(),
      this.getStatus(companyId),
    ]);

    return {
      driveStatus,
      lastSuccessfulBackup: lastSuccessful,
      latestAttempt: latestAttempt,
      historyList: history,
    };
  }
}

export default new GoogleDriveService();
