import cron from 'node-cron';
import GoogleDriveConfig from '../models/GoogleDriveConfig.js';
import googleDriveService from './googleDriveService.js';
import logger from '../config/logger.js';

class BackupSchedulerService {
  initScheduler() {
    logger.info('Initializing Backend Automatic Backup Scheduler (02:00 AM Asia/Kolkata)...');

    // Run every day at 02:00 AM IST
    cron.schedule(
      '0 2 * * *',
      async () => {
        logger.info('Executing scheduled 02:00 AM daily automatic backup job...');
        await this.runScheduledBackups();
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );
  }

  async runScheduledBackups() {
    try {
      const activeConfigs = await GoogleDriveConfig.find({ status: 'CONNECTED' }).lean();
      if (!activeConfigs || activeConfigs.length === 0) {
        logger.info('No active Google Drive connections found. Scheduled backup job skipped.');
        return;
      }

      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isFirstOfMonth = now.getDate() === 1;

      logger.info('Found %d company accounts connected for automatic backup.', activeConfigs.length);

      for (const config of activeConfigs) {
        const { companyId } = config;
        try {
          // 1. Always run Daily backup
          logger.info('Running Daily scheduled backup for company %s...', companyId);
          await googleDriveService.uploadAndVerifyBackup(companyId, 'Daily');

          // 2. Run Weekly backup on Sundays
          if (isSunday) {
            logger.info('Running Weekly scheduled backup for company %s...', companyId);
            await googleDriveService.uploadAndVerifyBackup(companyId, 'Weekly');
          }

          // 3. Run Monthly backup on 1st of month
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
