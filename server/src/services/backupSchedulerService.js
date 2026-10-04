import cron from 'node-cron';
import GoogleDriveConfig from '../models/GoogleDriveConfig.js';
import googleDriveService from './googleDriveService.js';
import logger from '../config/logger.js';

class BackupSchedulerService {
  initScheduler() {
    logger.info('Initializing Backend Automatic Backup Scheduler (02:00 AM Asia/Kolkata + Missed Backup Catch-up)...');

    // 1. Scheduled Cron Job: Run every day at 02:00 AM IST (Asia/Kolkata)
    cron.schedule(
      '0 2 * * *',
      async () => {
        logger.info('Cron Triggered: 02:00 AM Daily Automatic Backup Job starting...');
        await this.runScheduledBackups('Cron_02AM');
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );

    // 2. Periodic Hourly Check: Catches up any missed daily backups if server was asleep or restarted
    cron.schedule('0 * * * *', async () => {
      await this.checkAndRunMissedBackups();
    });

    // 3. Immediate Startup Check: Runs 15 seconds after server initialization/boot
    setTimeout(() => {
      this.checkAndRunMissedBackups();
    }, 15000);
  }

  /**
   * Checks if today's automatic backup has been executed for each connected company.
   * If missed (due to cloud server sleep or restart at 2 AM), executes it immediately.
   */
  async checkAndRunMissedBackups() {
    try {
      const activeConfigs = await GoogleDriveConfig.find({ status: 'CONNECTED' }).lean();
      if (!activeConfigs || activeConfigs.length === 0) return;

      const now = new Date();
      // IST date string YYYY-MM-DD
      const todayIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];

      for (const config of activeConfigs) {
        const { companyId, lastAutoBackupAt } = config;

        let lastBackupDate = '';
        if (lastAutoBackupAt) {
          lastBackupDate = new Date(new Date(lastAutoBackupAt).getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
        }

        if (lastBackupDate !== todayIST) {
          logger.info('Catch-up Scheduler: Auto backup for company %s missing for today (%s). Running backup now...', companyId, todayIST);
          await googleDriveService.uploadAndVerifyBackup(companyId, 'Daily');

          if (now.getDate() === 1) {
            await googleDriveService.uploadAndVerifyBackup(companyId, 'Monthly');
          }
        }
      }
    } catch (err) {
      logger.error('Error in checkAndRunMissedBackups: %s', err.message);
    }
  }

  async runScheduledBackups(triggerType = 'Daily') {
    try {
      const activeConfigs = await GoogleDriveConfig.find({ status: 'CONNECTED' }).lean();
      if (!activeConfigs || activeConfigs.length === 0) {
        logger.info('No active Google Drive connections found. Scheduled backup job skipped.');
        return;
      }

      const now = new Date();
      const isFirstOfMonth = now.getDate() === 1;

      logger.info('Executing scheduled automatic backup for %d connected company accounts.', activeConfigs.length);

      for (const config of activeConfigs) {
        const { companyId } = config;
        try {
          logger.info('Running Daily scheduled backup for company %s...', companyId);
          await googleDriveService.uploadAndVerifyBackup(companyId, 'Daily');

          if (isFirstOfMonth) {
            logger.info('Running Monthly scheduled backup for company %s...', companyId);
            await googleDriveService.uploadAndVerifyBackup(companyId, 'Monthly');
          }
        } catch (err) {
          logger.error('Failed scheduled backup for company %s: %s', companyId, err.message);
        }
      }
    } catch (err) {
      logger.error('Scheduler execution error: %s', err.message);
    }
  }
}

export default new BackupSchedulerService();
