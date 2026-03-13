import cron from 'node-cron';
import { runAllNotificationChecks } from '../services/notifications.service';

export function startNotificationJobs(): void {
  // Run daily at 8:00 AM Lima time — active in both development and production
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[Cron] Running notification jobs...');
      await runAllNotificationChecks().catch((err: unknown) => {
        console.error('[Cron] runAllNotificationChecks failed:', err);
      });
      console.log('[Cron] Notification jobs completed.');
    },
    { timezone: 'America/Lima' }
  );

  const env = process.env['NODE_ENV'] ?? 'development';
  console.log(`[Cron] Notification jobs scheduled — 8:00 AM Lima time (env: ${env}).`);
}

// Expose for manual triggers (e.g. admin endpoint or one-off scripts)
export { runAllNotificationChecks };
